# Quickstart: CLI Task Manager & Focus Timer

**Feature**: `001-cli-task-focus-timer` | **Date**: 2026-08-14

Validation guide for end-to-end feature verification. See [data-model.md](./data-model.md)
and [contracts/cli-commands.md](./contracts/cli-commands.md) for details.

---

## Prerequisites

- Node.js 20 or later
- npm (or compatible package manager)
- Terminal (PowerShell, bash, or zsh)

---

## Setup

From repository root:

```bash
npm install
npm run build
npm link          # optional: expose `task` globally
```

For local runs without linking:

```bash
node dist/cli/index.js <command>
# or after package.json bin config:
npm start -- <command>
```

**Test store isolation** (recommended for manual experiments):

```bash
export TASK_STORE_PATH=/tmp/cli-task-manager-test/tasks.json   # bash
$env:TASK_STORE_PATH="$env:TEMP\cli-task-manager-test\tasks.json"  # PowerShell
```

---

## Run automated tests

```bash
npm test
```

Expected: all tests pass, including critical paths:
- `tests/add.test.ts`
- `tests/complete.test.ts`
- `tests/focus.test.ts`

---

## Manual validation scenarios

### 1. Add a task (P1)

```bash
task add Buy milk
```

**Expected**: `Added task: Buy milk (<uuid>)`

Verify persistence:

```bash
task list
```

Close terminal, open new session, run `task list` again — task MUST still appear.

---

### 2. List tasks (P2)

```bash
task add Write report
task add Call dentist
task list
```

**Expected**: Table with IDs, `pending` status, and titles. Pending tasks listed in
creation order.

Empty store:

```bash
# with fresh TASK_STORE_PATH or empty file
task list
```

**Expected**: `No tasks yet.`

---

### 3. Complete a task (P2)

```bash
task add Finish lab
task list          # note the ID
task complete <id-from-list>
task list
```

**Expected**:
- Confirmation: `Completed task: Finish lab`
- List shows `done` for that task
- Re-run `task complete <same-id>` → `Task already completed: Finish lab`

Unknown ID:

```bash
task complete 00000000-0000-0000-0000-000000000000
```

**Expected**: `Error: Task not found: ...` (exit 1)

---

### 4. Focus timer (P3)

```bash
task focus
```

**Expected**:
- Countdown messages approximately every minute
- After 1500 seconds: `Focus session complete! Well done.`

Interrupt test: start `task focus`, press Ctrl+C.

**Expected**: `Focus session cancelled.`

> For manual full-duration runs, allow 25 minutes. Use `npm test` for fast timer validation.

---

### 5. Error cases

| Action | Expected |
|--------|----------|
| `task add` (no title) | Empty title error |
| `task add "   "` | Empty title error |
| Corrupt `tasks.json` | Invalid store error; file not overwritten |

---

## Success criteria mapping

| Criterion | Validated by |
|-----------|--------------|
| SC-001 Add in < 30 s | Scenarios 1 + `--help` |
| SC-002 Persistence across sessions | Scenario 1 reload |
| SC-003 Distinguish pending/done | Scenario 3 list output |
| SC-004 Complete in one command | Scenario 3 |
| SC-005 25-minute timer signal | Scenario 4 / `focus.test.ts` |
| SC-006 Human-readable output | All scenarios |

---

## Next step

Run **`/speckit-tasks`** to generate `tasks.md` from this plan and the feature spec.
