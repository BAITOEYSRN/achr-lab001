# Data Model: CLI Task Manager & Focus Timer

**Feature**: `001-cli-task-focus-timer` | **Date**: 2026-08-14

## Overview

One persisted entity (**Task**) stored in a JSON document on the local filesystem.
The focus timer is ephemeral (in-process only) and is not persisted.

---

## Entity: Task

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string (UUID v4) | yes | Stable identifier for `complete` command |
| `title` | string | yes | User-provided description (1–500 chars after trim) |
| `completed` | boolean | yes | `false` = pending, `true` = done |
| `createdAt` | string (ISO 8601 UTC) | yes | Creation timestamp |

### Validation rules

| Rule | Enforcement |
|------|-------------|
| `title` MUST NOT be empty or whitespace-only after trim | Reject on `add` |
| `title` length MUST be ≤ 500 characters after trim | Reject on `add` |
| `id` MUST be unique within the store | Generate on create; never duplicate |
| `completed` defaults to `false` on create | Set in add flow |
| `createdAt` set once at creation | `new Date().toISOString()` |

### State transitions

```text
         add
  ──────────────►  pending (completed: false)
                         │
                         │ complete (first time)
                         ▼
                    done (completed: true)
                         │
                         │ complete (again)
                         ▼
                    done (no-op, user notified)
```

- **No delete transition** in v1 (out of scope).
- **No edit title transition** in v1 (out of scope).
- **No reopen** (completed → pending) in v1.

---

## Persisted document: TaskStore

**File path**: `~/.cli-task-manager/tasks.json` (override via `TASK_STORE_PATH` in tests)

**Schema**:

```json
{
  "tasks": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "title": "Buy milk",
      "completed": false,
      "createdAt": "2026-08-14T15:00:00.000Z"
    }
  ]
}
```

| Field | Type | Description |
|-------|------|-------------|
| `tasks` | Task[] | Ordered list; default sort for display: `createdAt` ascending |

### File lifecycle

| Condition | Behavior |
|-----------|----------|
| File missing | Return `{ tasks: [] }`; create dir+file on first save |
| File empty | Treat as `{ tasks: [] }` |
| Invalid JSON | Error to stderr; exit 1; do not write |
| Valid file | Parse and validate each task has required fields |

### Concurrency

Last write wins (per ADR 0001). No file locking in v1.

---

## Ephemeral: FocusSession (not persisted)

| Field | Type | Value |
|-------|------|-------|
| `durationSeconds` | number | Fixed `1500` |
| `startedAt` | Date | Set when `focus` begins |
| `remainingSeconds` | number | Derived during countdown |

Not stored in JSON. Only one session per process; second `focus` in same process
not applicable (CLI exits after timer). Concurrent CLI processes each run independent
timers (acceptable).

---

## Relationships

```text
TaskStore (1) ──contains──► (0..*) Task

FocusSession ──no relation──► Task   (timer not linked to tasks in v1)
```

---

## TypeScript types (reference for implementation)

```typescript
interface Task {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string; // ISO 8601
}

interface TaskStore {
  tasks: Task[];
}
```

Implementation types live in `src/models/task.ts`; this document is the source of truth
for field semantics.
