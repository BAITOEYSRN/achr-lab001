import { writeError, writeSuccess } from "../lib/output.js";
import { Task } from "../models/task.js";
import { getSortedTasks, loadStore, TaskStoreError } from "../storage/taskStore.js";

function formatStatus(completed: boolean): string {
  return completed ? "done" : "pending";
}

function formatTaskLine(task: Task): string {
  const id = task.id.padEnd(36, " ");
  const status = formatStatus(task.completed).padEnd(10, " ");
  return `${id}  ${status}${task.title}`;
}

export function runList(): number {
  try {
    const store = loadStore();
    const tasks = getSortedTasks(store);

    if (tasks.length === 0) {
      writeSuccess("No tasks yet.");
      return 0;
    }

    writeSuccess("ID          STATUS     TITLE");
    for (const task of tasks) {
      writeSuccess(formatTaskLine(task));
    }
    return 0;
  } catch (error) {
    if (error instanceof TaskStoreError) {
      writeError(error.message);
      return 1;
    }
    writeError("Error: Could not read tasks.");
    return 1;
  }
}
