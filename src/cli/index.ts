#!/usr/bin/env node
import { Command } from "commander";
import { runAdd } from "../commands/add.js";
import { runComplete } from "../commands/complete.js";
import { runFocus, registerFocusInterruptHandler } from "../commands/focus.js";
import { runList } from "../commands/list.js";

const program = new Command();

program
  .name("task")
  .description("CLI Task Manager & Focus Timer")
  .version("1.0.0");

program
  .command("add")
  .description("Add a new task")
  .argument("<title...>", "task title")
  .action((titleParts: string[]) => {
    process.exit(runAdd(titleParts));
  });

program
  .command("list")
  .description("List all tasks")
  .action(() => {
    process.exit(runList());
  });

program
  .command("complete")
  .description("Mark a task complete by ID")
  .argument("<id>", "task ID from list output")
  .action((id: string) => {
    process.exit(runComplete(id));
  });

program
  .command("focus")
  .description("Start a 25-minute focus timer")
  .action(async () => {
    const controller = new AbortController();
    const cleanup = registerFocusInterruptHandler(() => {
      controller.abort();
    });

    try {
      const code = await runFocus({ signal: controller.signal });
      process.exit(code);
    } finally {
      cleanup();
    }
  });

program.parseAsync(process.argv).catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Unexpected error.");
  process.exit(1);
});
