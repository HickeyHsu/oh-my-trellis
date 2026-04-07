# OMT Session-Start Hook

Purpose:

- inject OMT session context
- prefer shared context bundle over ad hoc assembly
- remain optional and non-authoritative

Rules:

- do not write task state
- if unavailable, `/omt-start` still works via explicit shared-script fallback
