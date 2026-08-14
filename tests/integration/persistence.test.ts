import fs from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { runAdd } from "../../src/commands/add.js";
import { loadStore } from "../../src/storage/taskStore.js";
import { withTempStore } from "../helpers/testStore.js";

describe("persistence integration", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("persists tasks across reloads of the store", () => {
    withTempStore((storePath) => {
      vi.spyOn(console, "log").mockImplementation(() => {});

      runAdd(["Buy milk"]);

      expect(fs.existsSync(storePath)).toBe(true);

      const firstLoad = loadStore();
      expect(firstLoad.tasks).toHaveLength(1);
      expect(firstLoad.tasks[0]?.title).toBe("Buy milk");

      const fileContents = fs.readFileSync(storePath, "utf8");
      const reloaded = JSON.parse(fileContents) as { tasks: Array<{ title: string }> };
      expect(reloaded.tasks).toHaveLength(1);
      expect(reloaded.tasks[0]?.title).toBe("Buy milk");
    });
  });
});
