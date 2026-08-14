# CLI Command Contract

**Feature**: `001-cli-task-focus-timer` | **Date**: 2026-08-14

**Program name**: `task` (bin entry in `package.json`)

All output is human-readable on stdout unless noted. Errors go to stderr. Exit code `0`
on success; non-zero on validation or I/O errors.

---

## Global

| Item | Value |
|------|-------|
| Invocation | `task <command> [options] [arguments]` |
| Help | `task --help`, `task <command> --help` |

---

## `task add`

Add a new pending task.

| Argument | Required | Description |
|----------|----------|-------------|
| `<title...>` | yes | Task title; multiple words joined with spaces |

**Success (stdout)**:
```text
Added task: <title> (<id>)
```

**Errors (stderr)**:
| Condition | Message (example) | Exit |
|-----------|-------------------|------|
| Empty/whitespace title | `Error: Task title cannot be empty.` | 1 |
| Title > 500 chars | `Error: Task title must be 500 characters or fewer.` | 1 |
| Write failure | `Error: Could not save tasks.` | 1 |

**Side effects**: Appends task to `~/.cli-task-manager/tasks.json`.

---

## `task list`

List all tasks.

| Argument | Required | Description |
|----------|----------|-------------|
| — | — | No arguments |

**Success (stdout)** — when tasks exist:
```text
ID          STATUS     TITLE
<uuid>      pending    <title>
<uuid>      done       <title>
```

**Success (stdout)** — when empty:
```text
No tasks yet.
```

**Errors (stderr)**:
| Condition | Message (example) | Exit |
|-----------|-------------------|------|
| Corrupt JSON store | `Error: Task store file is invalid. Path: <path>` | 1 |

**Side effects**: Read-only.

---

## `task complete`

Mark a task as completed by ID.

| Argument | Required | Description |
|----------|----------|-------------|
| `<id>` | yes | Task UUID from `list` output |

**Success (stdout)**:
```text
Completed task: <title>
```

**Success (stdout)** — already completed:
```text
Task already completed: <title>
```

**Errors (stderr)**:
| Condition | Message (example) | Exit |
|-----------|-------------------|------|
| Unknown id | `Error: Task not found: <id>` | 1 |
| Write failure | `Error: Could not save tasks.` | 1 |

**Side effects**: Sets `completed: true` for matching task in JSON store.

---

## `task focus`

Start a 25-minute (1500 second) focus timer.

| Argument | Required | Description |
|----------|----------|-------------|
| — | — | No arguments |

**During run (stdout)** — periodic (every 60 s):
```text
Focus: <N> minute(s) remaining...
```

**Success (stdout)** — on completion:
```text
Focus session complete! Well done.
```
(Terminal bell `\u0007` MAY follow.)

**Interrupted (stdout)** — on SIGINT:
```text
Focus session cancelled.
```

**Side effects**: Blocks until timer finishes or user interrupts. No file I/O.

---

## Test contract matrix

| Command | Critical path test | Assert |
|---------|-------------------|--------|
| `add` | `tests/add.test.ts` | Task in store; rejects empty title |
| `complete` | `tests/complete.test.ts` | `completed: true`; not-found error |
| `focus` | `tests/focus.test.ts` | Completes at 1500 s (mocked clock) |
| persistence | `tests/integration/persistence.test.ts` | Reload store shows prior tasks |

---

## Forbidden dependencies (enforcement)

The following MUST NOT appear in `package.json` dependencies:
`better-sqlite3`, `sqlite3`, `sequelize`, or any in-memory-only task store used for
production persistence.

Persistence MUST use Node `fs.readFileSync` / `fs.writeFileSync` (or equivalent sync
wrappers) against the JSON path above.
