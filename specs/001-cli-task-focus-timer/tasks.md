---
description: "Task list for CLI Task Manager & Focus Timer"
---

# Tasks: CLI Task Manager & Focus Timer

**Input**: Design documents from `/specs/001-cli-task-focus-timer/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/cli-commands.md

**Tests**: Per constitution Principle III, automated tests are REQUIRED for critical paths: add task, complete task, and focus timer. List and persistence tests included per plan.

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Maps to user stories from spec.md ([US1]–[US4])
- Every task includes an exact file path

## Path Conventions

Single-project CLI at repository root: `src/`, `tests/`, config at root.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Initialize Node.js/TypeScript project and directory layout

- [X] T001 Create project directory structure (`src/cli/`, `src/commands/`, `src/models/`, `src/storage/`, `src/lib/`, `tests/integration/`, `tests/helpers/`) per plan.md
- [X] T002 Initialize `package.json` with Node 20+ engines, `commander`, `typescript`, `vitest`, and `@types/node` dependencies
- [X] T003 Create `tsconfig.json` with `rootDir` `src`, `outDir` `dist`, and strict mode enabled
- [X] T004 Create `vitest.config.ts` with TypeScript path resolution for test files
- [X] T005 [P] Add `.gitignore` entries for `node_modules/`, `dist/`, and coverage output

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared models, storage, output, and CLI skeleton — MUST complete before user stories

**⚠️ CRITICAL**: No user story work until this phase is complete

- [X] T006 Define `Task`, `TaskStore` types and title validation (trim, 1–500 chars) in `src/models/task.ts`
- [X] T007 Implement store path resolver (`~/.cli-task-manager/tasks.json`, `TASK_STORE_PATH` override) in `src/lib/paths.ts`
- [X] T008 Implement human-readable stdout/stderr message helpers in `src/lib/output.ts`
- [X] T009 Implement JSON load/save with `fs.readFileSync`/`fs.writeFileSync` in `src/storage/taskStore.ts`
- [X] T010 Setup Commander program skeleton with global `--help` in `src/cli/index.ts`
- [X] T011 [P] Add isolated temp-store test helper using `TASK_STORE_PATH` in `tests/helpers/testStore.ts`

**Checkpoint**: Foundation ready — user story implementation can begin

---

## Phase 3: User Story 1 - Add a Task (Priority: P1) 🎯 MVP

**Goal**: User can add a task from the terminal; task persists across CLI sessions

**Independent Test**: `task add "Buy milk"`, exit CLI, reopen, confirm task still in store via `task list` or direct JSON read

### Tests for User Story 1 (REQUIRED — write FIRST, ensure FAIL) ⚠️

- [X] T012 [P] [US1] Write failing add command tests (valid title, empty title, 501-char title) in `tests/add.test.ts`
- [X] T013 [P] [US1] Write failing cross-session persistence test (add → reload store → task present) in `tests/integration/persistence.test.ts`

### Implementation for User Story 1

- [X] T014 [US1] Implement `add` command (UUID id, ISO createdAt, append to store) per `contracts/cli-commands.md` in `src/commands/add.ts`
- [X] T015 [US1] Register `add <title...>` subcommand in `src/cli/index.ts`

**Checkpoint**: User Story 1 fully functional — add + persistence tests pass

---

## Phase 4: User Story 2 - List All Tasks (Priority: P2)

**Goal**: User sees all tasks with ID, status (pending/done), and title in human-readable format

**Independent Test**: Add mixed tasks, run `task list`, verify all appear with correct status; empty store shows `No tasks yet.`

### Tests for User Story 2

- [X] T016 [P] [US2] Write failing list command tests (mixed statuses, empty store, corrupt JSON error) in `tests/list.test.ts`

### Implementation for User Story 2

- [X] T017 [US2] Implement `list` command (createdAt ascending, fixed-width columns) per `contracts/cli-commands.md` in `src/commands/list.ts`
- [X] T018 [US2] Register `list` subcommand in `src/cli/index.ts`

**Checkpoint**: User Stories 1 and 2 work independently

---

## Phase 5: User Story 3 - Mark a Task Complete (Priority: P2)

**Goal**: User marks a pending task done by ID; status persists across sessions

**Independent Test**: Add task, `task complete <id>`, list shows `done`; re-complete shows already-completed message

### Tests for User Story 3 (REQUIRED — write FIRST, ensure FAIL) ⚠️

- [X] T019 [P] [US3] Write failing complete command tests (success, not found, already completed) in `tests/complete.test.ts`

### Implementation for User Story 3

- [X] T020 [US3] Implement `complete` command (lookup by UUID, set `completed: true`) per `contracts/cli-commands.md` in `src/commands/complete.ts`
- [X] T021 [US3] Register `complete <id>` subcommand in `src/cli/index.ts`

**Checkpoint**: Add, list, and complete flows all pass tests

---

## Phase 6: User Story 4 - Run a 25-Minute Focus Timer (Priority: P3)

**Goal**: User starts a fixed 1500-second Pomodoro timer with progress output and completion signal

**Independent Test**: Start `task focus`, verify minute ticks and completion message (use mocked clock in tests)

### Tests for User Story 4 (REQUIRED — write FIRST, ensure FAIL) ⚠️

- [X] T022 [P] [US4] Write failing focus timer tests (1500s completion, SIGINT cancel, injectable clock) in `tests/focus.test.ts`

### Implementation for User Story 4

- [X] T023 [US4] Implement `focus` command (1500s countdown, 60s ticks, bell on complete, SIGINT handler) in `src/commands/focus.ts`
- [X] T024 [US4] Register `focus` subcommand in `src/cli/index.ts`

**Checkpoint**: All four commands functional; critical-path tests pass

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Packaging, scripts, and final validation

- [X] T025 Configure `bin` entry `"task": "dist/cli/index.js"` and `"type": "module"` in `package.json`
- [X] T026 Add `build` (`tsc`), `test` (`vitest run`), and `start` scripts in `package.json`
- [X] T027 [P] Run all scenarios in `specs/001-cli-task-focus-timer/quickstart.md` and fix any gaps found
- [X] T028 Verify `package.json` contains no forbidden deps (`sqlite3`, `better-sqlite3`, `sequelize`) per `contracts/cli-commands.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 — **blocks all user stories**
- **User Stories (Phases 3–6)**: Depend on Phase 2 completion
  - Recommended order: US1 → US2 → US3 → US4 (P1 → P2 → P2 → P3)
  - US4 (focus) can run in parallel with US2/US3 after Phase 2 (no shared files with task commands)
