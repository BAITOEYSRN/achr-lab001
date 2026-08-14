# Research: CLI Task Manager & Focus Timer

**Feature**: `001-cli-task-focus-timer` | **Date**: 2026-08-14

Phase 0 resolves all technical unknowns from the plan. User-provided stack constraints
were treated as decisions; remaining choices were researched against constitution and spec.

---

## 1. Task identification for `complete`

**Decision**: Use opaque task **ID** (UUID v4 via `crypto.randomUUID()`) shown in
`list` output; `complete` accepts the ID as its sole argument.

**Rationale**: IDs are stable if list sort order changes. List position breaks when
tasks are reordered or filtered. UUIDs require no counter state in the JSON file.

**Alternatives considered**:
- **List position (1-based index)**: Simpler UX after `list`, but fragile if sort order
  changes between list and complete.
- **Title match**: Ambiguous when duplicate titles are allowed (per spec).

---

## 2. JSON file shape and I/O

**Decision**: Store `{ "tasks": Task[] }` at `~/.cli-task-manager/tasks.json`.
Use `fs.readFileSync` + `JSON.parse` on load; `JSON.stringify(data, null, 2)` +
`fs.writeFileSync` on save. Create directory with `fs.mkdirSync({ recursive: true })`
when missing.

**Rationale**: Matches user mandate and ADR 0001. Pretty-printed JSON aids debugging
(human-readable storage). Sync I/O is acceptable for single-user CLI scale.

**Alternatives considered**:
- **Flat array file**: Simpler parse but harder to extend metadata later.
- **Async fs promises**: Non-blocking but adds complexity with no user benefit at this scale.
- **SQLite / in-memory**: Forbidden by ADR 0001 and user constraints.

---

## 3. CLI framework and command UX

**Decision**: `commander` with program name `task` and subcommands: `add`, `list`,
`complete`, `focus`. Global `--help` per subcommand.

**Rationale**: User-specified. Commander is the de facto Node CLI router; subcommand
pattern maps 1:1 to spec flows.

**Command shapes** (see [contracts/cli-commands.md](./contracts/cli-commands.md)):
- `task add <title...>` — title is remaining args joined by space
- `task list`
- `task complete <id>`
- `task focus`

**Alternatives considered**:
- **yargs / citty**: Equivalent capability; user specified commander.
- **Single positional mode**: Less discoverable than subcommands.

---

## 4. Focus timer implementation

**Decision**: In-process countdown of exactly **1500 seconds** (25 minutes). Emit
remaining time to stdout every 60 seconds; on completion print a plain-language message
and ASCII bell (`\u0007`). Handle `SIGINT` with a cancellation message and clean exit.

**Rationale**: Meets FR-007/FR-008. No external timer service. Minute ticks balance
feedback vs terminal noise.

**Alternatives considered**:
- **Silent wait until end**: Fails human-readable progress requirement.
- **Configurable duration**: Out of scope per spec.

**Testing approach**: Export timer logic with injectable `now`/`sleep` or a
`durationSeconds` override in test-only factory so tests do not run 25 minutes.

---

## 5. Test framework

**Decision**: **Vitest** with TypeScript support; temp directory override for JSON path
in tests (env var `TASK_STORE_PATH` or injectable path in `taskStore`).

**Rationale**: Fast, modern, good DX for TypeScript CLIs. Constitution requires critical-path
tests; isolated temp files avoid polluting `~/.cli-task-manager` during CI.

**Alternatives considered**:
- **node:test**: Built-in but less ergonomic for mocking timers/paths.
- **Jest**: Heavier config for a small CLI.

---

## 6. Title validation

**Decision**: Reject empty/whitespace-only titles. Accept titles up to **500 characters**
(inclusive); reject longer with clear error.

**Rationale**: Spec edge case default (500 chars) documented in assumptions.

**Alternatives considered**:
- **No max length**: Risk of bloated JSON file from accidental paste.

---

## 7. List output format

**Decision**: Human-readable table-like lines:

```text
ID          STATUS     TITLE
abc-123     pending    Buy milk
def-456     done       Write report
```

Use fixed-width columns for scannability. Empty store: `No tasks yet.`

**Rationale**: Constitution Principle IV — plain language, scannable without JSON tools.

**Alternatives considered**:
- **JSON output flag**: Not requested; YAGNI.

---

## 8. Error handling for corrupt/missing store

**Decision**:
- **Missing file or directory**: Treat as empty task list; create on first write.
- **Invalid JSON**: Print error to stderr, exit code 1, do not overwrite file.

**Rationale**: Matches spec edge cases — initialize on first use; never silent data loss.

**Alternatives considered**:
- **Auto-reset corrupt file**: Violates “must not silently discard user data.”

---

## Summary

All NEEDS CLARIFICATION items from Technical Context are resolved. No constitution
violations. Ready for Phase 1 design artifacts.
