import fs from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { runComplete } from "../src/commands/complete.js";
import { loadStore } from "../src/storage/taskStore.js";
import { withTempStore } from "./helpers/testStore.js";

const TASK_ID = "11111111-1111-1111-1111-111111111111";

function seedTask(storePath: string, completed = false): void {
  fs.mkdirSync(storePath.replace(/tasks\.json$/, ""), { recursive: true });
  fs.writeFileSync(
    storePath,
    JSON.stringify(
      {
        tasks: [
          {
            id: TASK_ID,
            title: "Finish lab",
            completed,
            createdAt: "2026-08-14T10:00:00.000Z",
          },
        ],
      },
      null,
      2,
    ),
    "utf8",
  );
}

describe("complete command", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("marks a pending task complete", () => {
    withTempStore((storePath) => {
      seedTask(storePath);
      const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      const code = runComplete(TASK_ID);

      expect(code).toBe(0);
      expect(logSpy).toHaveBeenCalledWith("Completed task: Finish lab");
      expect(loadStore().tasks[0]?.completed).toBe(true);
    });
  });

  it("reports already completed task", () => {
    withTempStore((storePath) => {
      seedTask(storePath, true);
      const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      const code = runComplete(TASK_ID);

      expect(code).toBe(0);
      expect(logSpy).toHaveBeenCalledWith("Task already completed: Finish lab");
    });
  });

  it("reports missing task id", () => {
    withTempStore((storePath) => {
      seedTask(storePath);
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const code = runComplete(undefined);

      expect(code).toBe(1);
      expect(errorSpy).toHaveBeenCalledWith("Error: Task ID is required.");
    });
  });

  it("reports task not found", () => {
    withTempStore((storePath) => {
      seedTask(storePath);
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const code = runComplete("00000000-0000-0000-0000-000000000000");

      expect(code).toBe(1);
      expect(errorSpy).toHaveBeenCalledWith(
        "Error: Task not found: 00000000-0000-0000-0000-000000000000",
      );
    });
  });
});
