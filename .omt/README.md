# OMT Definition Layer

This directory is the project-level workflow definition layer for OMT.

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
