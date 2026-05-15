## Steps to reproduce
1. Install dependencies in the repository with `npm install --legacy-peer-deps` because plain `npm install` hit a peer-dependency resolution error in this environment.
2. Add a regression test that exercises `replaceTaskWithTasks()` for a task toggled from a query result.
3. Run `npm test -- --runInBand tests/Obsidian/File.test.ts`.
4. In Obsidian, the equivalent user flow is: show an incomplete task in a Tasks query, click its checkbox in Reading View, then press Command-Z / Edit → Undo.

## Observed
Before the fix, the new regression test failed because `replaceTaskWithTasks()` never called `vault.process()`. The failure showed `Expected number of calls: 1, Received number of calls: 0`, which means the code was still writing through `vault.modify()`. In the real UI, that matches the reported behavior: the task becomes done and disappears from the query, but Undo does not restore it as not done.

## Expected
Completing a task from a Tasks query should use the Obsidian file-edit path that participates in the editor undo stack. After clicking the query checkbox to mark the task done, pressing Command-Z or choosing Edit → Undo should restore the original unchecked task line so the task reappears in the query results.
