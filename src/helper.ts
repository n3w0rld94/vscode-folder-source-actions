import * as vscode from 'vscode';
import { extensions } from 'vscode';

export async function finalize(initiallyOpenedFiles: vscode.Uri[]) {
    vscode.commands.executeCommand('workbench.action.closeAllEditors');
    revertExplorer();
    initiallyOpenedFiles.forEach((fileUri) => vscode.window.showTextDocument(fileUri));
}

export async function revertExplorer() {
    await vscode.commands.executeCommand('workbench.view.explorer');
    await vscode.commands.executeCommand('workbench.files.action.collapseExplorerFolders');
}

export function checkConflictingExtensions(conflictExtId: string[]) {
    let conflictExt: Array<string> = [];
    conflictExtId.forEach((extensionId: string) => {
        let ext = extensions.getExtension(extensionId);
        if (ext && !ext.isActive) {
            conflictExt.push(formatExtId(ext.id));
        }
    });
    return conflictExt;
}

export async function findInDirectory(dir: vscode.Uri, type: string): Promise<ReadonlyArray<vscode.Uri>> {
    return vscode.workspace.findFiles(
        { base: dir.fsPath, pattern: '**/*' + type },
        '**/node_modules/**'
    );
}

function formatExtId(extId: string): string {
    let dummy = extId.substr(extId.indexOf('.') + 1);
    return dummy;
}
