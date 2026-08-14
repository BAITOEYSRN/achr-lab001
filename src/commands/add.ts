import { randomUUID } from "node:crypto";
import { writeError, writeSuccess } from "../lib/output.js";
import { createTask, TitleValidationError, validateTitle } from "../models/task.js";
import { loadStore, saveStore, TaskStoreError } from "../storage/taskStore.js";

export function runAdd(titleParts: string[]): number {
  const rawTitle = titleParts.join(" ");

  try {
    const title = validateTitle(rawTitle);
    const store = loadStore();
    const task = createTask(title, randomUUID(), new Date().toISOString());
    store.tasks.push(task);
    saveStore(store);
    writeSuccess(`Added task: ${task.title} (${task.id})`);
    return 0;
  } catch (error) {
    if (error instanceof TitleValidationError) {
      writeError(error.message);
      return 1;
    }
    if (error instanceof TaskStoreError) {
      writeError(error.message);
      return 1;
    }
    writeError("Error: Could not save tasks.");
    return 1;
  }
}
