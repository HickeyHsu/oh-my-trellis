# /omt-start

Start an OMT session.

## Responsibilities

- Read `.trellis/workflow.md`
- Read `python3 ./.trellis/scripts/get_context.py`
- Read the active task if one exists
- Summarize current OMT/Trellis state
- Recommend the next best OMT step

## Output

Provide:

1. Current task summary
2. Workflow mode if the task is OMT-managed
3. Missing artifacts, if any
4. Recommended next command

Fast-mode guidance:

- Fast tasks should only rely on `close.md`
- If the task now spans multiple subsystems, changes a public interface, or needs reviewer/oracle involvement, promote it to strict mode in place
