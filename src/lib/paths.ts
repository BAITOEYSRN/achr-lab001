import os from "node:os";
import path from "node:path";

export function getTaskStorePath(): string {
  const override = process.env.TASK_STORE_PATH;
  if (override) {
    return override;
  }

  return path.join(os.homedir(), ".cli-task-manager", "tasks.json");
}
