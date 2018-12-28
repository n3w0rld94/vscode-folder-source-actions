import * as vscode from 'vscode';
import { extensions } from 'vscode';
import { isUndefined } from 'util';

const conflictExtId: string[] = ['CoenraadS.bracket-pair-colorizer'];
const fakeSelectRange = new vscode.Range(0, 0, 1, 0);
const fakeWholeDocumentRange = new vscode.Range(0, 0, 99999, 0);

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
      location: vscode.ProgressLocation.Window,
      title: 'Organizing Imports in Folder'
    },
    async () => {
      const files = await getPotentialFilesToOrganize(dir);
      for (let i = 0; i < files.length; i++) {
        await organizeImportsEnclosure(files[i]);
      }
      vscode.commands.executeCommand('workbench.files.action.collapseExplorerFolders');
      let response = await vscode.window.showInformationMessage('Would you like to save changes now?', ...['Yes', 'no']);
      if (response === 'Yes') {
        vscode.commands.executeCommand('workbench.files.action.saveAll');
      }
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
    selection: fakeSelectRange
  };
  const editor: vscode.TextEditor = await vscode.window.showTextDocument(file, option);
  while (vscode.window.activeTextEditor !== editor) { }
  vscode.commands.executeCommand('editor.action.organizeImports', file, fakeWholeDocumentRange);
  setTimeout(() => null, 2000);
  return await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
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
