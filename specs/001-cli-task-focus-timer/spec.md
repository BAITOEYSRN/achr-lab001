# Feature Specification: CLI Task Manager & Focus Timer

**Feature Branch**: `001-cli-task-focus-timer`

**Created**: 2026-08-14

**Status**: Draft

**Input**: User description: "CLI Task Manager & Focus Timer with: Add task from terminal, Mark task complete, List all tasks, 25-minute Pomodoro focus timer, Tasks persist across CLI sessions per ADR 0001 (local JSON). Out of scope: web UI, cloud sync, custom timer durations"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Add a Task (Priority: P1)

A user working in the terminal wants to capture a task quickly without leaving
their workflow. They run a single command with a task title and receive confirmation
that the task was saved. When they close the terminal and return later, the task
is still available.

**Why this priority**: Adding tasks is the foundational capability; without it,
listing, completing, and focusing on work have nothing to act on.

**Independent Test**: Run the add command with a valid title, exit the CLI, reopen
it, and confirm the task still exists. Delivers immediate value as a minimal task
capture tool.

**Acceptance Scenarios**:

1. **Given** no existing tasks (or any task store state), **When** the user adds a
   task with a non-empty title, **Then** the system confirms the task was created
   and the task is stored for later sessions.
2. **Given** one or more existing tasks, **When** the user adds another task with
   a non-empty title, **Then** the new task appears alongside existing tasks without
   removing or altering them.
3. **Given** the user attempts to add a task, **When** the title is empty or only
   whitespace, **Then** the system rejects the request with a clear, human-readable
   error and does not create a task.

---

### User Story 2 - List All Tasks (Priority: P2)

A user wants to see everything on their plate at a glance. They run a list command
and receive a readable summary of all tasks, including which are pending and which
are completed.

**Why this priority**: Listing tasks makes the task list usable day to day and is
required before marking items complete by identifier or position.

**Independent Test**: Add several tasks (some completed, some not), run the list
command, and verify all tasks appear with correct status labels. Delivers value as
a standalone task inbox view.

**Acceptance Scenarios**:

1. **Given** multiple stored tasks in mixed completion states, **When** the user
   requests a list of all tasks, **Then** every task is shown with its title and
   completion status in human-readable form.
2. **Given** no stored tasks, **When** the user requests a list of all tasks,
   **Then** the system reports that there are no tasks (not an error).
3. **Given** tasks were added in a previous CLI session, **When** the user lists
   tasks in a new session, **Then** the same tasks appear as before.

---

### User Story 3 - Mark a Task Complete (Priority: P2)

A user finishes work on a task and wants to mark it done from the terminal. They
identify the task, run a complete command, and see confirmation that the task is
now completed. The updated status persists across sessions.

**Why this priority**: Completing tasks closes the core task-management loop and is
a constitution critical path.

**Independent Test**: Add a pending task, mark it complete, list tasks to verify
status, restart the CLI, and confirm it remains completed.

**Acceptance Scenarios**:

1. **Given** a pending task exists, **When** the user marks that task complete,
   **Then** the system confirms completion and subsequent lists show the task as
   completed.
2. **Given** a task is already completed, **When** the user marks it complete again,
   **Then** the system responds clearly (e.g., already completed) without corrupting
   stored data.
3. **Given** the user references a task that does not exist, **When** they attempt
   to mark it complete, **Then** the system reports the task was not found with a
   clear error message.

---

### User Story 4 - Run a 25-Minute Focus Timer (Priority: P3)

A user wants a fixed Pomodoro-style focus session from the terminal. They start the
timer and receive readable feedback while it runs. After 25 minutes, they receive
a clear completion signal so they know the session ended.

**Why this priority**: The focus timer supports productivity but is independent of
task storage; it can ship after core task flows are stable.

**Independent Test**: Start the timer and verify it runs for 25 minutes (or validate
via a test harness that simulates elapsed time) and produces a completion message.
Delivers value as a standalone focus aid without requiring tasks.

