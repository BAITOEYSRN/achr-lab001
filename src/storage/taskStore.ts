import fs from "node:fs";
import path from "node:path";
import { getTaskStorePath } from "../lib/paths.js";
import { Task, TaskStore } from "../models/task.js";

export class TaskStoreError extends Error {
  readonly code: "INVALID_JSON" | "WRITE_FAILED" | "READ_FAILED";

  constructor(message: string, code: TaskStoreError["code"]) {
    super(message);
    this.name = "TaskStoreError";
    this.code = code;
  }
}

function ensureStoreDirectory(storePath: string): void {
  const dir = path.dirname(storePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function isValidTask(value: unknown): value is Task {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const task = value as Record<string, unknown>;
  return (
    typeof task.id === "string" &&
    typeof task.title === "string" &&
    typeof task.completed === "boolean" &&
    typeof task.createdAt === "string"
  );
}

export function loadStore(): TaskStore {
  const storePath = getTaskStorePath();

  if (!fs.existsSync(storePath)) {
    return { tasks: [] };
  }

  let raw: string;
  try {
    raw = fs.readFileSync(storePath, "utf8");
  } catch {
    throw new TaskStoreError("Error: Could not read tasks.", "READ_FAILED");
  }

  if (raw.trim().length === 0) {
    return { tasks: [] };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new TaskStoreError(
      `Error: Task store file is invalid. Path: ${storePath}`,
      "INVALID_JSON",
    );
  }

  if (
    typeof parsed !== "object" ||
    parsed === null ||
    !Array.isArray((parsed as TaskStore).tasks)
  ) {
    throw new TaskStoreError(
      `Error: Task store file is invalid. Path: ${storePath}`,
      "INVALID_JSON",
    );
  }

  const tasks = (parsed as TaskStore).tasks;
  if (!tasks.every(isValidTask)) {
    throw new TaskStoreError(
      `Error: Task store file is invalid. Path: ${storePath}`,
      "INVALID_JSON",
    );
  }

  return { tasks };
}

export function saveStore(store: TaskStore): void {
  const storePath = getTaskStorePath();

  try {
    ensureStoreDirectory(storePath);
    fs.writeFileSync(storePath, `${JSON.stringify(store, null, 2)}\n`, "utf8");
  } catch {
    throw new TaskStoreError("Error: Could not save tasks.", "WRITE_FAILED");
  }
}

export function getSortedTasks(store: TaskStore): Task[] {
  return [...store.tasks].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
}
