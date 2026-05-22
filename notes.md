## Steps to reproduce
1. Run `npm install --legacy-peer-deps` in the repository root so the test tooling is available in this sandbox.
2. Add a regression test that exercises `replaceTaskWithTasks()` when the source task file is already open in an editor.
3. Run `npx jest tests/Obsidian/File.test.ts --runInBand > /tmp/file-test-before-fix.txt 2>&1`.
4. Simulated user action in that test: click a task in query results, let Tasks update the underlying note, then try an editor-style undo.

## Observed
Before the fix, the focused regression test failed. The captured trace is in `/tmp/file-test-before-fix.txt`. The important failure was that the editor line stayed `- [ ] Test task` after the toggle path ran, which showed the code updated the file through `vault.modify()` instead of the open editor. Because the editor history never recorded the change, an undo operation could not restore the original unchecked task in the query display.

## Expected
When a task shown in a query result is toggled and that task belongs to a file that is already open in an editor, Tasks should update that open editor so Obsidian records the change in undo history. After the task disappears from a `not done` query, pressing Undo should restore the original unchecked task line and make it appear in the query results again.
