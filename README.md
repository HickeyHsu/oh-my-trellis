<p align="center">
<picture>
<source srcset="assets/trellis.png" media="(prefers-color-scheme: dark)">
<source srcset="assets/trellis.png" media="(prefers-color-scheme: light)">
<img src="assets/trellis.png" alt="Trellis Logo" width="500" style="image-rendering: -webkit-optimize-contrast; image-rendering: crisp-edges;">
</picture>
</p>

<p align="center">
<strong>A multi-platform AI coding framework that rules</strong><br/>
<sub>Supports Claude Code, Cursor, OpenCode, iFlow, Codex, Kilo, Kiro, Gemini CLI, Antigravity, Windsurf, Qoder, CodeBuddy, and GitHub Copilot.</sub>
</p>

<p align="center">
<a href="./README_CN.md">简体中文</a> •
<a href="./OMT_GUIDE.md">OMT Guide</a> •
<a href="https://docs.trytrellis.app/">Docs</a> •
<a href="https://docs.trytrellis.app/guide/ch02-quick-start">Quick Start</a> •
<a href="https://docs.trytrellis.app/guide/ch13-multi-platform">Supported Platforms</a> •
<a href="https://docs.trytrellis.app/guide/ch08-real-world">Use Cases</a>
</p>

<p align="center">
<a href="https://www.npmjs.com/package/@mindfoldhq/trellis"><img src="https://img.shields.io/npm/v/@mindfoldhq/trellis.svg?style=flat-square&color=2563eb" alt="npm version" /></a>
<a href="https://www.npmjs.com/package/@mindfoldhq/trellis"><img src="https://img.shields.io/npm/dw/@mindfoldhq/trellis?style=flat-square&color=cb3837&label=downloads" alt="npm downloads" /></a>
<a href="https://github.com/mindfold-ai/Trellis/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-AGPL--3.0-16a34a.svg?style=flat-square" alt="license" /></a>
<a href="https://github.com/mindfold-ai/Trellis/stargazers"><img src="https://img.shields.io/github/stars/mindfold-ai/Trellis?style=flat-square&color=eab308" alt="stars" /></a>
<a href="https://docs.trytrellis.app/"><img src="https://img.shields.io/badge/docs-trytrellis.app-0f766e?style=flat-square" alt="docs" /></a>
<a href="https://discord.com/invite/tWcCZ3aRHc"><img src="https://img.shields.io/badge/Discord-Join-5865F2?style=flat-square&logo=discord&logoColor=white" alt="Discord" /></a>
<a href="https://github.com/mindfold-ai/Trellis/issues"><img src="https://img.shields.io/github/issues/mindfold-ai/Trellis?style=flat-square&color=e67e22" alt="open issues" /></a>
<a href="https://github.com/mindfold-ai/Trellis/pulls"><img src="https://img.shields.io/github/issues-pr/mindfold-ai/Trellis?style=flat-square&color=9b59b6" alt="open PRs" /></a>
<a href="https://deepwiki.com/mindfold-ai/Trellis"><img src="https://img.shields.io/badge/Ask-DeepWiki-blue?style=flat-square" alt="Ask DeepWiki" /></a>
<a href="https://chatgpt.com/?q=Explain+the+project+mindfold-ai/Trellis+on+GitHub"><img src="https://img.shields.io/badge/Ask-ChatGPT-74aa9c?style=flat-square&logo=openai&logoColor=white" alt="Ask ChatGPT" /></a>
</p>

<p align="center">
<img src="assets/trellis-demo.gif" alt="Trellis workflow demo" width="100%">
</p>

## Why Trellis?

| Capability | What it changes |
| --- | --- |
| **Auto-injected specs** | Write conventions once in `.trellis/spec/`, then let Trellis inject the relevant context into each session instead of repeating yourself. |
| **Task-centered workflow** | Keep PRDs, implementation context, review context, and task status in `.trellis/tasks/` so AI work stays structured. |
| **Parallel agent execution** | Run multiple AI tasks side by side with git worktrees instead of turning one branch into a traffic jam. |
| **Project memory** | Journals in `.trellis/workspace/` preserve what happened last time, so each new session starts with real context. |
| **Team-shared standards** | Specs live in the repo, so one person’s hard-won workflow or rule can benefit the whole team. |
| **Multi-platform setup** | Bring the same Trellis structure to 13 AI coding platforms instead of rebuilding your workflow per tool. |

## Quick Start

```bash
# 1. Install Trellis
npm install -g @mindfoldhq/trellis@latest

# 2. Initialize in your repo
trellis init -u your-name

# 3. Or initialize with the platforms you actually use
trellis init --cursor --opencode --codex -u your-name
```

