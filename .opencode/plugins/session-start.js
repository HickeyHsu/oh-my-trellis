/* global process */

import { existsSync } from "fs"
import { join } from "path"
import { TrellisContext, contextCollector, debugLog } from "../lib/trellis-context.js"

function buildSessionContext(ctx) {
  const claudeDir = join(ctx.directory, ".claude")
  const opencodeDir = join(ctx.directory, ".opencode")
  const taskRef = ctx.getCurrentTask()
  const taskDir = taskRef ? ctx.resolveTaskDir(taskRef) : null

  const parts = []

  parts.push(`<trellis-context>
You are starting a new session in a Trellis-managed project.
Read and follow all instructions below carefully.
</trellis-context>`)

  parts.push("<current-state>")
  parts.push(`Trellis project: ${ctx.isTrellisProject() ? "yes" : "no"}`)
  parts.push(`Active task: ${taskRef || "none"}`)
  if (taskDir && existsSync(taskDir)) {
    parts.push(`Task directory: ${taskDir}`)
  }
  parts.push("</current-state>")

  if (!ctx.isDeveloperInitialized()) {
    parts.push("<developer-warning>")
    parts.push("Developer identity is not initialized. Run `python3 ./.trellis/scripts/init_developer.py <name>` before relying on full Trellis session context.")
    parts.push("</developer-warning>")
  }

  const workflow = ctx.readProjectFile(".trellis/workflow.md")
  if (workflow) {
    parts.push("<workflow>")
    parts.push(workflow)
    parts.push("</workflow>")
  }

  parts.push("<guidelines>")
  parts.push("## Packages")
  parts.push(taskDir ? "Task-scoped package context should be derived from task metadata and checked specs." : "No active task package selected")
  parts.push("\n## Guides")
  const guidesIndex = ctx.readProjectFile(".trellis/spec/guides/index.md")
  parts.push(guidesIndex || "Not configured")
  parts.push("</guidelines>")

  let startMd = ctx.readFile(join(claudeDir, "commands", "trellis", "start.md"))
  if (!startMd) {
    startMd = ctx.readFile(join(opencodeDir, "commands", "trellis", "start.md"))
  }
  if (startMd) {
    parts.push("<instructions>")
    parts.push(startMd)
    parts.push("</instructions>")
  }

  parts.push(`<ready>
Context loaded. Wait for user's first message, then follow <instructions> to handle their request.
</ready>`)

  return parts.join("\n\n")
}

export default async ({ directory }) => {
  const ctx = new TrellisContext(directory)
  debugLog("session", "Plugin loaded, directory:", directory)

  return {
    "chat.message": async (input) => {
      try {
        const sessionID = input.sessionID
        const agent = input.agent || "unknown"
        debugLog("session", "chat.message called, sessionID:", sessionID, "agent:", agent)

        if (process.env.OPENCODE_NON_INTERACTIVE === "1") {
          debugLog("session", "Skipping - non-interactive mode")
          return
        }

        if (ctx.shouldSkipHook("session-start")) {
          debugLog("session", "Skipping - omo will handle via .claude/hooks/")
          return
        }

        if (contextCollector.isProcessed(sessionID)) {
          debugLog("session", "Skipping - session already processed")
          return
        }

        contextCollector.markProcessed(sessionID)
        const context = buildSessionContext(ctx)
        debugLog("session", "Built context, length:", context.length)

        contextCollector.store(sessionID, context)
        debugLog("session", "Context stored for session:", sessionID)
      } catch (error) {
        debugLog("session", "Error in chat.message:", error.message, error.stack)
      }
    },

    "experimental.chat.messages.transform": async (input, output) => {
      try {
        const { messages } = output
        debugLog("session", "messages.transform called, messageCount:", messages?.length)

        if (!messages || messages.length === 0) {
          return
        }

        let lastUserMessageIndex = -1
        for (let i = messages.length - 1; i >= 0; i--) {
          if (messages[i].info?.role === "user") {
            lastUserMessageIndex = i
            break
          }
        }

        if (lastUserMessageIndex === -1) {
          debugLog("session", "No user message found")
          return
        }

        const lastUserMessage = messages[lastUserMessageIndex]
        const sessionID = lastUserMessage.info?.sessionID

        debugLog("session", "Found user message, sessionID:", sessionID)

        if (!sessionID || !contextCollector.hasPending(sessionID)) {
          debugLog("session", "No pending context for session")
          return
        }

        const pending = contextCollector.consume(sessionID)
        const textPartIndex = lastUserMessage.parts?.findIndex(
          p => p.type === "text" && p.text !== undefined,
        )

        if (textPartIndex === -1) {
          debugLog("session", "No text part found in user message")
          return
        }

        const originalText = lastUserMessage.parts[textPartIndex].text || ""
        lastUserMessage.parts[textPartIndex].text = `${pending.content}\n\n---\n\n${originalText}`

        debugLog("session", "Injected context by prepending to text, length:", pending.content.length)
      } catch (error) {
        debugLog("session", "Error in messages.transform:", error.message, error.stack)
      }
    },
  }
}
