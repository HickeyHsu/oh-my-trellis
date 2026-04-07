# OMT Skills Strategy

## Trellis Skills Kept As Core Workflow Skills

OMT does not replace Trellis workflow skills that are already project-native.

These remain core reference skills in this repo:

- `start`
- `check`
- `record-session`
- `finish-work`
- `update-spec`

## Imported Portable OMO Skills

OMT adds non-conflicting OpenCode-facing portable skills under `.opencode/skills/`.

Imported skills:

- `git-master`
- `playwright`
- `playwright-cli`
- `agent-browser`
- `dev-browser`
- `frontend-ui-ux`
- `review-work`
- `ai-slop-remover`

## Browser Skill Policy

- All browser-related skills are available on demand
- `playwright` is the documented default recommendation
- `dev-browser` remains useful for persistent authenticated sessions
- `playwright-cli` and `agent-browser` remain available for alternate runtime preferences

## Deduplication Rule

OMT imports portable skills into the OpenCode surface without duplicating Trellis-specific workflow skills.

- Trellis workflow skills stay where they already belong
- OMO portable skills are added where they expand capability without replacing Trellis semantics
