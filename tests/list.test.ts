import fs from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { runList } from "../src/commands/list.js";
import { withTempStore } from "./helpers/testStore.js";

describe("list command", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows empty message when no tasks exist", () => {
    withTempStore(() => {
      const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      const code = runList();

      expect(code).toBe(0);
      expect(logSpy).toHaveBeenCalledWith("No tasks yet.");
    });
  });

  it("lists tasks with status labels", () => {
    withTempStore((storePath) => {
      fs.mkdirSync(storePath.replace(/tasks\.json$/, ""), { recursive: true });
      fs.writeFileSync(
        storePath,
        JSON.stringify(
          {
            tasks: [
              {
                id: "11111111-1111-1111-1111-111111111111",
                title: "Pending task",
                completed: false,
                createdAt: "2026-08-14T10:00:00.000Z",
              },
              {
                id: "22222222-2222-2222-2222-222222222222",
                title: "Done task",
                completed: true,
                createdAt: "2026-08-14T11:00:00.000Z",
              },
            ],
          },
          null,
          2,
        ),
        "utf8",
      );

      const lines: string[] = [];
      vi.spyOn(console, "log").mockImplementation((line?: unknown) => {
        lines.push(String(line));
      });

      const code = runList();

      expect(code).toBe(0);
      expect(lines[0]).toBe("ID          STATUS     TITLE");
      expect(lines.some((line) => line.includes("pending") && line.includes("Pending task"))).toBe(
        true,
      );
      expect(lines.some((line) => line.includes("done") && line.includes("Done task"))).toBe(true);
    });
  });

  it("reports corrupt JSON without overwriting the file", () => {
    withTempStore((storePath) => {
      fs.mkdirSync(storePath.replace(/tasks\.json$/, ""), { recursive: true });
      fs.writeFileSync(storePath, "{not valid json", "utf8");

      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const code = runList();

      expect(code).toBe(1);
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining("Error: Task store file is invalid. Path:"),
      );
      expect(fs.readFileSync(storePath, "utf8")).toBe("{not valid json");
    });
  });
});
