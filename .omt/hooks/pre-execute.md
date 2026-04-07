# OMT Pre-Execute Hook

Purpose:

- remind execution commands about required plan/review gates
- surface fallback guidance when hook support is partial

Rules:

- do not mutate task state
- durable execute gating belongs to shared workflow scripts
