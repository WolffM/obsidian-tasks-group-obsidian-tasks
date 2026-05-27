## Steps to reproduce
1. Install dependencies with `npm install --legacy-peer-deps` in the repository root.
2. Run the focused repro test command:
   `npm test -- --runInBand tests/Renderer/QueryFilePathResolver.test.ts`
3. Use a query context where the renderer receives a non-vault source path (for example, a side-panel style source such as `side-panel://view`) and where Obsidian has an active file open (`Active Note.md`).
4. Observe the resolved query file path returned by `resolveQueryFilePath`.

## Observed
Before the fix, the test failed because the query path resolver returned the side-panel source value (`side-panel://view`) instead of the actual active note path. The failing assertion was:
`Expected: "Active Note.md"`
`Received: "side-panel://view"`
This means placeholders like `{{query.file.path}}` in side-panel scenarios would not target the current document.

## Expected
When a Tasks query is rendered from a side panel or any context where `sourcePath` does not resolve to a vault file, the resolver should fall back to the current active note path. That allows path-based filters and query placeholders (for example presets such as `this_file`) to correctly operate on the active document instead of a non-file pseudo-path.
