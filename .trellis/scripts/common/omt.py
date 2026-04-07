#!/usr/bin/env python3
"""
OMT compatibility helpers for Trellis task metadata.

Provides:
    ensure_meta_dict      - Ensure task data has a mutable meta dict
    get_workflow_id       - Read additive OMT workflow identifier
    get_workflow_mode     - Read additive OMT workflow mode
    is_omt_managed        - Check whether task is managed by OMT v1
    set_omt_workflow      - Mark task as OMT-managed using additive metadata
    clear_omt_workflow    - Remove additive OMT workflow markers
"""

from __future__ import annotations

OMT_WORKFLOW_ID = "omt/v1"
OMT_WORKFLOW_MODES = {"strict", "fast"}


def ensure_meta_dict(task_data: dict) -> dict:
    meta = task_data.get("meta")
    if not isinstance(meta, dict):
        meta = {}
        task_data["meta"] = meta
    return meta


def get_workflow_id(task_data: dict) -> str | None:
    meta = task_data.get("meta")
    if not isinstance(meta, dict):
        return None
    value = meta.get("workflow_id")
    return value if isinstance(value, str) else None


def get_workflow_mode(task_data: dict) -> str | None:
    meta = task_data.get("meta")
    if not isinstance(meta, dict):
        return None
    value = meta.get("workflow_mode")
    return value if isinstance(value, str) else None


def is_omt_managed(task_data: dict) -> bool:
    return get_workflow_id(task_data) == OMT_WORKFLOW_ID


def set_omt_workflow(task_data: dict, mode: str, workflow_id: str = OMT_WORKFLOW_ID) -> None:
    if mode not in OMT_WORKFLOW_MODES:
        allowed = ", ".join(sorted(OMT_WORKFLOW_MODES))
        raise ValueError(f"invalid OMT workflow mode: {mode} (expected one of: {allowed})")
    if not workflow_id:
        raise ValueError("workflow_id must be a non-empty string")

    meta = ensure_meta_dict(task_data)
    meta["workflow_id"] = workflow_id
    meta["workflow_mode"] = mode


def clear_omt_workflow(task_data: dict) -> None:
    meta = ensure_meta_dict(task_data)
    meta.pop("workflow_id", None)
    meta.pop("workflow_mode", None)
