# OMT Installation & Usage Guide

> English guide for installing and using the OMT overlay in this fork.
>
> 中文版见：[`./OMT_GUIDE_CN.md`](./OMT_GUIDE_CN.md)

## 1. What OMT is

OMT is a **Trellis-first workflow overlay**, not a replacement for Trellis.

- **Trellis** remains the durable source of truth.
- **OMT** adds a stricter workflow layer for OpenCode-first usage.
- OMT v1 is currently **OpenCode-first**. The runtime overlay in this fork is designed around `.opencode/`.

In practice:

- `.trellis/` still stores task state, specs, journals, and task artifacts
- `.omt/` stores reusable workflow definitions only
- `oh-my-trellis.jsonc` stores project/user overrides for OMT config
- `.opencode/` gains OMT-specific commands, agents, plugins, and portable skills

## 2. Current v1 status

OMT v1 in this fork supports:

- strict workflow: `plan -> review -> execute -> verify -> close`
- fast workflow for small scoped work
- fast-to-strict promotion rules
- OpenCode `/omt-*` commands
- OMT agents and portable OMO-derived OpenCode skills
- low/high two-tier routing via config

OMT v1 does **not** currently provide:

- a standalone one-command additive installer
- Claude/Codex runtime parity for the OMT overlay
- loop runtime, continuation hooks, or auto-slash runtime

## 3. Choose the right installation path

There are two installation modes:

| Mode | Best for | Meaning |
| --- | --- | --- |
| **Full install** | New project, or you want to start from an OMT-enabled distribution | Start from this fork's OMT-enabled Trellis output from day one |
| **Additive install** | Existing project already using official Trellis | Keep Trellis, then add OMT on top |

And three common project situations:

| Project situation | Recommended path |
| --- | --- |
| Existing project with **no Trellis yet** | Install Trellis first, then add OMT |
| Existing project already managed by **official Trellis** | Add OMT incrementally |
| Brand-new project | Start with OMT from the beginning |

## 4. Prerequisites

Before using OMT, make sure:

1. You can run Trellis normally.
2. Your repo uses **OpenCode** if you want the OMT runtime overlay.
3. Your developer identity is initialized.

Typical base install:

```bash
npm install -g @mindfoldhq/trellis@latest
```

Developer identity:

```bash
python3 ./.trellis/scripts/init_developer.py your-name
```

If you do not use OpenCode, you can still study OMT's design and docs, but the shipped v1 runtime overlay in this fork is OpenCode-first.

## 5. Scenario A — existing project not managed by Trellis yet

This is the safest path for a normal existing app or service that has never used Trellis.

### Step 1: install Trellis into the project

```bash
cd your-project
trellis init --opencode -u your-name
```

This creates the Trellis base:

- `.trellis/`
- `.opencode/`
- `.trellis/workspace/your-name/`

### Step 2: commit the plain Trellis baseline

Do one clean commit before layering OMT. That gives you a clean fallback point.

### Step 3: overlay OMT

Add the following OMT-owned files from this fork:

#### Project-level OMT definition layer

```text
.omt/
oh-my-trellis.jsonc
```

#### Trellis shared-script additions / updates

```text
.trellis/scripts/common/omt.py
.trellis/scripts/common/omt_config.py
.trellis/scripts/common/omt_context.py
.trellis/scripts/common/omt_workflow.py
.trellis/scripts/common/git_context.py
.trellis/scripts/common/paths.py
```

#### OpenCode overlay files

```text
.opencode/commands/omt-*.md
.opencode/agents/omt-*.md
.opencode/lib/omt-config.js
.opencode/lib/trellis-context.js
.opencode/plugins/session-start.js
.opencode/plugins/inject-subagent-context.js
.opencode/plugins/omt-config.js
.opencode/plugins/omt-command-guards.js
.opencode/skills/*
```

### Step 4: opt tasks into OMT only when needed

Do **not** bulk-migrate all tasks.

Only tasks that should use OMT semantics need this metadata:

#### Strict mode

```json
{
  "meta": {
    "workflow_id": "omt/v1",
    "workflow_mode": "strict"
  }
}
```

#### Fast mode

```json
{
  "meta": {
    "workflow_id": "omt/v1",
    "workflow_mode": "fast"
  }
}
```

### Step 5: start using OMT in OpenCode

Use the OMT commands:

- `/omt-start`
- `/omt-plan`
- `/omt-review-plan`
- `/omt-execute`
- `/omt-verify`
- `/omt-close`

