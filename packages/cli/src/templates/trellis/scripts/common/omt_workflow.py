#!/usr/bin/env python3
from __future__ import annotations

import re
from pathlib import Path

from .io import read_json, write_json
from .omt import get_workflow_mode, set_omt_workflow

STRICT_ARTIFACTS = ("plan.md", "review.md", "execute.md", "verify.md", "close.md")
FAST_ARTIFACTS = ("close.md",)
FAST_CLOSE_HEADINGS = ("Intent", "Scope", "Changes", "Verification", "Outcome")
REVIEW_MODES = ("default", "metis", "momus")
APPROVED_VERDICTS = {"approved", "pass", "passed"}


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


def _read_text(path: Path) -> str:
    try:
        return path.read_text(encoding="utf-8")
    except (OSError, IOError):
        return ""


def _write_text(path: Path, content: str) -> None:
    path.write_text(content, encoding="utf-8")


def _ensure_omt_task(task_dir: Path, mode: str | None = None) -> dict:
    task_data = read_json(task_dir / "task.json")
    if not task_data:
        raise ValueError("task.json is missing or invalid")

    workflow_mode = detect_task_mode(task_data)
    if workflow_mode is None:
        raise ValueError("task is not managed by OMT")
    if mode is not None and workflow_mode != mode:
        raise ValueError(f"task is in {workflow_mode} mode, expected {mode}")
    return task_data


def _next_round_number(path: Path) -> int:
    content = _read_text(path)
    if not content.strip():
        return 1

    matches = [int(match) for match in re.findall(r"^## Round (\d+)$", content, flags=re.MULTILINE)]
    if not matches:
        return 1
    return max(matches) + 1


def _append_round(path: Path, heading: str, sections: list[tuple[str, list[str] | str]]) -> int:
    round_number = _next_round_number(path)
    content = _read_text(path)
    parts: list[str] = []

    if not content.strip():
        content = f"# {heading}\n\n"

    if not content.endswith("\n"):
        content = f"{content}\n"

    parts.append(content.rstrip())
    parts.append("")
    parts.append(f"## Round {round_number}")
    parts.append("")

    for section_title, section_body in sections:
        parts.append(f"### {section_title}")
        parts.append("")

        if isinstance(section_body, str):
            parts.append(section_body or "TBD")
        else:
            body_lines = list(section_body)
            if body_lines:
                parts.extend(body_lines)
            else:
                parts.append("- None")
        parts.append("")

    _write_text(path, "\n".join(parts).rstrip() + "\n")
    return round_number


def _bullet_lines(items: list[str], checkbox: bool = False) -> list[str]:
    if not items:
        return []
    prefix = "- [ ] " if checkbox else "- "
    return [f"{prefix}{item}" for item in items]


def write_plan_round(
    task_dir: Path,
    goal_summary: str,
    steps: list[str],
    risks: list[str],
    verification: list[str],
) -> int:
    _ensure_omt_task(task_dir, "strict")
    plan_path = task_dir / "plan.md"
    return _append_round(
        plan_path,
        "Plan",
        [
            ("Goal Summary", goal_summary or "TBD"),
            ("Implementation Steps", _bullet_lines(steps)),
            ("Risks", _bullet_lines(risks)),
            ("Verification Checklist", _bullet_lines(verification, checkbox=True)),
        ],
    )


def write_review_round(
    task_dir: Path,
    mode: str,
    verdict: str,
    required_changes: list[str],
    optional_improvements: list[str],
    confidence: str,
) -> int:
    _ensure_omt_task(task_dir, "strict")
    normalized_mode = mode.strip().lower()
    if normalized_mode not in REVIEW_MODES:
        allowed = ", ".join(REVIEW_MODES)
        raise ValueError(f"invalid review mode: {mode} (expected one of: {allowed})")

    review_path = task_dir / "review.md"
    normalized_verdict = verdict.strip().lower()
    return _append_round(
        review_path,
        "Review",
        [
            ("Mode", normalized_mode),
            ("Verdict", normalized_verdict or "required_changes"),
            ("Required Changes", _bullet_lines(required_changes)),
            ("Optional Improvements", _bullet_lines(optional_improvements)),
            ("Confidence", confidence or "TBD"),
        ],
    )


def get_latest_review_verdict(task_dir: Path) -> str | None:
    review_path = task_dir / "review.md"
    content = _read_text(review_path)
    if not content.strip():
        return None

    matches = re.findall(
        r"^### Verdict\n\n([^\n]+)$",
        content,
        flags=re.MULTILINE,
    )
    if not matches:
        return None
    return matches[-1].strip().lower()


def is_review_approved(task_dir: Path) -> bool:
    verdict = get_latest_review_verdict(task_dir)
    return verdict in APPROVED_VERDICTS


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

    if key == "strict:execute" and not is_review_approved(task_dir):
        return False, "review.md is present but not approved"

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
