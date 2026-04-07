import { getBrowserDefault, loadOmtConfig, resolveOmtModel } from "../lib/omt-config.js"

const AGENT_ROLE_MAP = {
  "omt-planner": { role: "planner", mode: "strict" },
  "omt-reviewer": { role: "reviewer", mode: "strict" },
  "omt-executor": { role: "executor", mode: "strict" },
  "omt-researcher": { role: "researcher", mode: "strict" },
  "omt-oracle": { role: "oracle", mode: "strict" },
}

export default async ({ directory }) => ({
  config: async (config) => {
    const omtConfig = loadOmtConfig(directory)
    const browserDefault = getBrowserDefault(omtConfig)

    if (!config.agent) {
      config.agent = {}
    }

    for (const [agentName, mapping] of Object.entries(AGENT_ROLE_MAP)) {
      if (!config.agent[agentName]) {
        continue
      }
      const model = resolveOmtModel(omtConfig, mapping.role, mapping.mode)
      if (model) {
        config.agent[agentName].model = model
      }
    }

    config.omt = {
      ...(config.omt || {}),
      browserDefault,
      routing: omtConfig.routing || {},
    }
  },
})