Use `/trellis:*` when you want the base Trellis workflow and `/omt-*` when you want the OMT overlay workflow.

## 6. Scenario B — existing project already managed by official Trellis

This is the **additive install** path.

### What stays the same

Keep all of these intact:

- `.trellis/spec/`
- `.trellis/tasks/`
- `.trellis/workspace/`
- `.trellis/.current-task`
- existing `/trellis:*` commands
- existing Trellis task metadata shape (`task.json`, `current_phase`, `next_action`)

### What OMT adds

Add:

- `.omt/`
- `oh-my-trellis.jsonc`
- OMT shared Python helpers in `.trellis/scripts/common/`
- OMT OpenCode assets under `.opencode/`

### What not to do

- Do **not** move task artifacts out of `.trellis/tasks/<task>/`
- Do **not** create a second task store under `.omt/`
- Do **not** rewrite every historical Trellis task to OMT mode
- Do **not** remove `/trellis:*`

### Recommended incremental rollout

1. Commit your current official Trellis state.
2. Add `.omt/` and `oh-my-trellis.jsonc`.
3. Merge the OMT shared helpers into `.trellis/scripts/common/`.
4. Add or refresh OMT OpenCode files in `.opencode/`.
5. Pick **one active task** and opt it into OMT mode.
6. Validate `/omt-start` and run either a strict or fast path.
7. Expand task by task.

This keeps migration reversible and avoids mixing “all tasks changed” with “new workflow being validated.”

## 7. Scenario C — new project

For a greenfield project, you have two practical choices.

### Option A: start from the OMT-enabled fork output

This is the cleanest approach if you want OMT from day one.

Your repo starts with:

- `.trellis/`
- `.omt/`
- `oh-my-trellis.jsonc`
- `.opencode/` with OMT commands / agents / plugins / skills

### Option B: Trellis first, OMT immediately after

```bash
mkdir your-project
cd your-project
git init

npm install -g @mindfoldhq/trellis@latest
trellis init --opencode -u your-name
```

Then add the OMT overlay before you create your first serious task.

## 8. Daily workflow after installation

### Strict workflow

Use strict mode for medium or large work:

1. `/omt-start`
2. `/omt-plan`
3. `/omt-review-plan`
4. `/omt-execute`
5. `/omt-verify`
6. `/omt-close`

Artifacts live in:

```text
.trellis/tasks/<task>/plan.md
.trellis/tasks/<task>/review.md
.trellis/tasks/<task>/execute.md
.trellis/tasks/<task>/verify.md
.trellis/tasks/<task>/close.md
```

### Fast workflow

Use fast mode for trivial or small scoped work.

Fast mode only requires `close.md`, but it must include:

- `## Intent`
- `## Scope`
- `## Changes`
- `## Verification`
- `## Outcome`

### Fast-to-strict promotion

Promote the task in place when any of these triggers apply:

- `multiple_subsystems`
- `public_interface_change`
- `reviewer_or_oracle_required`

Promotion does not rename the task or move the directory. It fills in the missing strict artifacts in the same task folder.

## 9. Updating official Trellis while keeping OMT

The whole point of the overlay strategy is to keep Trellis updates manageable.

Recommended update order:

1. Update the official Trellis base first.
2. Re-check the files OMT overrides or extends.
3. Re-apply OMT overlay changes only where needed.
4. Re-run validation:
   - lint
   - tests
   - typecheck
   - python checks

Because OMT is additive, you should treat Trellis as the base product and OMT as the project-level augmentation layer.

## 10. What OMT changes vs. what it does not

### OMT changes

- adds a role-based workflow overlay
- adds `/omt-*` commands in OpenCode
- adds strict and fast workflow modes
- adds low/high routing through `.omt/config/` + `oh-my-trellis.jsonc`
- adds portable OMO-style OpenCode skills

### OMT does not change

- Trellis as the durable source of truth
- existing Trellis task storage
- `.trellis/.current-task`
- numeric `current_phase` and `next_action`
- existing `/trellis:*` commands

## 11. Related files

For implementation-level details, continue with:

- [`./.omt/README.md`](./.omt/README.md)
- [`./.omt/migration.md`](./.omt/migration.md)
- [`./.omt/skills.md`](./.omt/skills.md)
- [`./.omt/v1-1-evaluation.md`](./.omt/v1-1-evaluation.md)
