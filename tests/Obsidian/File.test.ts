import { readFileSync } from 'fs';
import { verify } from 'approvals/lib/Providers/Jest/JestApprovals';
import moment from 'moment';
import { findLineNumberOfTaskToToggle, initializeFile, replaceTaskWithTasks } from '../../src/Obsidian/File';
import type { MockTogglingDataForTesting } from '../../src/lib/MockDataCreator';
import { TaskBuilder } from '../TestingTools/TaskBuilder';

jest.mock('obsidian');

/**
 * A function to help test File.findLineNumberOfTaskToToggle()
 *
 * It uses mock data to simulate user behaviour.
 *
 * This is a fragile method of testing, but right now is better than no automated
 * testing at all.
 *
 * Input files for {@link jsonFileName} are in `tests/__test_data__/MockDataForTogglingTasks`
 * They are created by:
 *   1. setting logDataForMocking to true in File.ts.
 *   2. Running a local build on the plugin
 *   3. Showing the console
 *   4. Setting up a small markdown file with the scenario to test
 *   5. Working the steps required to make the toggle operation fail
 *   6. Grabbing the console output
 *   7. Pasting it in to a new JSON file in `tests/__test_data__/MockDataForTogglingTasks`
 *   8. Auto-formatting the JSON so that it is readable.
 * @param jsonFileName
 * @param taskLineToToggle
 * @param expectedLineNumber
 * @param actualIncorrectLineFound - optional, only needed if the wrong line would be toggled.
 */
function testFindLineNumberOfTaskToToggle(
    jsonFileName: string,
    taskLineToToggle: string,
    expectedLineNumber: number | undefined,
    actualIncorrectLineFound?: string,
) {
    // Arrange
    const data = readFileSync('tests/__test_data__/MockDataForTogglingTasks/' + jsonFileName, 'utf-8');
    const everything: MockTogglingDataForTesting = JSON.parse(data);
    expect(everything.taskData.originalMarkdown).toEqual(taskLineToToggle);

    // Act
    const originalTask = everything.taskData;
    const fileLines = everything.fileData.fileLines;
    const listItemsCache = everything.cacheData.listItemsCache;

    let errorString: string | undefined;
    const captureError = (message: string) => {
        errorString = message;
    };

    const result = findLineNumberOfTaskToToggle(
        originalTask,
        fileLines,
        listItemsCache,
        captureError.bind(errorString),
    );

    // Assert
    let descriptionOfOutcome = '';
    if (errorString !== undefined) {
        descriptionOfOutcome = errorString;
    } else if (result === undefined) {
        descriptionOfOutcome = 'Could not find line for task';
    } else {
        descriptionOfOutcome = 'Success. Line found OK. No error reported.';
    }
    verify(descriptionOfOutcome);

    if (expectedLineNumber !== undefined) {
        expect(result).not.toBeUndefined();
        expect(result).toEqual(expectedLineNumber);

        const expectedLine = actualIncorrectLineFound ? actualIncorrectLineFound : everything.taskData.originalMarkdown;
        expect(everything.fileData.fileLines[result!]).toEqual(expectedLine);
    } else {
        expect(result).toBeUndefined();
    }
}

describe('replaceTaskWithTasks', () => {
    it('valid 2-task test', () => {
        const jsonFileName = 'single_task_valid_data.json';
        const taskLineToToggle = '- [ ] #task task 2';
        const expectedLineNumber = 5;
        testFindLineNumberOfTaskToToggle(jsonFileName, taskLineToToggle, expectedLineNumber);
    });

    // --------------------------------------------------------------------------------
    // Issue 688
    it('issue 688 - block referenced task', () => {
        const jsonFileName = '688_toggle_block_referenced_line_overwrites_wrong_line.json';
        const taskLineToToggle = '- [ ] #task task2b ^ca47c7';

        const expectedLineNumber = 8;
        testFindLineNumberOfTaskToToggle(jsonFileName, taskLineToToggle, expectedLineNumber);
    });

    // --------------------------------------------------------------------------------
    // Issue 1680
    it('issue 1680 - Cannot read properties of undefined', () => {
        const jsonFileName = '1680_task_line_number_past_end_of_file.json';
        const taskLineToToggle = '- [ ] #task Section 2/Task 2';

        const expectedLineNumber = 9;
        testFindLineNumberOfTaskToToggle(jsonFileName, taskLineToToggle, expectedLineNumber);
    });

    // --------------------------------------------------------------------------------
});

describe('replaceTaskWithTasks with open editor', () => {
    beforeAll(() => {
        window.moment = moment;
    });

    it('should prefer the open editor for task updates, preserving editor undo history', async () => {
        const originalTask = new TaskBuilder().path('tasks.md').lineNumber(0).description('Test task').build();
        const toggledTasks = originalTask.toggleWithRecurrenceInUsersOrder();
        const file = {
            path: 'tasks.md',
            extension: 'md',
        };

        const editor = {
            getLine: jest.fn().mockReturnValue(originalTask.originalMarkdown),
            lineCount: jest.fn().mockReturnValue(1),
            replaceRange: jest.fn(),
        };

        const workspace = {
            activeEditor: {
                file,
                editor,
            },
            getLeavesOfType: jest.fn().mockReturnValue([]),
        };

        const vault = {
            getAbstractFileByPath: jest.fn().mockReturnValue(file),
            read: jest.fn().mockResolvedValue(originalTask.originalMarkdown),
            modify: jest.fn(),
        };

        const metadataCache = {
            getFileCache: jest.fn().mockReturnValue({
                listItems: [
                    {
                        position: {
                            start: {
                                line: 0,
                            },
                        },
                        task: {},
                    },
                ],
            }),
        };

        initializeFile({
            metadataCache: metadataCache as any,
            vault: vault as any,
            workspace: workspace as any,
        });

        await replaceTaskWithTasks({
            originalTask,
            newTasks: toggledTasks,
        });

        expect(editor.replaceRange).toHaveBeenCalledWith(
            toggledTasks[0].toFileLineString(),
            { line: 0, ch: 0 },
            { line: 0, ch: originalTask.originalMarkdown.length },
            'tasks',
        );
        expect(vault.modify).not.toHaveBeenCalled();
    });
});
