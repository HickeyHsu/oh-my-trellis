import { existsSync, readFileSync } from "fs"
import { join } from "path"

export function stripJsonComments(content) {
  return content
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|\s)\/\/.*$/gm, "$1")
}

export function readJsoncFile(filePath) {
  if (!existsSync(filePath)) {
    return {}
  }
  try {
    const raw = readFileSync(filePath, "utf-8")
    const parsed = JSON.parse(stripJsonComments(raw))
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {}
  } catch {
    return {}
  }
}

export function deepMerge(base, override) {
  const result = { ...base }
  for (const [key, value] of Object.entries(override || {})) {
    const current = result[key]
    if (current && typeof current === "object" && !Array.isArray(current) && value && typeof value === "object" && !Array.isArray(value)) {
      result[key] = deepMerge(current, value)
    } else {
      result[key] = value
    }
  }
  return result
}

export function loadOmtConfig(directory) {
  const defaultsPath = join(directory, ".omt", "config", "oh-my-trellis.defaults.jsonc")
  const defaults = readJsoncFile(defaultsPath)
  const projectPathJsonc = join(directory, "oh-my-trellis.jsonc")
  const projectPathJson = join(directory, "oh-my-trellis.json")
  const project = existsSync(projectPathJsonc)
    ? readJsoncFile(projectPathJsonc)
    : readJsoncFile(projectPathJson)
  return deepMerge(defaults, project)
}

export function resolveOmtTier(config, role, mode = "strict") {
  const routing = config?.routing
  if (!routing || routing.enabled === false) {
    return null
  }
  if (role === "executor") {
    const executor = routing.executor || {}
    return executor[mode] || null
  }
  const roles = routing.roles || {}
  return roles[role] || null
}

export function resolveOmtModel(config, role, mode = "strict") {
  const tier = resolveOmtTier(config, role, mode)
  if (!tier) {
    return null
  }
  const tiers = config?.routing?.tiers || {}
  const value = tiers[tier]
  return typeof value === "string" && value.length > 0 ? value : null
}

export function getBrowserDefault(config) {
  return config?.skills?.browser_default || "playwright"
}
