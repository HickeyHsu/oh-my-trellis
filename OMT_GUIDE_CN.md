# OMT 安装与使用手册

> 中文手册。
>
> English version: [`./OMT_GUIDE.md`](./OMT_GUIDE.md)

## 1. OMT 是什么

OMT 是一个 **Trellis-first 的工作流增强层**，不是 Trellis 的替代品。

- **Trellis** 仍然是 durable source of truth。
- **OMT** 在 Trellis 之上增加更严格的工作流层。
- OMT v1 当前是 **OpenCode 优先** 的实现。

具体来说：

- `.trellis/` 仍然保存任务状态、Spec、workspace journal 和任务产物
- `.omt/` 只保存可复用的 workflow 定义
- `oh-my-trellis.jsonc` 保存 OMT 的项目 / 用户配置覆盖
- `.opencode/` 增加 OMT commands / agents / plugins / skills

## 2. 当前 v1 状态

OMT v1 当前已经支持：

- strict workflow：`plan -> review -> execute -> verify -> close`
- fast workflow：适用于小范围任务
- fast → strict promotion
- OpenCode `/omt-*` 命令
- OMT agents 和可移植 OMO 风格 skills
- low/high two-tier routing

OMT v1 当前还**不**提供：

- 独立的一键增量安装器
- Claude/Codex 的 OMT runtime parity
- loop runtime、continuation hooks、auto-slash runtime

## 3. 先判断你属于哪种安装路径

有两种安装方式：

| 方式 | 适合谁 | 当前含义 |
| --- | --- | --- |
| **完整安装** | 新项目，或你希望一开始就使用 OMT-enabled 分发 | 直接从这个 fork 的 OMT-enabled 输出开始 |
| **增量安装** | 已经使用官方 Trellis 的项目 | 保留 Trellis，再把 OMT 叠加进去 |

常见项目现状有三种：

| 项目现状 | 推荐路径 |
| --- | --- |
| 现有项目，还**没有** Trellis | 先装 Trellis，再加 OMT |
| 现有项目，已经由**官方 Trellis 管理** | 增量加 OMT |
| 新项目 | 一开始就带上 OMT |

## 4. 前置条件

在使用 OMT 前，请先确认：

1. Trellis 本身能正常工作
2. 你使用 **OpenCode**，因为 OMT v1 的运行时增强主要围绕 `.opencode/`
3. 开发者身份已经初始化

基础安装：

```bash
npm install -g @mindfoldhq/trellis@latest
```

开发者身份初始化：

```bash
python3 ./.trellis/scripts/init_developer.py your-name
```

如果你不使用 OpenCode，依然可以参考 OMT 的设计与文档，但本 fork 当前提供的 v1 overlay runtime 以 OpenCode 为主。

## 5. 场景 A —— 现有项目，还没有 Trellis

这是把 OMT 介入到普通存量项目中的最稳妥路径。

### 第一步：先安装 Trellis

```bash
cd your-project
trellis init --opencode -u your-name
```

你会得到标准 Trellis 底座：

- `.trellis/`
- `.opencode/`
- `.trellis/workspace/your-name/`

### 第二步：先提交纯 Trellis 基线

在启用 OMT 前，先提交一版“只有 Trellis、没有 OMT”的状态，回滚最清楚。

### 第三步：叠加 OMT overlay

把这个 fork 中的 OMT 文件叠加到项目中。

#### 项目级 OMT 定义层

```text
.omt/
oh-my-trellis.jsonc
```

#### Trellis 共享脚本新增 / 更新

```text
.trellis/scripts/common/omt.py
.trellis/scripts/common/omt_config.py
.trellis/scripts/common/omt_context.py
.trellis/scripts/common/omt_workflow.py
.trellis/scripts/common/git_context.py
.trellis/scripts/common/paths.py
```

#### OpenCode 增强文件

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

### 第四步：按需 opt-in OMT，而不是全量迁移

OMT 不要求你一次性把所有旧任务都改造完。

只有需要 OMT 工作流语义的任务才加 metadata：

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

### 第五步：开始用 OMT 命令

在 OpenCode 中使用：

- `/omt-start`
- `/omt-plan`
- `/omt-review-plan`
- `/omt-execute`
- `/omt-verify`
- `/omt-close`

当你想走原生 Trellis 流程时，用 `/trellis:*`；当你想走 OMT overlay 时，用 `/omt-*`。

## 6. 场景 B —— 现有项目，已经由官方 Trellis 管理

这是 OMT 的主增量安装场景。

### 保持不变的内容

这些都应继续保留：

