# OMT v1.1 Deferred Feature Evaluation

This appendix records the v1.1 recommendation status for features intentionally not shipped in OMT v1 runtime.

## 1. Loops (`ralph-loop`, `ulw-loop` style)

### Practicality

High for long-running work and autonomous continuation.

### Trellis Fit

Medium-low. Looping behavior can easily outrun task checkpoints and artifact gates.

### Non-Invasiveness

Low. Loops need continuation state, stop semantics, and watchdog behavior.

### Feasibility

High technically, but risky from workflow-governance perspective.

### Recommendation

Do not ship as default. Consider only as an experimental v1.1 module gated by:

- approved OMT plan
- explicit stop command
- periodic checkpoint writes to `.trellis/tasks/<task>/`

## 2. Continuation Hooks

### Low-Risk Candidates

- background notification
- compaction context reinjection
- compaction todo/context preservation

### High-Intrusion Candidates

- todo continuation enforcement
- atlas-style continuation orchestration
- unstable-agent babysitting

### Recommendation

Only evaluate low-risk continuation helpers for v1.1. Keep high-intrusion continuation features out unless OMT first proves a stable checkpoint-driven continuation model.

## 3. Auto-Slash Command

### Practicality

Moderate. It improves ergonomics for power users.

### Trellis Fit

Medium-low because OMT already introduces a second command namespace beside `/trellis:*`.

### Non-Invasiveness

Medium-low. It changes command dispatch semantics and can make workflow entry less explicit.

### Recommendation

If evaluated in v1.1, keep it default-off and only enable it as a convenience feature after verifying that `/trellis:*` and `/omt-*` remain unambiguous.
