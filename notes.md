## Steps to reproduce
1. Ran `npm install --legacy-peer-deps` in `/tmp/workspace/WolffM/obsidian-tasks-group-obsidian-tasks` because the fresh clone had an existing `esbuild` peer-dependency conflict during plain `npm install`.
2. Verified the baseline with `npm test -- --runInBand` and `npm run build`.
3. Added a focused regression test in `tests/Obsidian/File.test.ts` covering a query-triggered task toggle while the source file is already open in an editor.
4. Ran `npm test -- --runInBand tests/Obsidian/File.test.ts`.

## Observed
The targeted test failed before the fix. The failure showed that `replaceTaskWithTasks()` did not update the open editor, so the expected editor-backed change never happened: `expect(jest.fn()).toHaveBeenCalledWith(...expected)` and `Number of calls: 0`. Before adding the regression, the code path also reached file-writing logic that logs `Right-hand side of 'instanceof' is not an object` in the mocked test environment, reinforcing that the update bypassed the editor path entirely.

## Expected
When a task is toggled from a query display and that task’s source note is already open in an editor, the plugin should update the editor buffer instead of only writing through the vault. That keeps the change inside the editor’s undo stack, so `Cmd/Ctrl+Z` or Edit → Undo can revert “mark task as completed”, restore the task to its previous unchecked state, and make it appear in the query results again.
