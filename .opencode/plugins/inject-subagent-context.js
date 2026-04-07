import { existsSync, readdirSync } from "fs"
import { join } from "path"
import { TrellisContext, debugLog } from "../lib/trellis-context.js"

const AGENTS_ALL = ["implement", "check", "debug", "research", "planner", "reviewer", "executor", "oracle"]
const AGENTS_REQUIRE_TASK = ["implement", "check", "debug", "planner", "reviewer", "executor", "oracle"]

function getImplementContext(ctx, taskDir) {
  const parts = []
  let jsonlPath = join(ctx.directory, taskDir, "implement.jsonl")
  let entries = ctx.readJsonlWithFiles(jsonlPath)

  if (entries.length === 0) {
    jsonlPath = join(ctx.directory, taskDir, "spec.jsonl")
    entries = ctx.readJsonlWithFiles(jsonlPath)
  }

  if (entries.length > 0) {
    parts.push(ctx.buildContextFromEntries(entries))
  }

  const prd = ctx.readProjectFile(join(taskDir, "prd.md"))
  if (prd) {
    parts.push(`=== ${taskDir}/prd.md (Requirements) ===\n${prd}`)
  }

  const info = ctx.readProjectFile(join(taskDir, "info.md"))
  if (info) {
    parts.push(`=== ${taskDir}/info.md (Technical Design) ===\n${info}`)
  }

  return parts.join("\n\n")
}

function getCheckContext(ctx, taskDir) {
  const parts = []
  const jsonlPath = join(ctx.directory, taskDir, "check.jsonl")
  const entries = ctx.readJsonlWithFiles(jsonlPath)

  if (entries.length > 0) {
    parts.push(ctx.buildContextFromEntries(entries))
  } else {
    const checkFiles = [
      [".opencode/commands/trellis/finish-work.md", "Finish work checklist"],
      [".opencode/commands/trellis/check-cross-layer.md", "Cross-layer check spec"],
      [".opencode/commands/trellis/check.md", "Check spec"],
    ]
    for (const [f, description] of checkFiles) {
      const content = ctx.readProjectFile(f)
      if (content) {
        parts.push(`=== ${f} (${description}) ===\n${content}`)
      }
    }

    const specJsonlPath = join(ctx.directory, taskDir, "spec.jsonl")
    const specEntries = ctx.readJsonlWithFiles(specJsonlPath)
    for (const entry of specEntries) {
      parts.push(`=== ${entry.path} (Dev spec) ===\n${entry.content}`)
    }
  }

  const prd = ctx.readProjectFile(join(taskDir, "prd.md"))
  if (prd) {
    parts.push(`=== ${taskDir}/prd.md (Requirements - for understanding intent) ===\n${prd}`)
  }

  return parts.join("\n\n")
}

function getFinishContext(ctx, taskDir) {
  const parts = []
  const jsonlPath = join(ctx.directory, taskDir, "finish.jsonl")
  const entries = ctx.readJsonlWithFiles(jsonlPath)

  if (entries.length > 0) {
    parts.push(ctx.buildContextFromEntries(entries))
  } else {
    const finishWork = ctx.readProjectFile(".opencode/commands/trellis/finish-work.md")
    if (finishWork) {
      parts.push(`=== .opencode/commands/trellis/finish-work.md (Finish checklist) ===\n${finishWork}`)
    }
  }

  const updateSpec = ctx.readProjectFile(".opencode/commands/trellis/update-spec.md")
  if (updateSpec) {
    parts.push(`=== .opencode/commands/trellis/update-spec.md (Spec update process) ===\n${updateSpec}`)
  }

  const prd = ctx.readProjectFile(join(taskDir, "prd.md"))
  if (prd) {
    parts.push(`=== ${taskDir}/prd.md (Requirements - verify all met) ===\n${prd}`)
  }

  return parts.join("\n\n")
}