- **Polish (Phase 7)**: Depends on all user stories being complete

### User Story Dependencies

| Story | Depends on | Notes |
|-------|------------|-------|
| US1 Add (P1) | Phase 2 only | MVP — no other stories required |
| US2 List (P2) | Phase 2, benefits from US1 for manual testing | Reads same store; independently testable with seeded JSON |
| US3 Complete (P2) | Phase 2, benefits from US1/US2 | Needs tasks in store; tests can seed data directly |
| US4 Focus (P3) | Phase 2 only | No task store dependency |

### Within Each User Story

- Tests MUST be written and FAIL before implementation
- Command module before CLI registration
- Story checkpoint before moving to next priority

### Parallel Opportunities

- **Phase 1**: T005 parallel with T002–T004 after T001
- **Phase 2**: T011 parallel with T006–T010 after T007 (paths needed for store tests)
- **After Phase 2**: US4 can proceed in parallel with US2/US3 while US1 is done
- **Per story**: Test tasks marked [P] can run in parallel
- **Phase 7**: T027 parallel with T025–T026 after build works

---

## Parallel Example: User Story 1

```bash
# Write both US1 tests together (different files):
# T012: tests/add.test.ts
# T013: tests/integration/persistence.test.ts

# Then implement (sequential — same command surface):
# T014: src/commands/add.ts
# T015: src/cli/index.ts
```

## Parallel Example: Post-Foundation

```bash
# After Phase 2 completes, split across developers:
# Developer A: Phase 3 (US1 Add) — MVP
# Developer B: Phase 6 (US4 Focus) — independent timer, no store coupling
# Developer C: Phase 4 (US2 List) — after US1 or with seeded test fixtures
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1 (add + persistence tests)
4. **STOP and VALIDATE**: `npm test` passes add + persistence; manual `task add` works
5. Demo minimal task capture tool

### Incremental Delivery

1. Setup + Foundational → foundation ready
2. US1 Add → test → demo (MVP)
3. US2 List → test → demo (usable inbox)
4. US3 Complete → test → demo (full task loop)
5. US4 Focus → test → demo (complete product)
6. Polish → quickstart validation

### Task Summary

| Phase | Tasks | Story |
|-------|-------|-------|
| Setup | T001–T005 (5) | — |
| Foundational | T006–T011 (6) | — |
| US1 Add | T012–T015 (4) | P1 MVP |
| US2 List | T016–T018 (3) | P2 |
| US3 Complete | T019–T021 (3) | P2 |
| US4 Focus | T022–T024 (3) | P3 |
| Polish | T025–T028 (4) | — |
| **Total** | **28 tasks** | |

---

## Notes

- All persistence MUST use `src/storage/taskStore.ts` — no SQLite or in-memory-only production storage
- Critical-path test files: `tests/add.test.ts`, `tests/complete.test.ts`, `tests/focus.test.ts`
- Commit after each task or logical group; stop at checkpoints to validate independently
- Command contracts are authoritative for stdout/stderr text: `specs/001-cli-task-focus-timer/contracts/cli-commands.md`

---

## Phase 8: Convergence

- [X] T029 Add focus timer test that completes after mocked 1500 s using default `runFocus()` options in `tests/focus.test.ts` per contracts/cli-commands.md test matrix (partial)
- [X] T030 Add SIGINT cancellation integration test via `registerFocusInterruptHandler` in `tests/focus.test.ts` per US4/AC3 (partial)
- [X] T031 Fix empty-id error message to match contract format in `src/commands/complete.ts` per FR-010 (partial)
- [X] T032 Add corrupt store rejection test for add command in `tests/add.test.ts` per spec edge case (partial)
