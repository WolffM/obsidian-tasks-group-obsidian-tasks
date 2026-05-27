import type { App } from 'obsidian';

export function resolveQueryFilePath(app: App, sourcePath: string): string {
    if (app.vault.getAbstractFileByPath(sourcePath)) {
        return sourcePath;
    }

    return app.workspace.getActiveFile()?.path ?? sourcePath;
}
