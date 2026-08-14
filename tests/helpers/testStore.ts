import fs from "node:fs";
import os from "node:os";
import path from "node:path";

export function withTempStore<T>(fn: (storePath: string) => T): T {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "task-test-"));
  const storePath = path.join(dir, "tasks.json");
  const previous = process.env.TASK_STORE_PATH;

  process.env.TASK_STORE_PATH = storePath;

  try {
    return fn(storePath);
  } finally {
    if (previous === undefined) {
      delete process.env.TASK_STORE_PATH;
    } else {
      process.env.TASK_STORE_PATH = previous;
    }
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

export async function withTempStoreAsync<T>(
  fn: (storePath: string) => Promise<T>,
): Promise<T> {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "task-test-"));
  const storePath = path.join(dir, "tasks.json");
  const previous = process.env.TASK_STORE_PATH;

  process.env.TASK_STORE_PATH = storePath;

  try {
    return await fn(storePath);
  } finally {
    if (previous === undefined) {
      delete process.env.TASK_STORE_PATH;
    } else {
      process.env.TASK_STORE_PATH = previous;
    }
    fs.rmSync(dir, { recursive: true, force: true });
  }
}