function getDebugContext(ctx, taskDir) {
  const parts = []
  const jsonlPath = join(ctx.directory, taskDir, "debug.jsonl")
  const entries = ctx.readJsonlWithFiles(jsonlPath)

  if (entries.length > 0) {
    parts.push(ctx.buildContextFromEntries(entries))
  } else {
    const specJsonlPath = join(ctx.directory, taskDir, "spec.jsonl")
    const specEntries = ctx.readJsonlWithFiles(specJsonlPath)
    for (const entry of specEntries) {
      parts.push(`=== ${entry.path} (Dev spec) ===\n${entry.content}`)
    }

    const checkFiles = [
      [".opencode/commands/trellis/check.md", "Check spec"],
      [".opencode/commands/trellis/check-cross-layer.md", "Cross-layer check spec"],
    ]
    for (const [f, description] of checkFiles) {
      const content = ctx.readProjectFile(f)
      if (content) {
        parts.push(`=== ${f} (${description}) ===\n${content}`)
      }
    }
  }

  const codex = ctx.readProjectFile(join(taskDir, "codex-review-output.txt"))
  if (codex) {
    parts.push(`=== ${taskDir}/codex-review-output.txt (Codex Review Results) ===\n${codex}`)
  }

  return parts.join("\n\n")
}

function getResearchContext(ctx, taskDir) {
  const parts = []
  const specPath = ".trellis/spec"
  const specFull = ctx.resolveProjectPath(specPath)
  const structureLines = [`## Project Spec Directory Structure\n\n\`\`\`\n${specPath}/`]

  if (specFull && existsSync(specFull)) {
    try {
      const entries = readdirSync(specFull, { withFileTypes: true })
        .filter(d => d.isDirectory() && !d.name.startsWith("."))
        .sort((a, b) => a.name.localeCompare(b.name))

      for (const entry of entries) {
        const entryPath = join(specFull, entry.name)
        if (existsSync(join(entryPath, "index.md"))) {
          structureLines.push(`├── ${entry.name}/`)
        }
      }
    } catch (error) {
      debugLog("inject", "Failed to inspect spec directory structure:", error.message)
    }
  }

  structureLines.push("```")
  parts.push(structureLines.join("\n") + `

## Search Tips

- Spec files: \`.trellis/spec/**/*.md\`
- Known issues: \`.trellis/big-question/\`
- Code search: Use Glob and Grep tools
- Tech solutions: Use mcp__exa__web_search_exa or mcp__exa__get_code_context_exa`)

  if (taskDir) {
    const jsonlPath = join(ctx.directory, taskDir, "research.jsonl")
    const entries = ctx.readJsonlWithFiles(jsonlPath)
    if (entries.length > 0) {
      parts.push("\n## Additional Search Context\n")
      parts.push(ctx.buildContextFromEntries(entries))
    }
  }

  return parts.join("\n\n")
}

function getContextForAgent(ctx, taskDir, subagentType, isFinish) {
  switch (subagentType) {
    case "implement":
    case "planner":
    case "executor":
      return getImplementContext(ctx, taskDir)
    case "check":
    case "reviewer":
      return isFinish ? getFinishContext(ctx, taskDir) : getCheckContext(ctx, taskDir)
    case "debug":
      return getDebugContext(ctx, taskDir)
    case "research":
    case "oracle":
      return getResearchContext(ctx, taskDir)
    default:
      return ""
  }
}