- `-u your-name` creates `.trellis/workspace/your-name/` for personal journals and session continuity.
- Platform flags can be mixed and matched. Current options include `--cursor`, `--opencode`, `--iflow`, `--codex`, `--kilo`, `--kiro`, `--gemini`, `--antigravity`, `--windsurf`, `--qoder`, `--codebuddy`, and `--copilot`.
- For platform-specific setup, entry commands, and upgrade paths, use the docs:
  [Quick Start](https://docs.trytrellis.app/guide/ch02-quick-start) •
  [Supported Platforms](https://docs.trytrellis.app/guide/ch13-multi-platform) •
  [Real-World Scenarios](https://docs.trytrellis.app/guide/ch08-real-world)

## Use Cases

### Teach AI your project once

Put coding standards, file structure rules, review habits, and workflow preferences into Markdown specs. Trellis loads the relevant pieces automatically so you do not have to re-explain the repo every time.

### Run multiple AI tasks in parallel

Use git worktrees and Trellis task structure to split work cleanly across agents. Different tasks can move forward at the same time without stepping on each other’s branches or local state.

### Turn project history into usable memory

Task PRDs, checklists, and workspace journals make previous decisions available to the next session. Instead of starting from blank context, the next agent can pick up where the last one left off.

### Keep one workflow across tools

If your team uses more than one AI coding tool, Trellis gives you one shared structure for specs, tasks, and process. The platform-specific wiring changes, but the workflow stays recognizable.

## How It Works

Trellis keeps the core workflow in `.trellis/` and generates the platform-specific entry points you need around it.

```text
.trellis/
├── spec/                    # Project standards, patterns, and guides
├── tasks/                   # Task PRDs, context files, and status
├── workspace/               # Journals and developer-specific continuity
├── workflow.md              # Shared workflow rules
└── scripts/                 # Utilities that power the workflow
```

Depending on the platforms you enable, Trellis also creates tool-specific integration files such as `.claude/`, `.cursor/`, `AGENTS.md`, `.agents/`, `.codex/`, `.kilocode/`, `.kiro/`, `.github/copilot/`, and `.github/hooks/`. For Codex, Trellis now installs both project skills under `.agents/skills/` and project-scoped config/custom agents under `.codex/`.

At a high level, the workflow is simple:

1. Define standards in specs.
2. Start or refine work from a task PRD.
3. Let Trellis inject the right context for the current task.
4. Use checks, journals, and worktrees to keep quality and continuity intact.

## OMT Overlay in This Fork

This fork also carries an additive OMT workflow overlay.

- Trellis still owns the durable project state in `.trellis/`
- OMT lives in `.omt/` as a definition-only layer
- OMT task artifacts still live in `.trellis/tasks/<task>/`
- OpenCode-facing OMT commands and agents live beside Trellis ones under `.opencode/`

Use OMT when you want a stricter plan → review → execute workflow overlay while keeping stock Trellis task storage intact.

For the complete English OMT manual, see [`./OMT_GUIDE.md`](./OMT_GUIDE.md).

## OMT Installation & Usage

For the full step-by-step manual, use [`./OMT_GUIDE.md`](./OMT_GUIDE.md). The section below is the README summary.

OMT is **not** a replacement for Trellis. It is an overlay that sits on top of Trellis.

- Trellis still owns `.trellis/`, task state, specs, workspace journals, and session memory.
- OMT adds `.omt/`, `oh-my-trellis.jsonc`, and OpenCode-facing workflow assets.
- OMT v1 is **OpenCode-first**. The overlay runtime in this fork is designed for `.opencode/` first.

### Two installation modes

| Mode | When to use it | What it means today |
| --- | --- | --- |
| **Full install** | New repo, or you want to start directly from the OMT-enabled distribution | Start from this fork's OMT-enabled Trellis output from day one |
| **Additive install** | You already use official Trellis and want to keep that base | Keep your existing Trellis project, then add the OMT overlay files on top |

> Current v1 note: OMT does **not** yet ship a one-command additive installer. In this fork, additive installation is still a file-based overlay process.

### Which path should you choose?

| Your project today | Recommended path |
| --- | --- |
| Existing repo with **no Trellis** | Install Trellis first, then add OMT |
| Existing repo already managed by **official Trellis** | Keep Trellis, add OMT incrementally |
| Brand-new repo | Start with the OMT-enabled setup from the beginning |

### 1. Existing project not managed by Trellis yet

This is the safest adoption path for an existing app that has never used Trellis.

#### Step 1: install Trellis and initialize the repo

```bash
npm install -g @mindfoldhq/trellis@latest

cd your-project
trellis init --opencode -u your-name
```

This gives you the normal Trellis base:

- `.trellis/`
- `.opencode/`
- `.trellis/workspace/your-name/`

#### Step 2: commit the plain Trellis baseline

Before enabling OMT, commit the clean Trellis-only state. That gives you a clear rollback point.

#### Step 3: add the OMT overlay files

Copy the OMT overlay from this fork into your project.

**Project-level OMT files**

```text
.omt/
oh-my-trellis.jsonc
```

**Trellis shared-script additions / updates**

```text
.trellis/scripts/common/omt.py
.trellis/scripts/common/omt_config.py
.trellis/scripts/common/omt_context.py
.trellis/scripts/common/omt_workflow.py
.trellis/scripts/common/git_context.py
.trellis/scripts/common/paths.py
```

**OpenCode overlay files**

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

#### Step 4: verify developer identity

If you already ran `trellis init -u your-name`, you are done.

If not, make sure `.trellis/.developer` exists and points to your developer identity:

```bash
python3 ./.trellis/scripts/init_developer.py your-name
```

#### Step 5: opt tasks into OMT only when needed

OMT does not require bulk migration of all existing work.

Add OMT metadata only to the tasks that should use OMT workflow semantics.

**Strict mode**

```json
{
  "meta": {
    "workflow_id": "omt/v1",
    "workflow_mode": "strict"
  }
}
```

**Fast mode**

```json
{
  "meta": {
    "workflow_id": "omt/v1",
    "workflow_mode": "fast"
  }
}
```

#### Step 6: start using OMT

In OpenCode, use:

- `/omt-start`
- `/omt-plan`
- `/omt-review-plan`
- `/omt-execute`
- `/omt-verify`
- `/omt-close`

Use `/trellis:*` when you want the base Trellis workflow, and `/omt-*` when you want the OMT overlay workflow.

### 2. Existing project already managed by official Trellis

This is the incremental installation path.

#### What stays the same

Keep these exactly where they are:

- `.trellis/spec/`
- `.trellis/tasks/`
- `.trellis/workspace/`
- `.trellis/.current-task`
- existing `/trellis:*` commands

#### What you add

Add:

- `.omt/`
- `oh-my-trellis.jsonc`
- OMT shared-script additions in `.trellis/scripts/common/`
- OMT OpenCode assets under `.opencode/`

#### What you should **not** do

- Do **not** move task artifacts out of `.trellis/tasks/<task>/`
- Do **not** create a second task database under `.omt/`
- Do **not** rewrite all historical tasks to OMT mode
- Do **not** remove `/trellis:*`

#### Recommended incremental rollout

1. Back up or commit your current Trellis state.
2. Add `.omt/` and `oh-my-trellis.jsonc`.
3. Merge the OMT shared Python helpers into `.trellis/scripts/common/`.
4. Add or refresh the OMT OpenCode assets in `.opencode/`.
5. Pick **one active task** and opt it into OMT mode.
6. Validate the flow with `/omt-start` and one strict or fast task.
7. Expand OMT usage task by task.

This keeps migration reversible and avoids mixing “all tasks changed” with “new workflow being evaluated.”

### 3. New project

For a greenfield repo, the cleanest path is to start with OMT from day one.

#### Option A: full OMT-enabled setup

Use the OMT-enabled Trellis output from this fork as your base distribution.

That means your initial repository already includes:

- `.trellis/`
- `.omt/`
- `oh-my-trellis.jsonc`
- `.opencode/` with OMT commands / agents / skills / plugins

#### Option B: Trellis first, OMT immediately after

If you prefer to bootstrap with official Trellis first:

```bash
mkdir your-project
cd your-project
git init

npm install -g @mindfoldhq/trellis@latest
trellis init --opencode -u your-name
```

Then immediately apply the OMT overlay files from this fork before you create your first real task.

### Daily usage after installation

#### Strict workflow

Use this for medium or large work:

1. `/omt-start`
2. `/omt-plan`
3. `/omt-review-plan`
4. `/omt-execute`
5. `/omt-verify`
6. `/omt-close`

Artifacts are stored in:

```text
.trellis/tasks/<task>/plan.md
.trellis/tasks/<task>/review.md
.trellis/tasks/<task>/execute.md
.trellis/tasks/<task>/verify.md
.trellis/tasks/<task>/close.md
```

#### Fast workflow

Use this for trivial or small, scoped work.

Fast mode only requires `close.md`, but that file must still contain these sections:

- `## Intent`
- `## Scope`
- `## Changes`
- `## Verification`
- `## Outcome`

#### Promote fast → strict when needed

Promote the task in place when any of these triggers apply:

- `multiple_subsystems`
- `public_interface_change`
- `reviewer_or_oracle_required`

Promotion does **not** rename the task or move the directory. It fills in the strict-mode artifacts in the same task folder.

### What OMT changes and what it does not

#### OMT changes

- adds a role-based workflow overlay
- adds `/omt-*` commands in OpenCode
- adds strict and fast task workflow modes
- adds two-tier low/high routing through `.omt/config/` + `oh-my-trellis.jsonc`
- adds portable OMO-style OpenCode skills

#### OMT does **not** change

- Trellis as the durable source of truth
- existing Trellis task storage
- `.trellis/.current-task`
- numeric `current_phase` and `next_action`
- existing `/trellis:*` commands

### Related files

If you want the implementation-level details behind the installation model, read:

- [`./.omt/README.md`](./.omt/README.md)
- [`./.omt/migration.md`](./.omt/migration.md)
- [`./.omt/skills.md`](./.omt/skills.md)
- [`./.omt/v1-1-evaluation.md`](./.omt/v1-1-evaluation.md)

## Spec Templates & Marketplace

Specs ship as empty templates by default — they are meant to be customized for your project's stack and conventions. You can fill them from scratch, or start from a community template:

```bash
# Fetch templates from a custom registry
trellis init --registry https://github.com/your-org/your-spec-templates
```

Browse available templates and learn how to publish your own on the [Spec Templates page](https://docs.trytrellis.app/templates/specs-index).

## What's New

- **v0.3.6**: task lifecycle hooks, custom template registries (`--registry`), parent-child subtasks, fix PreToolUse hook for CC v2.1.63+.
- **v0.3.5**: hotfix for delete migration manifest field name (Kilo workflows).
- **v0.3.4**: Qoder platform support, Kilo workflows migration, record-session task awareness.
- **v0.3.1**: background watch mode for `trellis update`, improved `.gitignore` handling, docs refresh.
- **v0.3.0**: platform support expanded from 2 to 10, Windows compatibility, remote spec templates, `/trellis:brainstorm`.

## FAQ

<details>
<summary><strong>How is this different from <code>CLAUDE.md</code>, <code>AGENTS.md</code>, or <code>.cursorrules</code>?</strong></summary>

Those files are useful, but they tend to become monolithic. Trellis adds structure around them: layered specs, task context, workspace memory, and platform-aware workflow wiring.

</details>

<details>
<summary><strong>Is Trellis only for Claude Code?</strong></summary>

No. Trellis currently supports Claude Code, Cursor, OpenCode, iFlow, Codex, Kilo, Kiro, Gemini CLI, Antigravity, Windsurf, Qoder, CodeBuddy, and GitHub Copilot. The detailed setup and entry command for each tool lives in the supported platforms guide.

</details>

<details>
<summary><strong>Do I have to write every spec file manually?</strong></summary>

No. Many teams start by letting AI draft specs from existing code and then tighten the important parts by hand. Trellis works best when you keep the high-signal rules explicit and versioned.

</details>

<details>
<summary><strong>Can teams use this without constant conflicts?</strong></summary>

Yes. Personal workspace journals stay separate per developer, while shared specs and tasks stay in the repo where they can be reviewed and improved like any other project artifact.

</details>

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=mindfold-ai/Trellis&type=Date)](https://star-history.com/#mindfold-ai/Trellis&Date)

## Community & Resources

- [Official Docs](https://docs.trytrellis.app/) - Product docs, setup guides, and architecture
- [Quick Start](https://docs.trytrellis.app/guide/ch02-quick-start) - Get Trellis running in a repo fast
- [Supported Platforms](https://docs.trytrellis.app/guide/ch13-multi-platform) - Platform-specific setup and command details
- [Real-World Scenarios](https://docs.trytrellis.app/guide/ch08-real-world) - See how the workflow plays out in practice
- [Changelog](https://docs.trytrellis.app/changelog/v0.3.6) - Track current releases and updates
- [Tech Blog](https://docs.trytrellis.app/blog) - Product thinking and technical writeups
- [GitHub Issues](https://github.com/mindfold-ai/Trellis/issues) - Report bugs or request features
- [Discord](https://discord.com/invite/tWcCZ3aRHc) - Join the community

<p align="center">
<a href="https://github.com/mindfold-ai/Trellis">Official Repository</a> •
<a href="https://github.com/mindfold-ai/Trellis/blob/main/LICENSE">AGPL-3.0 License</a> •
Built by <a href="https://github.com/mindfold-ai">Mindfold</a>
</p>
