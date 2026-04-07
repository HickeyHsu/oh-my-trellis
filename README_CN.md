<p align="center">
<picture>
<source srcset="assets/trellis.png" media="(prefers-color-scheme: dark)">
<source srcset="assets/trellis.png" media="(prefers-color-scheme: light)">
<img src="assets/trellis.png" alt="Trellis Logo" width="500" style="image-rendering: -webkit-optimize-contrast; image-rendering: crisp-edges;">
</picture>
</p>

<p align="center">
<strong>给 AI 立规矩的开源框架</strong><br/>
<sub>支持 Claude Code、Cursor、OpenCode、iFlow、Codex、Kilo、Kiro、Gemini CLI、Antigravity、Windsurf、Qoder、CodeBuddy 和 GitHub Copilot。</sub>
</p>

<p align="center">
<a href="./README.md">English</a> •
<a href="./OMT_GUIDE_CN.md">OMT 指南</a> •
<a href="https://docs.trytrellis.app/zh">文档</a> •
<a href="https://docs.trytrellis.app/zh/guide/ch02-quick-start">快速开始</a> •
<a href="https://docs.trytrellis.app/zh/guide/ch13-multi-platform">支持平台</a> •
<a href="https://docs.trytrellis.app/zh/guide/ch08-real-world">使用场景</a> •
<a href="#contact-us">联系我们</a>
</p>

<p align="center">
<a href="https://www.npmjs.com/package/@mindfoldhq/trellis"><img src="https://img.shields.io/npm/v/@mindfoldhq/trellis.svg?style=flat-square&color=2563eb" alt="npm version" /></a>
<a href="https://www.npmjs.com/package/@mindfoldhq/trellis"><img src="https://img.shields.io/npm/dw/@mindfoldhq/trellis?style=flat-square&color=cb3837&label=downloads" alt="npm downloads" /></a>
<a href="https://github.com/mindfold-ai/Trellis/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-AGPL--3.0-16a34a.svg?style=flat-square" alt="license" /></a>
<a href="https://github.com/mindfold-ai/Trellis/stargazers"><img src="https://img.shields.io/github/stars/mindfold-ai/Trellis?style=flat-square&color=eab308" alt="stars" /></a>
<a href="https://docs.trytrellis.app/zh"><img src="https://img.shields.io/badge/docs-trytrellis.app-0f766e?style=flat-square" alt="docs" /></a>
<a href="https://discord.com/invite/tWcCZ3aRHc"><img src="https://img.shields.io/badge/Discord-Join-5865F2?style=flat-square&logo=discord&logoColor=white" alt="Discord" /></a>
<a href="https://github.com/mindfold-ai/Trellis/issues"><img src="https://img.shields.io/github/issues/mindfold-ai/Trellis?style=flat-square&color=e67e22" alt="open issues" /></a>
<a href="https://github.com/mindfold-ai/Trellis/pulls"><img src="https://img.shields.io/github/issues-pr/mindfold-ai/Trellis?style=flat-square&color=9b59b6" alt="open PRs" /></a>
<a href="https://deepwiki.com/mindfold-ai/Trellis"><img src="https://img.shields.io/badge/Ask-DeepWiki-blue?style=flat-square" alt="Ask DeepWiki" /></a>
<a href="https://chatgpt.com/?q=Explain+the+project+mindfold-ai/Trellis+on+GitHub"><img src="https://img.shields.io/badge/Ask-ChatGPT-74aa9c?style=flat-square&logo=openai&logoColor=white" alt="Ask ChatGPT" /></a>
</p>

<p align="center">
<img src="assets/trellis-demo-zh.gif" alt="Trellis 工作流演示" width="100%">
</p>

<p align="center">
<img src="assets/trellis-demo-zh.gif" alt="Trellis 工作流演示" width="100%">
</p>

## 为什么用 Trellis？