function buildPrompt(agentType, originalPrompt, context, isFinish = false) {
  const templates = {
    implement: `# Implement Agent Task

You are the Implement Agent in the Multi-Agent Pipeline.

## Your Context

${context}

---

## Your Task

${originalPrompt}

---

## Workflow

1. **Understand specs** - All dev specs are injected above
2. **Understand requirements** - Read requirements and technical design
3. **Implement feature** - Follow specs and design
4. **Self-check** - Ensure code quality

## Important Constraints

- Do NOT execute git commit
- Follow all dev specs injected above
- Report list of modified/created files when done`,

    check: isFinish ? `# Finish Agent Task

You are performing the final check before creating a PR.

## Your Context

${context}

---

## Your Task

${originalPrompt}

---

## Workflow

1. **Review changes** - Run \`git diff --name-only\` to see all changed files
2. **Verify requirements** - Check each requirement in prd.md is implemented
3. **Spec sync** - Analyze whether changes introduce new patterns, contracts, or conventions
   - If new pattern/convention found: read target spec file → update it → update index.md if needed
   - If infra/cross-layer change: follow the 7-section mandatory template from update-spec.md
   - If pure code fix with no new patterns: skip this step
4. **Run final checks** - Execute lint and typecheck
5. **Confirm ready** - Ensure code is ready for PR

## Important Constraints

- You MAY update spec files when gaps are detected (use update-spec.md as guide)
- MUST read the target spec file BEFORE editing (avoid duplicating existing content)
- Do NOT update specs for trivial changes (typos, formatting, obvious fixes)
- If critical CODE issues found, report them clearly (fix specs, not code)
- Verify all acceptance criteria in prd.md are met` :
      `# Check Agent Task

You are the Check Agent in the Multi-Agent Pipeline.

## Your Context

${context}

---

## Your Task

${originalPrompt}

---

## Workflow

1. **Get changes** - Run \`git diff --name-only\` and \`git diff\`
2. **Check against specs** - Check item by item
3. **Self-fix** - Fix issues directly, don't just report
4. **Run verification** - Run lint and typecheck

## Important Constraints

- Fix issues yourself, don't just report
- Must execute complete checklist`,

    debug: `# Debug Agent Task

You are the Debug Agent in the Multi-Agent Pipeline.

## Your Context

${context}

---

## Your Task

${originalPrompt}

---

## Workflow

1. **Understand issues** - Analyze issues pointed out
2. **Locate code** - Find positions that need fixing
3. **Fix against specs** - Fix following dev specs
4. **Verify fixes** - Run typecheck

## Important Constraints

- Do NOT execute git commit
- Run typecheck after each fix`,

    research: `# Research Agent Task

You are the Research Agent in the Multi-Agent Pipeline.

## Core Principle

**You do one thing: find and explain information.**

## Project Info

${context}

---

## Your Task

${originalPrompt}

---

## Workflow

1. **Understand query** - Determine search type and scope
2. **Plan search** - List search steps
3. **Execute search** - Run multiple searches in parallel
4. **Organize results** - Output structured report

## Strict Boundaries

**Only allowed**: Describe what exists, where it is, how it works

**Forbidden**: Suggest improvements, criticize implementation, modify files`,
  }

  return templates[agentType] || originalPrompt
}

export default async ({ directory }) => {
  const ctx = new TrellisContext(directory)
  debugLog("inject", "Plugin loaded, directory:", directory)

  return {
    "tool.execute.before": async (input, output) => {
      try {
        debugLog("inject", "tool.execute.before called, tool:", input?.tool)

        const toolName = input?.tool?.toLowerCase()
        if (toolName !== "task") {
          return
        }

        const args = output?.args || {}
        const subagentType = args.subagent_type
        const originalPrompt = args.prompt || ""

        debugLog("inject", "Task tool called, subagent_type:", subagentType)

        if (!AGENTS_ALL.includes(subagentType)) {
          debugLog("inject", "Skipping - unsupported subagent_type")
          return
        }

        if (ctx.shouldSkipHook("inject-subagent-context")) {
          debugLog("inject", "Skipping - omo will handle via .claude/hooks/")
          return
        }

        const taskDir = ctx.getCurrentTask()
        if (AGENTS_REQUIRE_TASK.includes(subagentType)) {
          if (!taskDir) {
            debugLog("inject", "Skipping - no current task")
            return
          }
          const taskDirFull = ctx.resolveTaskDir(taskDir)
          if (!taskDirFull || !existsSync(taskDirFull)) {
            debugLog("inject", "Skipping - task directory not found")
            return
          }
        }

        const isFinish = originalPrompt.toLowerCase().includes("[finish]")
        const context = getContextForAgent(ctx, taskDir, subagentType, isFinish)
        if (!context) {
          debugLog("inject", "No context to inject")
          return
        }

        const promptType = subagentType === "planner" || subagentType === "executor"
          ? "implement"
          : subagentType === "reviewer"
            ? "check"
            : subagentType === "oracle"
              ? "research"
              : subagentType

        output.args = {
          ...args,
          prompt: buildPrompt(promptType, originalPrompt, context, isFinish),
        }

        debugLog("inject", "Injected context for", subagentType, "prompt length:", output.args.prompt.length)
      } catch (error) {
        debugLog("inject", "Error in tool.execute.before:", error.message, error.stack)
      }
    },
  }
}
