import * as vscode from 'vscode';

const fakeWholeDocumentRange = new vscode.Range(0, 0, 99999, 0);

export function activate(context: vscode.ExtensionContext) {
    context.subscriptions.push(
        vscode.commands.registerCommand('folderSourceActions.organizeImports', organizeImportsInDirectory));
}

async function organizeImportsInDirectory(dir: vscode.Uri) {
    vscode.window.withProgress(
        {
            location: vscode.ProgressLocation.Window,
            title: "Organizing Imports in Folder"
        },
        async () => {
            const files = await getPotentialFilesToOrganize(dir);
            return Promise.all(files.map(organizeImportsEnclosure));
        });
}

async function getPotentialFilesToOrganize(
    dir: vscode.Uri
): Promise<ReadonlyArray<vscode.Uri>> {
    return vscode.workspace.findFiles(
        { base: dir.fsPath, pattern: '**/*' },
        '**/node_modules/**');
}

async function organizeImportsEnclosure(
    file: vscode.Uri
) {
    try {
        await executeOrganizeImports(file);
    } catch  {
        // noop
    }
    return undefined;
}

function executeOrganizeImports(file: vscode.Uri): Thenable<ReadonlyArray<vscode.CodeAction> | undefined> {
    return vscode.workspace.openTextDocument(file).then(() =>
        vscode.commands.executeCommand('editor.action.organizeImports', file, fakeWholeDocumentRange));
}
