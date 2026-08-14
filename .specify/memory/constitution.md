<!--
Sync Impact Report
==================
Version change: template (unversioned placeholders) → 1.0.0
Modified principles:
  - [PRINCIPLE_1_NAME] → I. Simplicity-First CLI Design
  - [PRINCIPLE_2_NAME] → II. Local JSON Persistence (ADR 0001)
  - [PRINCIPLE_3_NAME] → III. Critical-Path Testing
  - [PRINCIPLE_4_NAME] → IV. Human-Readable Terminal Output
  - [PRINCIPLE_5_NAME] → V. YAGNI Scope Discipline
Added sections:
  - Additional Constraints
  - Development Workflow
Removed sections: none (placeholders replaced)
Templates requiring updates:
  - .specify/templates/plan-template.md ✅ updated
  - .specify/templates/spec-template.md ✅ updated
  - .specify/templates/tasks-template.md ✅ updated
  - .specify/templates/checklist-template.md — no changes required
  - .specify/templates/commands/*.md — not present
  - README.md — not present
Follow-up TODOs: none
-->

# CLI Task Manager & Focus Timer Constitution

## Core Principles

### I. Simplicity-First CLI Design

The CLI MUST remain minimal, predictable, and easy to operate from a terminal.
Commands, flags, and subcommands MUST favor clarity over configurability.
New interaction patterns require explicit justification against simpler alternatives.

**Rationale**: This is a solo-developer greenfield CLI; complexity slows delivery and
debugging in a terminal environment.

### II. Local JSON Persistence (ADR 0001)

All task persistence MUST follow [ADR 0001](../../adr/0001-persist-tasks-to-local-json.md):
tasks are stored in a local JSON file on the user's filesystem.

Production task storage MUST NOT use SQLite, in-memory stores, or any alternative
unless a new ADR supersedes ADR 0001.

**Rationale**: Human-readable storage, zero database setup, and alignment with current
scope. ADR 0001 is the authoritative persistence decision.

### III. Critical-Path Testing

Automated tests MUST cover these critical paths before a feature is considered complete:

- Add task
- Complete task
- Focus timer (25-minute Pomodoro)

Tests MAY be omitted for non-critical utilities only when they do not affect these paths.
Critical-path tests MUST fail before implementation (red-green-refactor encouraged).

**Rationale**: These three flows define the product's core value; regressions here block
all user scenarios.

### IV. Human-Readable Terminal Output

All user-facing CLI output MUST be human-readable in a standard terminal session.
Success and error messages MUST be plain language, scannable, and actionable.
Structured or machine-readable output (e.g., JSON flags) MAY be added only when required
by spec and MUST NOT replace the default readable output.

**Rationale**: The primary interface is the terminal; output must be inspectable without
special tooling.

### V. YAGNI Scope Discipline

Features beyond the assignment scope MUST NOT be implemented proactively.
Scope is limited to: add tasks, mark tasks complete, and a fixed 25-minute focus timer.
Proposed additions (categories, sync, accounts, plugins, alternate storage, etc.) require
spec amendment and constitution compliance review before implementation.

**Rationale**: Prevents scope creep on a solo greenfield project with a fixed deliverable.

## Additional Constraints

- **Binding ADRs**: Accepted Architecture Decision Records in `adr/` are binding on all
  implementation work, including AI-generated code. Conflicts with the constitution or
  an accepted ADR MUST be resolved before merge.
- **Storage location and schema**: Follow ADR 0001 follow-up decisions (file path, task
  fields: id, title, completed, createdAt) unless a superseding ADR defines otherwise.
- **Offline-first**: The CLI MUST operate without network connectivity.
- **No concurrent-write guarantees**: JSON persistence does not provide transactional
  guarantees; designs MUST NOT assume multi-process safe writes unless explicitly scoped.

## Development Workflow

- Every feature plan MUST include a **Constitution Check** gate (see plan template) before
  Phase 0 research and again after Phase 1 design.
- Implementation tasks MUST map to prioritized user stories; each story MUST be
  independently testable.
- Complexity beyond these principles MUST be recorded in the plan's Complexity Tracking
  table with rejected simpler alternatives documented.
- AI-generated code MUST be reviewed for compliance with this constitution and accepted
  ADRs before acceptance.

## Governance

This constitution and all accepted ADRs in `adr/` are **binding** for all AI-generated
and human-authored code in this repository.

- **Supremacy**: The constitution and accepted ADRs override conflicting plans, specs,
  tasks, or ad-hoc implementation choices.
- **Amendments**: Require documented rationale, version bump per semantic versioning,
  update to dependent templates, and explicit review of affected in-flight features.
- **Versioning policy**:
  - **MAJOR**: Backward-incompatible principle removals or redefinitions.
  - **MINOR**: New principles or materially expanded guidance.
  - **PATCH**: Clarifications, wording, or non-semantic refinements.
- **Compliance review**: Plans, specs, and task lists MUST verify adherence before
  implementation begins. Violations MUST be justified in Complexity Tracking or resolved
  via amendment.

**Version**: 1.0.0 | **Ratified**: 2026-08-14 | **Last Amended**: 2026-08-14
