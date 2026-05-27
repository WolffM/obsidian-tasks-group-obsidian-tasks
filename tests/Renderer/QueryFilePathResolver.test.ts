import { resolveQueryFilePath } from '../../src/Renderer/QueryFilePathResolver';

describe('resolveQueryFilePath', () => {
    it('keeps sourcePath when it resolves to a vault file', () => {
        const app = {
            workspace: {
                getActiveFile: () => ({ path: 'Active Note.md' }),
            },
            vault: {
                getAbstractFileByPath: (path: string) => ({ path }),
            },
        };

        expect(resolveQueryFilePath(app as any, 'folder/Query.md')).toEqual('folder/Query.md');
    });

    it('uses the active file path when sourcePath cannot be resolved to a file', () => {
        const app = {
            workspace: {
                getActiveFile: () => ({ path: 'Active Note.md' }),
            },
            vault: {
                getAbstractFileByPath: (_path: string) => null,
            },
        };

        expect(resolveQueryFilePath(app as any, 'side-panel://view')).toEqual('Active Note.md');
    });

    it('falls back to sourcePath if neither source file nor active file is available', () => {
        const app = {
            workspace: {
                getActiveFile: () => null,
            },
            vault: {
                getAbstractFileByPath: (_path: string) => null,
            },
        };

        expect(resolveQueryFilePath(app as any, 'side-panel://view')).toEqual('side-panel://view');
    });
});
