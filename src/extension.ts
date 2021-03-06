import * as vscode from 'vscode';
import { extensions } from 'vscode';

const conflictExtId: string[] = ['coenraads.bracket-pair-colorizer'];
let disableActionsOnSave: boolean = true;

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(vscode.commands.registerCommand('folderSourceActions.organizeImports',
    organizeImportsInDirectory));
}

async function organizeImportsInDirectory(dir: vscode.Uri) {
  // We ask user if he wants to deactivate code actions on save.
  const response = await vscode.window.showInformationMessage('Do you want to deactivate all code actions on save to improve performance?'
    + '\nNote: This will not affect your user settings.', ...['yes', 'no']);
  disableActionsOnSave = (response === 'yes');
  //Here we check for uncompatible extensions before running the extension itself.
  let conflictExt: Array<string> = checkConflictingExtensions();
  if (conflictExt.length > 0) {
    await vscode.window.showWarningMessage('The following uncompatible extensions have been detected: ' +
      conflictExt.map(ext => ext + ', '), 'ok');
    return;
  }
  //Here starts command execution
  let i = 0;
  const notificationMessage = 'Organizing Imports in Folder';
  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: notificationMessage,
      cancellable: true
    },
    async (progressObject, cancel) => {
      // We want to preserve open editors, so we store the correspondent URIs.
      const initiallyOpenedFiles = [...vscode.window.visibleTextEditors.map((a) => a.document.uri)];
      const files = await getPotentialFilesToOrganize(dir);
      for (i = 0; i < files.length; i++) {
        await organizeImportsEnclosure(files[i]);
        progressObject.report({ message: 'updated ' + (i + 1) + ' files.', increment: 100 / files.length });
        if (cancel.isCancellationRequested) {
          await finalize(initiallyOpenedFiles);
          await vscode.window.showInformationMessage('Operation Interrupted', ...['Ok']);
          return;
        }
      }
      await finalize(initiallyOpenedFiles);
    });
  await vscode.window.showInformationMessage('Operation completed: ' + 'updated ' + (i + 1) + ' files.', 'Ok');

  async function finalize(initiallyOpenedFiles: vscode.Uri[]) {
    await vscode.commands.executeCommand('workbench.action.files.saveAll');
    vscode.commands.executeCommand('workbench.action.closeAllEditors');
    await vscode.commands.executeCommand('workbench.view.explorer');
    await vscode.commands.executeCommand('workbench.files.action.collapseExplorerFolders');
    initiallyOpenedFiles.forEach(async (fileUri) => vscode.window.showTextDocument(fileUri));
  }
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
  if (!disableActionsOnSave) {
    await vscode.commands.executeCommand('workbench.action.files.save');
  }
}

function checkConflictingExtensions() {
  let conflictExt: Array<string> = [];
  conflictExtId.forEach((extensionId) => {
    let ext = extensions.getExtension(extensionId);
    if (ext && !ext.isActive) {
      conflictExt.push(formatExtId(ext.id));
    }
  });
  return conflictExt;
}

function formatExtId(extId: string): string {
  let dummy = extId.substr(extId.indexOf('.') + 1);
  return dummy;
}
