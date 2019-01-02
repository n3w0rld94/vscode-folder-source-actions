import * as vscode from 'vscode';
import { extensions } from 'vscode';
import { isUndefined } from 'util';

const conflictExtId: string[] = ['CoenraadS.bracket-pair-colorizer'];

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(vscode.commands.registerCommand('folderSourceActions.organizeImports',
    organizeImportsInDirectory));
}

async function organizeImportsInDirectory(dir: vscode.Uri) {
  //Here we check for uncompatible extensions before running the extension itself.
  let conflictExt: Array<string> = checkConflictingExtensions();
  if (conflictExt.length > 0) {
    await vscode.window.showWarningMessage('The following uncompatible extensions have been detected: ',
      ...conflictExt.map(ext => ext + ', '));
    return;
  }
  //Here starts command execution
  vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: 'Organizing Imports in Folder'
    },
    async (progressObject) => {
      const files = await getPotentialFilesToOrganize(dir);
      for (let i = 0; i < files.length; i++) {
        await organizeImportsEnclosure(files[i]);
        progressObject.report({ message: 'Files updated: ', increment: i * 100 / files.length });
      }
      await vscode.commands.executeCommand('workbench.view.explorer');
      vscode.commands.executeCommand('workbench.files.action.collapseExplorerFolders');
      await vscode.window.showInformationMessage('Operation completed', ...['Ok']);
    });
}

async function getPotentialFilesToOrganize(dir: vscode.Uri): Promise<ReadonlyArray<vscode.Uri>> {
  return vscode.workspace.findFiles(
    { base: dir.fsPath, pattern: '**/*.ts' },
    '**/node_modules/**'
  );
}

async function organizeImportsEnclosure(file: vscode.Uri) {
  try {
    await executeOrganizeImports(file);
  } catch (err) {
    console.log('exception while attempting to execute oragnize imports: ', err.message);
  }
  return undefined;
}

async function executeOrganizeImports(file: vscode.Uri) {
  const option: vscode.TextDocumentShowOptions = {
    preview: false,
  };
  const editor: vscode.TextEditor = await vscode.window.showTextDocument(file, option);
  while (vscode.window.activeTextEditor !== editor) { }
  await vscode.commands.executeCommand('editor.action.organizeImports', file);
  await vscode.commands.executeCommand('editor.action.organizeImports', file);
  return await vscode.commands.executeCommand('workbench.files.action.save');
}

function checkConflictingExtensions() {
  let conflictExt: Array<string> = [];
  conflictExtId.forEach((extensionId) => {
    let ext = extensions.getExtension(extensionId);
    if (!isUndefined(ext) && !ext.isActive) {
      conflictExt.push(formatExtId(ext.id));
    }
  });
  return conflictExt;
}

function formatExtId(extId: string): string {
  let dummy = extId.substr(extId.indexOf('.') + 1);
  dummy.replace('-', ' ');
  let newExtId: string[] = dummy.split(' ');
  newExtId.forEach((word) => {
    word = word.charAt(0).toLocaleUpperCase().concat(word.substr(1));
  });
  return newExtId.join(' ');
}
