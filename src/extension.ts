import * as vscode from 'vscode';
import { finalize, revertExplorer, checkConflictingExtensions } from './helper';
import { findInDirectory } from './helper';

const command: Map<string, string> = new Map([
  ["Organize Imports", "editor.action.organizeImports"],
  ["Format File", "editor.action.formatDocument"]
]);
const conflictExtId: string[] = ['coenraads.bracket-pair-colorizer'];
let commandToExecute: string;
let disableActionsOnSave: boolean = true;

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(vscode.commands.registerCommand('folderSourceActions.organizeImports',
    organizeImportsInDirectory));
}

async function organizeImportsInDirectory(dir: vscode.Uri) {
  // We ask user for user preferences
  vscode.workspace.getConfiguration().update('files.autoSave', 'off', vscode.ConfigurationTarget.Workspace);
  const commandPicked = await vscode.window.showQuickPick([...command.keys()], {
    canPickMany: false,
    placeHolder: 'Select a command to execute ...'
  });
  if (!commandPicked) { return; }
  commandToExecute = <string>command.get(commandPicked);
  disableActionsOnSave = await vscode.window.showInformationMessage('Do you want to deactivate all code actions on save to improve performance?'
    + '\nNote: This will not affect your user settings.', ...['yes', 'no']) === 'yes';

  //Here we check for uncompatible extensions before running the extension itself.
  let conflictExt: Array<string> = checkConflictingExtensions(conflictExtId);
  if (conflictExt.length > 0) {
    await vscode.window.showWarningMessage('The following uncompatible extensions have been detected,' +
      'disable before proceeding: ' + conflictExt.map(ext => ext + ', '), 'ok');
    return;
  }
  //Here starts command execution
  let i = 0;
  const notificationMessage = commandToExecute + ' executing in folder';
  const initiallyOpenedFiles = [...vscode.window.visibleTextEditors.map((a) => a.document.uri)];
  const files = await findInDirectory(dir, '.ts');
  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: notificationMessage,
      cancellable: true
    },
    async (progressObject, cancel) => {
      // We want to preserve open editors, so we store the correspondent URIs.
      for (i = 0; i < files.length; i++) {
        await organizeImportsEnclosure(files[i]);
        progressObject.report({ message: 'updated ' + (i + 1) + ' files.', increment: 100 / files.length });
        if (cancel.isCancellationRequested) {
          await revertExplorer();
          await vscode.window.showInformationMessage('Operation Interrupted, no change have been saved.', 'Ok');
          return;
        }
      }
    });
  const response = await vscode.window.showInformationMessage('Operation completed: ' + 'updated ' + (i + 1) + ' files.\nDo you want to save changes?(changes reverted by default)', ...['Yes', 'No']);
  if (response && response === 'Yes') {
    await vscode.commands.executeCommand('workbench.action.files.saveAll');
  } else {
    await vscode.window.showInformationMessage('Changes reverted', 'Ok');
  }
  await finalize(initiallyOpenedFiles);

}

async function organizeImportsEnclosure(file: vscode.Uri) {
  try {
    await executeOrganizeImports(file);
  } catch (err) {
    console.log('exception while attempting to execute organize imports: ', err.message);
  }
  return undefined;
}

async function executeOrganizeImports(file: vscode.Uri) {
  const option: vscode.TextDocumentShowOptions = {
    preview: false,
  };
  const editor: vscode.TextEditor = await vscode.window.showTextDocument(file, option);
  while (vscode.window.activeTextEditor !== editor) { }
  await vscode.commands.executeCommand(commandToExecute, file);
  if (!disableActionsOnSave) {
    await vscode.commands.executeCommand('workbench.action.files.save');
  }
}

