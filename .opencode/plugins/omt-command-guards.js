import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"

function readCurrentTask(directory) {
  const currentTaskPath = join(directory, ".trellis", ".current-task")
  if (!existsSync(currentTaskPath)) {
    return null
  }
  const raw = readFileSync(currentTaskPath, "utf-8").trim()
  return raw || null
}

function readTaskJson(directory, taskPath) {
  if (!taskPath) {
    return null
  }
  const taskJsonPath = join(directory, taskPath, "task.json")
  if (!existsSync(taskJsonPath)) {
    return null
  }
  try {
    return JSON.parse(readFileSync(taskJsonPath, "utf-8"))
  } catch {
    return null
  }
}

function readVerifyOutcome(directory, taskPath) {
  if (!taskPath) {
    return null
  }
  const verifyPath = join(directory, taskPath, "verify.md")
  if (!existsSync(verifyPath)) {
    return null
  }
  const content = readFileSync(verifyPath, "utf-8")
  const matches = [...content.matchAll(/^### Outcome\n\n([^\n]+)$/gm)]
  if (matches.length === 0) {
    return null
  }
  return matches[matches.length - 1]?.[1]?.trim()?.toLowerCase() || null
}

function latestReviewApproved(directory, taskPath) {
  if (!taskPath) {
    return false
  }
  const reviewPath = join(directory, taskPath, "review.md")
  if (!existsSync(reviewPath)) {
    return false
  }
  const content = readFileSync(reviewPath, "utf-8")
  const matches = [...content.matchAll(/^### Verdict\n\n([^\n]+)$/gm)]
  if (matches.length === 0) {
    return false
  }
  const verdict = matches[matches.length - 1]?.[1]?.trim()?.toLowerCase()
  return verdict === "approved" || verdict === "pass" || verdict === "passed"
}

function prependNotice(output, text) {
  if (!output.parts || !Array.isArray(output.parts)) {
    return
  }
  output.parts.unshift({ type: "text", text })
}

export default async ({ directory }) => ({
  "command.execute.before": async (input, output) => {
    const command = String(input.command || "").toLowerCase()
    const taskPath = readCurrentTask(directory)
    const taskJson = readTaskJson(directory, taskPath)

    if (!taskJson || taskJson.meta?.workflow_id !== "omt/v1") {
      return
    }

    if (command === "omt-execute" && !latestReviewApproved(directory, taskPath)) {
      prependNotice(
        output,
        "<omt-pre-execute>Execution is gated: the latest `review.md` verdict is not approved. Use `/omt-review-plan` or revise the plan before executing. If this hook is unavailable later, the shared Python workflow gate still blocks execution.</omt-pre-execute>",
      )
    }

    if (command === "omt-close") {
      const outcome = readVerifyOutcome(directory, taskPath)
      if (outcome !== "pass" && outcome !== "human-needed") {
        prependNotice(
          output,
          "<omt-task-finish>Close is gated: `verify.md` must end with `pass` or `human-needed`. If this hook is unavailable later, the shared Python close finalizer still enforces the same rule.</omt-task-finish>",
        )
      }
    }
  },
})
