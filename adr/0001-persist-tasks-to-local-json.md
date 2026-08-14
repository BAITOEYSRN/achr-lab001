# 1. Persist tasks to local JSON files

Date: 2026-08-14

## Status

Accepted

## Context

We are building a CLI Task Manager & Focus Timer as a greenfield project.
Core features are limited: add tasks, mark complete, and a fixed 25-minute
Pomodoro timer. The team is a solo developer with no dedicated DBA or
DevOps support.

Business priorities favor fast delivery, simplicity, and easy debugging
in a terminal environment. Tasks must survive process restarts but do
not require relational queries or multi-user concurrency.

Alternatives considered:
- SQLite: robust but adds dependency and schema migration overhead for
  a two-field task model.
- In-memory: fastest but violates the persistence requirement across
  CLI sessions.

## Decision

Persist tasks to a local JSON file on the user's filesystem.

## Consequences

### Positive
- Human-readable storage; easy to inspect and debug from the terminal.
- Zero external database setup; works offline.
- Aligns with YAGNI for current scope.

### Negative
- No transactional guarantees under concurrent writes.
- May need migration strategy if task schema grows.

### Follow-up decisions
- Define JSON file location (e.g., `~/.cli-task-manager/tasks.json`).
- Define task schema: id, title, completed, createdAt.
- Plan and implement phase MUST use JSON — not SQLite or in-memory.