| 能力 | 带来的变化 |
| --- | --- |
| **自动注入 Spec** | 把规范写进 `.trellis/spec/` 之后，Trellis 会在每次会话里注入当前任务真正需要的上下文，不用反复解释。 |
| **任务驱动工作流** | PRD、实现上下文、检查上下文和任务状态都放进 `.trellis/tasks/`，AI 开发不会越做越乱。 |
| **并行 Agent 执行** | 用 git worktree 同时推进多个 AI 任务，不需要把一个分支挤成大杂烩。 |
| **项目记忆** | `.trellis/workspace/` 里的 journal 会保留上一次工作的脉络，让新会话不是从空白开始。 |
| **团队共享标准** | Spec 跟着仓库一起版本化，一个人总结出来的规则和流程，可以直接变成整个团队的基础设施。 |
| **多平台复用** | 同一套 Trellis 结构可以带到 13 个 AI coding 平台上，而不是每换一个工具就重搭一次工作流。 |

## 快速开始

```bash
# 1. 安装 Trellis
npm install -g @mindfoldhq/trellis@latest

# 2. 在仓库里初始化
trellis init -u your-name

# 3. 或者按你实际使用的平台初始化
trellis init --cursor --opencode --codex -u your-name
```

- `-u your-name` 会创建 `.trellis/workspace/your-name/`，用来保存个人 journal 和会话连续性。
- 平台参数可以自由组合。当前可选项包括 `--cursor`、`--opencode`、`--iflow`、`--codex`、`--kilo`、`--kiro`、`--gemini`、`--antigravity`、`--windsurf`、`--qoder`、`--codebuddy` 和 `--copilot`。
- 更完整的安装步骤、各平台入口命令和升级方式放在文档站：
  [快速开始](https://docs.trytrellis.app/zh/guide/ch02-quick-start) •
  [支持平台](https://docs.trytrellis.app/zh/guide/ch13-multi-platform) •
  [使用场景](https://docs.trytrellis.app/zh/guide/ch08-real-world)

## 使用场景

### 把项目知识一次性交给 AI

把编码规范、目录规则、评审习惯和工作流偏好写进 Markdown Spec。Trellis 会自动加载相关部分，你不需要每次都从头解释这个项目怎么做事。

### 并行推进多个 AI 任务

借助 git worktree 和 Trellis 的任务结构，可以把不同任务拆开并行推进。多个 Agent 同时工作时，分支和本地状态也不会互相踩来踩去。

### 把项目历史变成可用记忆

任务 PRD、检查清单和 workspace journal 会把上一次的决策留下来。下一次进场的 Agent 不需要从零开始猜上下文。

### 在不同工具之间保持同一套流程

如果团队不会只用一个 AI coding 工具，Trellis 可以把 Spec、Task 和流程结构统一起来。平台接入方式会变，但工作流本身不需要重学。

## 工作原理

Trellis 把核心工作流放在 `.trellis/` 里，再按你启用的平台生成对应的接入文件。

```text
.trellis/
├── spec/                    # 项目规范、模式和指南
├── tasks/                   # 任务 PRD、上下文文件和状态
├── workspace/               # Journal 和开发者级连续性
├── workflow.md              # 共享工作流规则
└── scripts/                 # 驱动整个流程的脚本
```

根据你启用的平台不同，Trellis 还会生成对应的接入文件，比如 `.claude/`、`.cursor/`、`AGENTS.md`、`.agents/`、`.codex/`、`.kilocode/`、`.kiro/`、`.github/copilot/` 和 `.github/hooks/`。对 Codex 而言，Trellis 现在会同时安装 `.agents/skills/` 下的项目技能，以及 `.codex/` 下的项目级配置和自定义 agent。

整体流程可以理解成四步：

1. 把标准写进 Spec。
2. 从任务 PRD 开始组织工作。
3. 让 Trellis 为当前任务注入正确的上下文。
4. 用检查、journal 和 worktree 保证质量与连续性。

## OMT 安装与使用

OMT **不是** Trellis 的替代品，而是建立在 Trellis 之上的增强层。

- Trellis 仍然负责 `.trellis/`、任务状态、Spec、workspace journal 和 session memory。
- OMT 负责 `.omt/`、`oh-my-trellis.jsonc` 和 OpenCode 侧的增强工作流入口。
- OMT v1 当前是 **OpenCode 优先** 的实现。

### 两种安装方式

| 方式 | 适用场景 | 当前含义 |
| --- | --- | --- |
| **完整安装** | 新项目，或者你希望一开始就使用 OMT 增强版分发 | 直接从这个 fork 的 OMT-enabled 输出开始 |
| **增量安装** | 你已经在使用官方 Trellis，不想推翻原有底座 | 保留现有 Trellis，只把 OMT 叠加进去 |

> 当前 v1 说明：OMT 还没有独立的一键增量安装器。现在的增量安装仍然是“文件级 overlay”。

### 你应该选哪条路径？

| 你的项目现状 | 推荐路径 |
| --- | --- |
| 现有项目，还**没有** Trellis | 先安装 Trellis，再增量加 OMT |
| 现有项目，已经由**官方 Trellis 管理** | 保留 Trellis，增量加 OMT |
| 新项目 | 从一开始就使用 OMT-enhanced 初始化方式 |

### 1. 现有项目，还没有 Trellis

完整中文版手册见 [`./OMT_GUIDE_CN.md`](./OMT_GUIDE_CN.md)。下面是 README 摘要。

这是把 OMT 介入到存量项目里的最稳妥方式。

#### 第一步：先安装 Trellis 并初始化仓库

```bash
npm install -g @mindfoldhq/trellis@latest

cd your-project
trellis init --opencode -u your-name
```

这样你会先得到标准 Trellis 底座：

- `.trellis/`
- `.opencode/`
- `.trellis/workspace/your-name/`

#### 第二步：先提交一版纯 Trellis 基线

在启用 OMT 之前，先把“只有 Trellis、没有 OMT”的状态提交一次。这样回滚最清楚。

#### 第三步：叠加 OMT overlay 文件

把这个 fork 中的 OMT 文件叠加到你的项目里。

**项目级 OMT 文件**

```text
.omt/
oh-my-trellis.jsonc
```

**Trellis 共享脚本层新增 / 更新**

```text
.trellis/scripts/common/omt.py
.trellis/scripts/common/omt_config.py
.trellis/scripts/common/omt_context.py
.trellis/scripts/common/omt_workflow.py
.trellis/scripts/common/git_context.py
.trellis/scripts/common/paths.py
```

**OpenCode 增强层文件**

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

#### 第四步：确认开发者身份已经初始化

如果你已经运行过 `trellis init -u your-name`，这一步通常已经完成。

如果没有，请确保 `.trellis/.developer` 已存在：

```bash
python3 ./.trellis/scripts/init_developer.py your-name
```

#### 第五步：按任务 opt-in OMT，而不是一次性迁移全部任务

OMT 不要求你把所有旧任务一次性改造。

只给需要 OMT 语义的任务添加 metadata。

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

#### 第六步：开始使用 OMT 命令

在 OpenCode 里使用：

- `/omt-start`
- `/omt-plan`
- `/omt-review-plan`
- `/omt-execute`
- `/omt-verify`
- `/omt-close`

当你想走原生 Trellis 流程时，用 `/trellis:*`；想走 OMT overlay 时，用 `/omt-*`。

### 2. 现有项目，已经由官方 Trellis 管理

这是 OMT 的增量安装主场景。

#### 保持不变的东西

这些都应该保留原状：

- `.trellis/spec/`
- `.trellis/tasks/`
- `.trellis/workspace/`
- `.trellis/.current-task`
- 原有 `/trellis:*` 命令

#### 你需要新增的内容

新增：

- `.omt/`
- `oh-my-trellis.jsonc`
- `.trellis/scripts/common/` 下的 OMT 共享脚本
- `.opencode/` 下的 OMT OpenCode 资产

#### 明确不要做的事

- 不要把任务产物移出 `.trellis/tasks/<task>/`
- 不要在 `.omt/` 下面再造第二套任务状态
- 不要强制所有历史任务都迁移到 OMT
- 不要删掉 `/trellis:*`

#### 推荐的增量 rollout 顺序

1. 先提交或备份当前官方 Trellis 状态。
2. 加入 `.omt/` 和 `oh-my-trellis.jsonc`。
3. 合并 `.trellis/scripts/common/` 里的 OMT 共享脚本。
4. 刷新 `.opencode/` 中的 OMT commands / agents / plugins / skills。
5. 只挑 **一个活跃任务** 先改成 OMT 模式。
6. 用 `/omt-start` 跑通一条 strict 或 fast 流程。
7. 再按任务逐步扩大使用范围。

这样迁移最可逆，也不会把“工作流验证”与“全量任务重构”绑在一起。

### 3. 新项目如何使用

对于 greenfield 项目，最干净的方式是从一开始就把 OMT 带上。

#### 方案 A：直接使用 OMT-enhanced 分发

也就是直接从这个 fork 的 OMT-enabled 输出开始。

你的初始仓库会同时具备：

- `.trellis/`
- `.omt/`
- `oh-my-trellis.jsonc`
- 带 OMT commands / agents / skills / plugins 的 `.opencode/`

#### 方案 B：先 Trellis，再立刻叠加 OMT

如果你更习惯先从官方 Trellis 起手：

```bash
mkdir your-project
cd your-project
git init

npm install -g @mindfoldhq/trellis@latest
trellis init --opencode -u your-name
```

然后在创建第一个正式任务之前，立刻把这个 fork 中的 OMT overlay 文件加进去。

### 安装完成后的日常使用

#### Strict workflow

适合中大型任务：

1. `/omt-start`
2. `/omt-plan`
3. `/omt-review-plan`
4. `/omt-execute`
5. `/omt-verify`
6. `/omt-close`

任务产物仍然写在：

```text
.trellis/tasks/<task>/plan.md
.trellis/tasks/<task>/review.md
.trellis/tasks/<task>/execute.md
.trellis/tasks/<task>/verify.md
.trellis/tasks/<task>/close.md
```

#### Fast workflow

适合 trivial 或小范围任务。

Fast mode 只要求 `close.md`，但它必须包含：

- `## Intent`
- `## Scope`
- `## Changes`
- `## Verification`
- `## Outcome`

#### 何时从 fast 升级到 strict

当出现以下任一 trigger，就应在原任务目录内升级：

- `multiple_subsystems`
- `public_interface_change`
- `reviewer_or_oracle_required`

升级不会改任务名，也不会移动目录；只是在原地补齐 strict 所需的 artifact。

### OMT 改变了什么，不改变什么

#### OMT 改变的部分

- 增加了 role-based workflow overlay
- 在 OpenCode 中增加 `/omt-*` 命令
- 增加 strict / fast 两种 workflow mode
- 通过 `.omt/config/` + `oh-my-trellis.jsonc` 提供 two-tier routing
- 增加 portable OMO-style OpenCode skills

#### OMT 不改变的部分

- Trellis 作为唯一 durable source of truth
- 现有 Trellis 任务存储方式
- `.trellis/.current-task`
- 数值型 `current_phase` 与 `next_action`
- 现有 `/trellis:*` 命令

### 相关文件

如果你想看更实现层的解释，可以继续读：

- [`./.omt/README.md`](./.omt/README.md)
- [`./.omt/migration.md`](./.omt/migration.md)
- [`./.omt/skills.md`](./.omt/skills.md)
- [`./.omt/v1-1-evaluation.md`](./.omt/v1-1-evaluation.md)

## Spec 模板与 Marketplace

Spec 默认是空模板——需要根据你的项目技术栈和团队规范来填写。你可以从零开始写，也可以从社区模板起步：

```bash
# 从自定义仓库拉取模板
trellis init --registry https://github.com/your-org/your-spec-templates
```

浏览可用模板和了解如何发布你自己的模板，请查看 [Spec 模板页面](https://docs.trytrellis.app/zh/templates/specs-index)。

## 最新进展

- **v0.3.6**：任务生命周期 hooks、自定义模板仓库（`--registry`）、父子 subtask、修复 CC v2.1.63+ PreToolUse hook 失效。
- **v0.3.5**：修复 Kilo workflows 删除迁移清单字段名。
- **v0.3.4**：Qoder 平台支持、Kilo workflows 迁移、record-session 任务感知。
- **v0.3.1**：`trellis update` 后台 watch 模式、`.gitignore` 处理改善、文档更新。
- **v0.3.0**：支持平台从 2 个扩展到 10 个、Windows 兼容、远程 Spec 模板、`/trellis:brainstorm`。

## 常见问题

<details>
<summary><strong>它和 <code>CLAUDE.md</code>、<code>AGENTS.md</code>、<code>.cursorrules</code> 有什么区别？</strong></summary>

这些文件当然有用，但它们很容易越写越大、越写越散。Trellis 在它们之外补上了结构：分层 Spec、任务上下文、workspace 记忆，以及按平台接入的工作流。

</details>

<details>
<summary><strong>Trellis 只适合 Claude Code 吗？</strong></summary>

不是。Trellis 目前支持 Claude Code、Cursor、OpenCode、iFlow、Codex、Kilo、Kiro、Gemini CLI、Antigravity、Windsurf、Qoder、CodeBuddy 和 GitHub Copilot。每个平台的具体接入方式和入口命令，文档站都有单独说明。

</details>

<details>
<summary><strong>是不是每个 Spec 都得手写？</strong></summary>

不需要。很多团队一开始会先让 AI 根据现有代码起草 Spec，再把真正关键的规则和经验手动收紧。Trellis 的价值不在于把所有文档都写满，而在于把高信号规则沉淀下来并持续复用。

</details>

<details>
<summary><strong>团队一起用会不会经常冲突？</strong></summary>

不会。个人 workspace journal 是按开发者隔离的；共享的 Spec 和 Task 则作为仓库内容正常走评审和迭代，和其他工程资产一样管理。

</details>

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=mindfold-ai/Trellis&type=Date)](https://star-history.com/#mindfold-ai/Trellis&Date)

## 社区与资源

- [官方文档](https://docs.trytrellis.app/zh) - 产品说明、安装指南和架构文档
- [快速开始](https://docs.trytrellis.app/zh/guide/ch02-quick-start) - 快速在仓库里跑起来
- [支持平台](https://docs.trytrellis.app/zh/guide/ch13-multi-platform) - 各平台的接入方式和命令差异
- [使用场景](https://docs.trytrellis.app/zh/guide/ch08-real-world) - 看 Trellis 在真实任务里怎么落地
- [更新日志](https://docs.trytrellis.app/zh/changelog/v0.3.6) - 跟踪当前版本变化
- [Tech Blog](https://docs.trytrellis.app/zh/blog) - 设计思路和技术文章
- [GitHub Issues](https://github.com/mindfold-ai/Trellis/issues) - 提 Bug 或功能建议
- [Discord](https://discord.com/invite/tWcCZ3aRHc) - 加入社区讨论

<a id="contact-us"></a>

### 联系我们

<p align="center">
<img src="assets/wx_link4.jpg" alt="微信群" width="260" />
&nbsp;&nbsp;&nbsp;&nbsp;
<img src="assets/wecom-group-qr.png" alt="企微话题群" width="260" />
&nbsp;&nbsp;&nbsp;&nbsp;
<img src="assets/qq-group-qr.jpg" alt="QQ群" width="260" />
</p>

<p align="center">
<a href="https://github.com/mindfold-ai/Trellis">官方仓库</a> •
<a href="https://github.com/mindfold-ai/Trellis/blob/main/LICENSE">AGPL-3.0 License</a> •
Built by <a href="https://github.com/mindfold-ai">Mindfold</a>
</p>