**Acceptance Scenarios**:

1. **Given** the user is at the CLI prompt, **When** they start the focus timer,
   **Then** a 25-minute countdown session begins with human-readable progress or
   status output.
2. **Given** a focus timer is running, **When** 25 minutes elapse, **Then** the
   system signals completion in plain language (e.g., message or audible terminal
   bell if supported by the environment).
3. **Given** a focus timer is running, **When** the user interrupts the session
   (e.g., keyboard interrupt), **Then** the timer stops cleanly with a clear message
   that the session was cancelled.

---

### Edge Cases

- What happens when the task store file is missing on first use? The system MUST
  initialize storage and behave as if no tasks exist.
- What happens when the task store file is corrupted or unreadable? The system MUST
  report a clear error and MUST NOT silently discard user data.
- What happens when the user adds a very long task title? The system MUST accept
  reasonable-length titles and reject or truncate only if a documented limit exists
  in the plan phase; default assumption is accept titles up to 500 characters.
- What happens when two CLI instances run at the same time? Last write wins is
  acceptable per ADR 0001; no multi-user concurrency guarantees are required.
- What happens if the user starts a second focus timer while one is running?
  The system MUST reject or queue the second start with a clear message (default:
  reject second timer until the first is stopped or finishes).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Users MUST be able to add a task by providing a title from the terminal.
- **FR-002**: The system MUST reject add requests with empty or whitespace-only titles.
- **FR-003**: Users MUST be able to list all stored tasks in human-readable form.
- **FR-004**: Each listed task MUST show its title and whether it is pending or
  completed.
- **FR-005**: Users MUST be able to mark a specific pending task as complete from
  the terminal.
- **FR-006**: The system MUST persist all tasks across CLI sessions on the local
  filesystem per ADR 0001 (local JSON storage).
- **FR-007**: Users MUST be able to start a focus timer that runs for exactly
  25 minutes.
- **FR-008**: The focus timer MUST provide human-readable feedback during the session
  and a clear completion signal when finished.
- **FR-009**: The system MUST operate fully offline with no network dependency.
- **FR-010**: All user-facing errors MUST be plain language and actionable.
- **FR-011**: The system MUST NOT include a web UI, cloud sync, or configurable
  timer durations in this feature.

### Key Entities

- **Task**: A single to-do item captured by the user. Attributes: unique identifier,
  title (user-provided text), completion status (pending or completed), and creation
  timestamp. Tasks persist until explicitly marked complete; deletion is out of scope
  unless added in a future spec.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can add a task with a valid title in under 30 seconds on first
  use without reading documentation beyond `--help`.
- **SC-002**: 100% of tasks added in one CLI session are visible after closing and
  reopening the CLI in a new session.
- **SC-003**: A user can view their full task list and distinguish pending from
  completed items in a single list command output.
- **SC-004**: A user can mark a pending task complete in one command and see the
  updated status on the next list within the same session.
- **SC-005**: A started focus timer runs for 25 minutes and produces a user-visible
  completion signal without requiring external services.
- **SC-006**: All four primary flows (add, list, complete, timer) produce
  human-readable output understandable without specialized tools.

## Assumptions

- Single user on a single machine; no multi-user or concurrent-write requirements
  beyond last-write-wins for JSON storage (per ADR 0001).
- Task identification for the complete command uses either task ID or list position;
  the implementation plan will choose one approach; both are acceptable if unambiguous
  in the CLI.
- Duplicate task titles are allowed; uniqueness is enforced by task identifier only.
- Task deletion and editing of titles are out of scope for this feature.
- JSON file location and exact schema follow ADR 0001 follow-up decisions
  (e.g., user home directory path; fields: id, title, completed, createdAt).
- Web UI, cloud sync, accounts, categories, recurring tasks, and custom Pomodoro
  durations are explicitly out of scope.
- The focus timer does not need to be linked to a specific task record in v1.