- `.trellis/spec/`
- `.trellis/tasks/`
- `.trellis/workspace/`
- `.trellis/.current-task`
- 现有 `/trellis:*` 命令
- Trellis 原有 `task.json / current_phase / next_action` 语义

### OMT 额外增加的内容

新增：

- `.omt/`
- `oh-my-trellis.jsonc`
- `.trellis/scripts/common/` 下的 OMT 共享脚本
- `.opencode/` 下的 OMT OpenCode 资产

### 明确不要做的事

- 不要把任务产物移出 `.trellis/tasks/<task>/`
- 不要在 `.omt/` 下再造第二套任务状态
- 不要把所有历史任务都强制切换成 OMT
- 不要删掉 `/trellis:*`

### 推荐 rollout 顺序

1. 先提交或备份当前官方 Trellis 状态
2. 加入 `.omt/` 和 `oh-my-trellis.jsonc`
3. 合并 `.trellis/scripts/common/` 中的 OMT 共享脚本
4. 刷新 `.opencode/` 中的 OMT commands / agents / plugins / skills
5. 只挑 **一个活跃任务** 先切到 OMT 模式
6. 用 `/omt-start` 跑通一条 strict 或 fast 流程
7. 再逐个任务扩展

这样最可逆，也不会把“流程验证”与“全量任务改造”绑死。

## 7. 场景 C —— 新项目如何使用

对于新项目，最干净的方式是从一开始就带上 OMT。

### 方案 A：直接从 OMT-enabled fork 输出开始

如果你就打算把 OMT 当默认工作流，这样最省事。

初始仓库直接具备：

- `.trellis/`
- `.omt/`
- `oh-my-trellis.jsonc`
- 带 OMT commands / agents / plugins / skills 的 `.opencode/`

### 方案 B：先 Trellis，再立刻叠加 OMT

```bash
mkdir your-project
cd your-project
git init

npm install -g @mindfoldhq/trellis@latest
trellis init --opencode -u your-name
```

然后在创建第一个正式任务前，立刻叠加这个 fork 中的 OMT overlay 文件。

## 8. 安装完成后的日常使用

### Strict workflow

适合中大型任务：

1. `/omt-start`
2. `/omt-plan`
3. `/omt-review-plan`
4. `/omt-execute`
5. `/omt-verify`
6. `/omt-close`

任务产物仍写在：

```text
.trellis/tasks/<task>/plan.md
.trellis/tasks/<task>/review.md
.trellis/tasks/<task>/execute.md
.trellis/tasks/<task>/verify.md
.trellis/tasks/<task>/close.md
```

### Fast workflow

适合 trivial 或小范围任务。

Fast mode 只要求 `close.md`，但它必须包含：

- `## Intent`
- `## Scope`
- `## Changes`
- `## Verification`
- `## Outcome`

### 何时从 fast 升级到 strict

当出现以下任一 trigger，就应该原地升级：

- `multiple_subsystems`
- `public_interface_change`
- `reviewer_or_oracle_required`

升级不会改任务名，也不会搬目录；只是在原地补齐 strict 所需产物。

## 9. 更新官方 Trellis 时如何保留 OMT

OMT 之所以采用 overlay 策略，就是为了让 Trellis 升级可控。

推荐顺序：

1. 先更新官方 Trellis 底座
2. 再检查 OMT 覆盖 / 扩展过的文件
3. 只对需要的地方重新应用 OMT overlay
4. 重新跑验证：
   - lint
   - tests
   - typecheck
   - python checks

也就是说：

> 把 Trellis 视作 base product，
> 把 OMT 视作 project-level augmentation layer。

## 10. OMT 改变什么，不改变什么

### OMT 改变的部分

- 增加 role-based workflow overlay
- 增加 OpenCode `/omt-*` 命令
- 增加 strict / fast workflow modes
- 通过 `.omt/config/` + `oh-my-trellis.jsonc` 提供 two-tier routing
- 增加 portable OMO 风格 OpenCode skills

### OMT 不改变的部分

- Trellis 作为唯一 durable source of truth
- 原有 Trellis 任务存储方式
- `.trellis/.current-task`
- 数值型 `current_phase` 与 `next_action`
- 现有 `/trellis:*` 命令

## 11. 相关文件

如果你想看更实现层的解释，可以继续阅读：

- [`./.omt/README.md`](./.omt/README.md)
- [`./.omt/migration.md`](./.omt/migration.md)
- [`./.omt/skills.md`](./.omt/skills.md)
- [`./.omt/v1-1-evaluation.md`](./.omt/v1-1-evaluation.md)
