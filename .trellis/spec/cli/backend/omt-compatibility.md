# OMT Compatibility Contract

> Compatibility-first rules for layering OMT on top of Trellis task state.

---

## Purpose

OMT must extend Trellis without replacing Trellis's durable task-state model.
This document defines the additive compatibility contract for task metadata,
phase semantics, and artifact placement.

---

## Source of Truth

Trellis remains the only durable task-state source of truth:

- `.trellis/.current-task`
- `.trellis/tasks/<task>/task.json`
- `.trellis/tasks/<task>/` task artifacts

OMT must **not** create a second durable task database under `.omt/`, host
config directories, or session memory.

---

## Stable Fields (Do Not Redefine)

These Trellis fields remain canonical and must keep their current meaning:

| Field | Owner | Meaning |
|------|-------|---------|
| `.trellis/.current-task` | Trellis | Active task pointer |
| `task.json.status` | Trellis | Human-facing task status |
| `task.json.current_phase` | Trellis | Current numeric phase |
| `task.json.next_action` | Trellis | Ordered phase/action table |
| `task.json.meta` | Shared additive space | Extensible metadata bag |

OMT may read these fields and map them to OMT behavior, but must not replace
them with a parallel lifecycle model.

---

## Additive OMT Metadata

OMT-managed tasks are marked **only** under `task.json.meta`:

```json
{
  "meta": {
    "workflow_id": "omt/v1",
    "workflow_mode": "strict"
  }
}
```

Allowed values:

| Key | Allowed Values | Meaning |
|-----|----------------|---------|
| `workflow_id` | `omt/v1` | Task is managed by OMT v1 compatibility rules |
| `workflow_mode` | `strict`, `fast` | OMT workflow path selection |

Tasks without these keys remain valid Trellis tasks and must continue working
without migration.

---

## Compatibility Matrix

| Concern | Trellis Canonical Field | OMT Rule |
|---------|--------------------------|----------|
| Active task selection | `.trellis/.current-task` | Reuse as-is |
| Task lifecycle storage | `task.json` | Extend additively only |
| Phase progression | `current_phase` + `next_action` | Map OMT semantics onto existing numeric phases |
| OMT enablement | `task.json.meta.workflow_id` | Additive marker only |
| OMT mode | `task.json.meta.workflow_mode` | `strict` or `fast` only |
| Task artifacts | `.trellis/tasks/<task>/...` | OMT writes artifacts here, not under `.omt/` |

---

## OMT Mode Expectations

### Strict Mode

- OMT metadata: `workflow_id=omt/v1`, `workflow_mode=strict`
- Uses Trellis numeric phase storage
- Produces phase artifacts in the task directory

### Fast Mode

- OMT metadata: `workflow_id=omt/v1`, `workflow_mode=fast`
- Still uses the same Trellis pointer and task.json storage
- Produces a reduced artifact set, but never bypasses durable recording

---

## Preservation Rules

When any script mutates `task.json`, it must preserve unknown fields and additive
metadata. In practice this means:

1. Read the existing JSON dict
2. Mutate only the intended keys
3. Write the same dict back

Do **not** rebuild `task.json` from a reduced schema when updating phase, status,
or other lifecycle fields.

---

## Non-Goals for This Compatibility Layer

- No second task-state store under `.omt/`
- No replacement of numeric Trellis phases with string-only OMT states
- No requirement that every Trellis task become OMT-managed
- No host-specific task state stored in OpenCode / Claude / Codex directories

---

## Verification Checklist

- Existing Trellis tasks load without OMT metadata
- OMT-managed tasks are marked only under `task.json.meta`
- Current-task normalization behavior is unchanged
- Numeric phase updates preserve OMT metadata
- `.omt/` never receives per-task runtime state
