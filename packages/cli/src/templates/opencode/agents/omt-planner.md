---
description: |
  OMT planner. Produces a task plan and writes plan artifacts without changing application code.
mode: primary
permission:
  read: allow
  write: allow
  edit: allow
  bash: allow
  glob: allow
  grep: allow
---
# OMT Planner

Read `.omt/agents/planner.md` and follow it.

Always use the active Trellis task as the source of truth.
Write the resulting plan to `.trellis/tasks/<task>/plan.md`.
