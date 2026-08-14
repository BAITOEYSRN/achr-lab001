import { writeError, writeSuccess } from "../lib/output.js";
import { loadStore, saveStore, TaskStoreError } from "../storage/taskStore.js";

export function runComplete(id: string | undefined): number {
  if (!id || id.trim().length === 0) {
    writeError("Error: Task ID is required.");
    return 1;
  }

  try {
    const store = loadStore();
    const task = store.tasks.find((item) => item.id === id);

    if (!task) {
      writeError(`Error: Task not found: ${id}`);
      return 1;
    }

    if (task.completed) {
      writeSuccess(`Task already completed: ${task.title}`);
      return 0;
    }

    task.completed = true;
    saveStore(store);
    writeSuccess(`Completed task: ${task.title}`);
    return 0;
  } catch (error) {
    if (error instanceof TaskStoreError) {
      writeError(error.message);
      return 1;
    }
    writeError("Error: Could not save tasks.");
    return 1;
  }
}
