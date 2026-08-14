import fs from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { runAdd } from "../src/commands/add.js";
import { loadStore } from "../src/storage/taskStore.js";
import { withTempStore } from "./helpers/testStore.js";

describe("add command", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("adds a valid task and confirms with id", () => {
    withTempStore(() => {
      const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      const code = runAdd(["Buy", "milk"]);

      expect(code).toBe(0);
      expect(logSpy).toHaveBeenCalledWith(
        expect.stringMatching(/^Added task: Buy milk \([0-9a-f-]{36}\)$/),
      );

      const store = loadStore();
      expect(store.tasks).toHaveLength(1);
      expect(store.tasks[0]?.title).toBe("Buy milk");
      expect(store.tasks[0]?.completed).toBe(false);
    });
  });

  it("rejects empty title", () => {
    withTempStore(() => {
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const code = runAdd(["   "]);

      expect(code).toBe(1);
      expect(errorSpy).toHaveBeenCalledWith("Error: Task title cannot be empty.");
      expect(loadStore().tasks).toHaveLength(0);
    });
  });

  it("rejects title longer than 500 characters", () => {
    withTempStore(() => {
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const code = runAdd(["a".repeat(501)]);

      expect(code).toBe(1);
      expect(errorSpy).toHaveBeenCalledWith(
        "Error: Task title must be 500 characters or fewer.",
      );
      expect(loadStore().tasks).toHaveLength(0);
    });
  });

  it("reports corrupt JSON store without overwriting file", () => {
    withTempStore((storePath) => {
      fs.mkdirSync(path.dirname(storePath), { recursive: true });
      fs.writeFileSync(storePath, "{not valid json", "utf8");

      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const code = runAdd(["Test task"]);

      expect(code).toBe(1);
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining("Error: Task store file is invalid. Path:"),
      );
      expect(fs.readFileSync(storePath, "utf8")).toBe("{not valid json");
    });
  });
});
