# VS Code Folder Source Actions

Adds a context menu that allows you to apply VS Code's organize imports code action to all files in a folder:

![Organize imports in folder context menu](https://github.com/mjbvz/vscode-folder-source-actions/raw/master/documentation/menu.png?raw=true)

> **Important 1** — Requires VS Code 1.26+ (the current insiders builds)
> **Important 2** — Not compatible with "Pair Brackets Colorizer" Extension. Make sure you deactivate it before using this extension.

## Supported languages

- VS Code's built-in JavaScript and Typescript support
- Any extension that returns `source.organizeImports` code actions.