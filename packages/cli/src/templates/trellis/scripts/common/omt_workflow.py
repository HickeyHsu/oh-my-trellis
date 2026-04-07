#!/usr/bin/env python3
from __future__ import annotations

from pathlib import Path

from .io import read_json, write_json
from .omt import get_workflow_mode, set_omt_workflow

STRICT_ARTIFACTS = ("plan.md", "review.md", "execute.md", "verify.md", "close.md")
FAST_ARTIFACTS = ("close.md",)
FAST_CLOSE_HEADINGS = ("Intent", "Scope", "Changes", "Verification", "Outcome")


def detect_task_mode(task_data: dict) -> str | None:
    mode = get_workflow_mode(task_data)
    if mode in ("strict", "fast"):
        return mode
    return None


def _ensure_text_file(path: Path, content: str) -> bool:
    if path.is_file():
        return False
    path.write_text(content, encoding="utf-8")
    return True


def _strict_artifact_content(task_dir: Path, filename: str) -> str:
    stem = filename.removesuffix(".md").replace("-", " ").title()
    return f"# {stem}\n\nTask: `{task_dir.name}`\n\n## Round 1\n\n- Status: pending\n"


def _fast_close_content(task_dir: Path) -> str:
    lines = [f"# Close\n\nTask: `{task_dir.name}`\n"]
    for heading in FAST_CLOSE_HEADINGS:
        lines.append(f"## {heading}\n\nTBD\n")
    return "\n".join(lines)


def scaffold_strict_artifacts(task_dir: Path) -> list[str]:
    created: list[str] = []
    for filename in STRICT_ARTIFACTS:
        if _ensure_text_file(task_dir / filename, _strict_artifact_content(task_dir, filename)):
            created.append(filename)
    return created


def scaffold_fast_artifacts(task_dir: Path) -> list[str]:
    created: list[str] = []
    close_file = task_dir / "close.md"
    if _ensure_text_file(close_file, _fast_close_content(task_dir)):
        created.append("close.md")
    return created


def validate_transition(task_dir: Path, target_action: str) -> tuple[bool, str]:
    task_json = task_dir / "task.json"
    task_data = read_json(task_json)
    if not task_data:
        return False, "task.json is missing or invalid"

    mode = detect_task_mode(task_data)
    if mode is None:
        return False, "task is not managed by OMT"

    required: dict[str, tuple[str, ...]] = {
        "strict:plan": (),
        "strict:review": ("plan.md",),
        "strict:execute": ("plan.md", "review.md"),
        "strict:verify": ("execute.md",),
        "strict:close": ("verify.md",),
        "fast:execute": (),
        "fast:close": ("close.md",),
    }
    key = f"{mode}:{target_action}"
    if key not in required:
        return False, f"unknown transition target: {target_action}"

    missing = [name for name in required[key] if not (task_dir / name).is_file()]
    if missing:
        return False, f"missing required artifacts: {', '.join(missing)}"
    return True, "ok"


def adopt_legacy_task(task_dir: Path, mode: str) -> list[str]:
    task_json = task_dir / "task.json"
    task_data = read_json(task_json)
    if not task_data:
        raise ValueError("task.json is missing or invalid")

    set_omt_workflow(task_data, mode)
    if not write_json(task_json, task_data):
        raise ValueError("failed to write task.json")

    if mode == "strict":
        return scaffold_strict_artifacts(task_dir)
    return scaffold_fast_artifacts(task_dir)
