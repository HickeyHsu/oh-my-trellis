# OMT Migration Guide

## Goal

Adopt OMT as an additive overlay without replacing stock Trellis project structure.

Existing Trellis repositories can adopt OMT without replacing their existing Trellis task and workflow storage.

## What Stays the Same

- `.trellis/` remains the source of truth
- existing Trellis tasks still work without OMT metadata
- `/trellis:*` commands remain valid
- workspace journals and session summaries still use Trellis paths

## What Gets Added

1. `.omt/` definition layer
2. `oh-my-trellis.jsonc` project override config
3. OpenCode adapter assets under `.opencode/`
4. Optional OMT task metadata in `task.json.meta`

## Migration Steps for an Existing Trellis Repo

1. Add the `.omt/` directory and root `oh-my-trellis.jsonc`
2. Keep existing Trellis-generated files intact
3. Reconfigure OpenCode output so `.opencode/` includes OMT commands, agents, skills, and plugins
4. Leave existing tasks untouched unless they need OMT workflow semantics

## Lazy Task Adoption

Only tasks that opt into OMT require metadata changes.

### Strict Mode

```json
{
  "meta": {
    "workflow_id": "omt/v1",
    "workflow_mode": "strict"
  }
}
```

### Fast Mode

```json
{
  "meta": {
    "workflow_id": "omt/v1",
    "workflow_mode": "fast"
  }
}
```

## Fast-to-Strict Promotion

Promotion happens in place.

- no task rename
- no task directory move
- no second state store

Promotion adds the missing strict artifacts into the same task directory.

## Current v1 Boundaries

- no Trellis generator integration required
- no Claude/Codex OMT parity in v1
- no loop/continuation runtime shipped in v1
- no complex provider fallback matrix
