import * as vscode from 'vscode';

const fakeSelectRange = new vscode.Range(0, 0, 1, 0);
const fakeWholeDocumentRange = new vscode.Range(0, 0, 99999, 0);

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(vscode.commands.registerCommand('folderSourceActions.organizeImports',
    organizeImportsInDirectory));
}

async function organizeImportsInDirectory(dir: vscode.Uri) {
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
      return await vscode.commands.executeCommand('workbench.action.closeAllEditor');
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

async function executeOrganizeImports(file: vscode.Uri): Promise<ReadonlyArray<vscode.CodeAction> | undefined> {
  const option: vscode.TextDocumentShowOptions = {
    preview: false,
    selection: fakeSelectRange
  };
  const editor: vscode.TextEditor = await vscode.window.showTextDocument(file, option);
  while (vscode.window.activeTextEditor !== editor) { }
  return await vscode.commands.executeCommand('editor.action.organizeImports', file, fakeWholeDocumentRange);
}
