# OMT Definition Layer

This directory is the project-level workflow definition layer for OMT.

OMT is an additive workflow overlay on top of Trellis:

- Trellis remains the durable source of truth
- `.omt/` stores reusable workflow definitions only
- `.trellis/tasks/<task>/` stores task-instance artifacts
- OpenCode adapter files stay under `.opencode/`

## Ownership

| Path | Purpose | Runtime writes allowed |
|------|---------|------------------------|
| `.omt/agents/` | Role definitions and persona contracts | No |
| `.omt/commands/` | Command definitions and command docs | No |
| `.omt/prompts/` | Shared prompt fragments and output contracts | No |
| `.omt/hooks/` | Hook policy and hook-specific docs | No |
| `.omt/config/` | Framework defaults, schema docs, config guidance | No |

Task-instance state must never be written under `.omt/`.
Task-instance outputs belong under `.trellis/tasks/<task>/`.

## Config Precedence

1. `.omt/config/oh-my-trellis.defaults.jsonc`
2. `oh-my-trellis.jsonc`

The project-root file is the user/project override layer and wins over framework defaults.

## Workflow Modes

- `strict`: uses `plan.md`, `review.md`, `execute.md`, `verify.md`, and `close.md`
- `fast`: uses only `close.md`, but that file must still include:
  - `## Intent`
  - `## Scope`
  - `## Changes`
  - `## Verification`
  - `## Outcome`

Fast tasks must be promoted to strict mode in place when any of these triggers apply:

- `multiple_subsystems`
- `public_interface_change`
- `reviewer_or_oracle_required`

## Command Namespaces

- `/trellis:*` = base Trellis workflow
- `/omt-*` = OMT overlay workflow

They intentionally coexist.

## Related Docs

- [`migration.md`](./migration.md) - additive adoption and legacy-task guidance
- [`skills.md`](./skills.md) - Trellis skill reuse + imported OMO skills
- [`v1-1-evaluation.md`](./v1-1-evaluation.md) - deferred feature evaluation for loops, continuation hooks, and auto-slash
