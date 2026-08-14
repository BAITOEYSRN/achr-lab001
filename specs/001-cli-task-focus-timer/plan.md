# Implementation Plan: CLI Task Manager & Focus Timer

**Branch**: `001-cli-task-focus-timer` | **Date**: 2026-08-14 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-cli-task-focus-timer/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Build a terminal-first task manager with four subcommands (`add`, `list`, `complete`,
`focus`) using Node.js 20+ and TypeScript. Tasks persist in `~/.cli-task-manager/tasks.json`
via synchronous filesystem I/O per ADR 0001. A fixed 25-minute (1500 s) Pomodoro timer
runs in-process with human-readable countdown output. Critical paths (add, complete,
timer) require automated tests before the feature is complete.

## Technical Context

**Language/Version**: Node.js 20+ with TypeScript 5.x

**Primary Dependencies**: `commander` (CLI routing); Node built-in `fs`, `path`, `os`, `crypto`

**Storage**: Local JSON at `~/.cli-task-manager/tasks.json` per ADR 0001 — no SQLite,
better-sqlite3, Sequelize, or in-memory-only production storage

**Testing**: Vitest for unit/integration tests; critical-path coverage for add, complete,
and focus timer (timer tests use injectable clock or short-circuit in test mode)

**Target Platform**: Cross-platform terminal (Windows, macOS, Linux)

**Project Type**: Single-package CLI application

**Performance Goals**: Sub-second response for add/list/complete; timer accuracy within
1 second over 25 minutes

**Constraints**: Offline-only; sync `fs.readFileSync` / `fs.writeFileSync` for persistence;
exactly 1500 s timer; title max 500 characters; forbidden database libraries

**Scale/Scope**: Single user; hundreds of tasks; four commands; one JSON file

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Reference: `.specify/memory/constitution.md` and accepted ADRs in `adr/`.

| Principle | Gate | Pass Criteria | Pre-Design | Post-Design |
|-----------|------|---------------|------------|-------------|
| I. Simplicity-First CLI | Command surface | Four subcommands, minimal flags | ✅ Pass | ✅ Pass |
| II. Local JSON (ADR 0001) | Persistence | `tasks.json` via sync fs I/O only | ✅ Pass | ✅ Pass |
| III. Critical-Path Testing | Test plan | Vitest tests for add, complete, timer | ✅ Pass | ✅ Pass |
| IV. Human-Readable Output | UX | Plain-language stdout/stderr | ✅ Pass | ✅ Pass |
| V. YAGNI | Scope | No web/sync/custom timer | ✅ Pass | ✅ Pass |

**Violations**: None. Complexity Tracking table left empty.

## Project Structure

### Documentation (this feature)

```text
specs/001-cli-task-focus-timer/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── cli-commands.md
└── tasks.md             # Phase 2 output (/speckit-tasks — not yet created)
```

### Source Code (repository root)

```text
src/
├── cli/
│   └── index.ts              # Commander program entry + subcommand registration
├── commands/
│   ├── add.ts
│   ├── list.ts
│   ├── complete.ts
│   └── focus.ts
├── models/
│   └── task.ts               # Task type + validation helpers
├── storage/
│   └── taskStore.ts          # JSON load/save (readFileSync/writeFileSync)
└── lib/
    ├── paths.ts              # Resolve ~/.cli-task-manager/tasks.json
    └── output.ts             # Human-readable message helpers

tests/
├── add.test.ts               # Critical path: add task
├── complete.test.ts          # Critical path: complete task
├── focus.test.ts             # Critical path: focus timer
├── list.test.ts
└── integration/
    └── persistence.test.ts   # Cross-session persistence

package.json
tsconfig.json
vitest.config.ts
```

**Structure Decision**: Single-project CLI layout. Commands are thin wrappers over
`taskStore` and shared output helpers. No repository abstraction layer — direct JSON
read/write keeps scope minimal per constitution Principle I.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| — | — | — |
