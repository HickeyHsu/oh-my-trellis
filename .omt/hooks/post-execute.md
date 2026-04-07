# OMT Post-Execute Hook

Purpose:

- provide writeback reminders after execution or verification
- surface next expected artifact in the strict pipeline

Rules:

- do not write task state directly
- rely on explicit command flows for durable artifact updates
