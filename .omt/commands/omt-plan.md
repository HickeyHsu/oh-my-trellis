# /omt-plan

Generate or refresh `plan.md` for the active task.

## Steps

1. Read the active task and its `prd.md`
2. Read relevant `.trellis/spec/` docs
3. Write or update `plan.md` using the canonical sections from the planner contract
4. If `plan.md` already exists, append `## Round N` instead of replacing the existing artifact
4. Do not change application code
