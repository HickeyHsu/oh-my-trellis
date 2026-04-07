# OMT Adoption Guide

## Purpose

This document explains how OMT layers onto Trellis without replacing Trellis as
the source of truth.

## Additive Adoption Model

OMT is an overlay, not a forked task system.

- Trellis still owns `.trellis/`
- OMT definitions live in `.omt/`
- OpenCode-facing OMT adapters live in `.opencode/`
- Task-instance outputs still live under `.trellis/tasks/<task>/`

## Existing Trellis Repositories

Existing Trellis repositories can adopt OMT without migrating all tasks at once.

### Safe Defaults

- Existing tasks remain valid Trellis tasks
- Existing `.trellis/.current-task` behavior is unchanged
- Existing `task.json.current_phase` and `next_action` semantics remain valid
- Existing Trellis skills and commands continue to work

### OMT Opt-In

A task becomes OMT-managed only when `task.json.meta` includes:

```json
{
  "workflow_id": "omt/v1",
  "workflow_mode": "strict"
}
```

or:

```json
{
  "workflow_id": "omt/v1",
  "workflow_mode": "fast"
}
```

## Lazy Task Adoption

You do not need to bulk-migrate historical tasks.

- Leave archived or inactive Trellis tasks untouched
- Opt in only the tasks that should use OMT workflow semantics
- Promotion from fast to strict happens in the same task directory

## Command Coexistence

OMT adds a parallel command namespace instead of replacing Trellis commands.

- `/trellis:*` remains the Trellis base workflow
- `/omt-*` provides the OMT overlay workflow

This keeps migration reversible and prevents silent command behavior drift.

## Update Safety

OMT v1 does not require integrating into Trellis generator/configurator logic.

- `.omt/` stays project-local and definition-only
- root `oh-my-trellis.jsonc` stays project-local
- generated OpenCode adapter assets remain additive

## What Not To Do

- Do not write task-instance state under `.omt/`
- Do not replace `task.json` with an OMT-only schema
- Do not treat OpenCode session memory as durable workflow state
- Do not require all historical tasks to adopt OMT metadata
