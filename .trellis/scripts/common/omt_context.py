#!/usr/bin/env python3
from __future__ import annotations

import json
from pathlib import Path

from .config import get_spec_scope
from .packages_context import get_context_packages_json, get_context_packages_text
from .paths import get_active_journal_file, get_current_task, get_repo_root
from .session_context import get_context_json
from .tasks import load_task

_ENTRY_LIMIT = 20
_RECENT_SESSION_LIMIT = 3


def _read_text(path: Path) -> str:
    try:
        return path.read_text(encoding="utf-8")
    except (OSError, IOError):
        return ""


def _read_project_file(repo_root: Path, relative_path: str) -> str:
    return _read_text(repo_root / relative_path)


def _split_sections(markdown: str) -> dict[str, list[str]]:
    sections: dict[str, list[str]] = {}
    current: str | None = None

    for raw_line in markdown.splitlines():
        line = raw_line.rstrip()
        if line.startswith("## "):
            current = line[3:].strip().lower()
            sections[current] = []
            continue
        if current is not None:
            sections[current].append(line)

    return sections


def _extract_bullets(lines: list[str]) -> list[str]:
    bullets: list[str] = []
    for line in lines:
        stripped = line.strip()
        if stripped.startswith("- [ ] "):
            bullets.append(stripped[6:].strip())
        elif stripped.startswith("- "):
            bullets.append(stripped[2:].strip())
    return [bullet for bullet in bullets if bullet]


def _extract_goal(lines: list[str]) -> str:
    for line in lines:
        stripped = line.strip()
        if stripped:
            return stripped
    return ""


def _parse_prd(prd_content: str) -> dict:
    sections = _split_sections(prd_content)
    goal_lines = sections.get("goal") or sections.get("overview") or []
    requirements_lines = sections.get("requirements") or []
    acceptance_lines = sections.get("acceptance criteria") or []
    return {
        "goal": _extract_goal(goal_lines),
        "constraints": _extract_bullets(requirements_lines),
        "acceptance_criteria": _extract_bullets(acceptance_lines),
    }


def _read_directory_md_files(directory: Path, relative_dir: str) -> list[dict]:
    if not directory.is_dir():
        return []

    entries: list[dict] = []
    for md_file in sorted(directory.glob("*.md"))[:_ENTRY_LIMIT]:
        content = _read_text(md_file)
        if content:
            entries.append({
                "path": f"{relative_dir.rstrip('/')}/{md_file.name}",
                "content": content,
            })
    return entries


def _read_jsonl_entries(repo_root: Path, task_dir: Path, filenames: list[str]) -> list[dict]:
    for filename in filenames:
        jsonl_path = task_dir / filename
        content = _read_text(jsonl_path)
        if not content:
            continue

        entries: list[dict] = []
        for raw_line in content.splitlines():
            stripped = raw_line.strip()
            if not stripped:
                continue
            try:
                item = json.loads(stripped)
            except json.JSONDecodeError:
                continue

            file_path = item.get("file") or item.get("path")
            if not isinstance(file_path, str) or not file_path:
                continue

            full_path = repo_root / file_path
            if item.get("type") == "directory" or file_path.endswith("/"):
                entries.extend(_read_directory_md_files(full_path, file_path))
                continue

            file_content = _read_text(full_path)
            if file_content:
                entries.append({"path": file_path, "content": file_content})

        if entries:
            return entries[:_ENTRY_LIMIT]

    return []


def _extract_recent_sessions(repo_root: Path) -> list[dict]:
    journal_file = get_active_journal_file(repo_root)
    if journal_file is None:
        return []

    sessions: list[dict] = []
    current: dict | None = None
    in_summary = False

    for raw_line in _read_text(journal_file).splitlines():
        line = raw_line.rstrip()
        if line.startswith("## Session "):
            if current is not None:
                sessions.append(current)
            current = {"title": line.replace("## Session ", "", 1), "summary": []}
            in_summary = False
            continue
        if current is None:
            continue
        if line.startswith("**Date**:"):
            current["date"] = line.replace("**Date**:", "", 1).strip()
            continue
        if line.startswith("### Summary"):
            in_summary = True
            continue
        if line.startswith("### ") and not line.startswith("### Summary"):
            in_summary = False
            continue
        if in_summary:
            stripped = line.strip()
            if stripped:
                current["summary"].append(stripped)

    if current is not None:
        sessions.append(current)

    result: list[dict] = []
    for session in sessions[-_RECENT_SESSION_LIMIT:]:
        result.append({
            "title": session.get("title", ""),
            "date": session.get("date", ""),
            "summary": " ".join(session.get("summary", []))[:300],
        })
    return result


def _artifact_paths(task_path: str) -> dict[str, str]:
    return {
        "plan": f"{task_path}/plan.md",
        "review": f"{task_path}/review.md",
        "execute": f"{task_path}/execute.md",
        "verify": f"{task_path}/verify.md",
        "close": f"{task_path}/close.md",
    }


def _collect_task_bundle(repo_root: Path) -> dict:
    current_task = get_current_task(repo_root)
    if not current_task:
        return {}

    task_dir = repo_root / current_task
    task_info = load_task(task_dir)
    if task_info is None:
        return {}

    task_json = task_info.raw
    prd_content = _read_text(task_dir / "prd.md")
    parsed_prd = _parse_prd(prd_content)
    next_actions = task_json.get("next_action", [])
    meta = task_json.get("meta", {}) if isinstance(task_json.get("meta"), dict) else {}

    return {
        "path": current_task,
        "dir_name": task_info.dir_name,
        "title": task_info.title,
        "status": task_info.status,
        "description": task_info.description,
        "dev_type": task_json.get("dev_type"),
        "package": task_info.package,
        "current_phase": task_json.get("current_phase", 0),
        "next_action": next_actions if isinstance(next_actions, list) else [],
        "workflow_id": meta.get("workflow_id"),
        "workflow_mode": meta.get("workflow_mode"),
        "goal": parsed_prd["goal"],
        "constraints": parsed_prd["constraints"],
        "acceptance_criteria": parsed_prd["acceptance_criteria"],
        "prd_path": f"{current_task}/prd.md",
        "artifacts": _artifact_paths(current_task),
    }


def get_omt_session_json(repo_root: Path | None = None) -> dict:
    root = repo_root or get_repo_root()
    task = _collect_task_bundle(root)

    return {
        "mode": "omt-session",
        "session": get_context_json(root),
        "task": task,
        "workflow": {
            "path": ".trellis/workflow.md",
            "content": _read_project_file(root, ".trellis/workflow.md"),
        },
        "packages": get_context_packages_json(root),
        "guides": {
            "path": ".trellis/spec/guides/index.md",
            "content": _read_project_file(root, ".trellis/spec/guides/index.md"),
        },
        "omt_start": {
            "path": ".omt/commands/omt-start.md",
            "content": _read_project_file(root, ".omt/commands/omt-start.md"),
        },
        "recent_sessions": _extract_recent_sessions(root),
    }


def get_omt_agent_json(
    agent: str,
    repo_root: Path | None = None,
    finish: bool = False,
) -> dict:
    root = repo_root or get_repo_root()
    task = _collect_task_bundle(root)
    task_path = task.get("path")
    if not task_path:
        return {
            "mode": "omt-agent",
            "agent": agent,
            "task": {},
            "context_entries": [],
            "packages": get_context_packages_json(root),
        }

    task_dir = root / task_path
    file_map = {
        "implement": ["implement.jsonl", "spec.jsonl"],
        "check": ["check.jsonl", "spec.jsonl"],
        "debug": ["debug.jsonl", "spec.jsonl"],
        "research": ["research.jsonl"],
        "planner": ["implement.jsonl", "spec.jsonl"],
        "reviewer": ["check.jsonl", "spec.jsonl"],
        "executor": ["implement.jsonl", "spec.jsonl"],
        "oracle": ["research.jsonl", "spec.jsonl"],
    }

    entries = _read_jsonl_entries(root, task_dir, file_map.get(agent, ["spec.jsonl"]))
    if finish:
        finish_content = _read_project_file(root, ".opencode/commands/trellis/finish-work.md")
        if finish_content:
            entries.append({
                "path": ".opencode/commands/trellis/finish-work.md",
                "content": finish_content,
            })

    extra_files: list[dict] = []
    for relative_path in [
        task.get("prd_path"),
        task.get("artifacts", {}).get("plan"),
        task.get("artifacts", {}).get("review"),
        task.get("artifacts", {}).get("execute"),
        task.get("artifacts", {}).get("verify"),
        task.get("artifacts", {}).get("close"),
    ]:
        if not isinstance(relative_path, str):
            continue
        content = _read_project_file(root, relative_path)
        if content:
            extra_files.append({"path": relative_path, "content": content})

    return {
        "mode": "omt-agent",
        "agent": agent,
        "finish": finish,
        "task": task,
        "packages": get_context_packages_json(root),
        "spec_scope": get_spec_scope(root),
        "context_entries": entries,
        "extra_files": extra_files,
        "recent_sessions": _extract_recent_sessions(root),
    }


def _entries_to_text(entries: list[dict]) -> str:
    parts: list[str] = []
    for entry in entries:
        path = entry.get("path", "")
        content = entry.get("content", "")
        if path and content:
            parts.append(f"=== {path} ===\n{content}")
    return "\n\n".join(parts)


def get_omt_session_text(repo_root: Path | None = None) -> str:
    data = get_omt_session_json(repo_root)
    parts = [
        "<omt-session-context>",
        "## Session State",
        json.dumps(data.get("session", {}), indent=2, ensure_ascii=False),
    ]

    task = data.get("task") or {}
    if task:
        parts.extend([
            "## Active Task",
            json.dumps(task, indent=2, ensure_ascii=False),
        ])

    workflow = data.get("workflow", {})
    if workflow.get("content"):
        parts.extend(["## Workflow", workflow["content"]])

    packages = get_context_packages_text(repo_root or get_repo_root())
    if packages:
        parts.extend(["## Packages", packages])

    guides = data.get("guides", {})
    if guides.get("content"):
        parts.extend(["## Guides", guides["content"]])

    omt_start = data.get("omt_start", {})
    if omt_start.get("content"):
        parts.extend(["## OMT Start", omt_start["content"]])

    recent_sessions = data.get("recent_sessions") or []
    if recent_sessions:
        parts.append("## Recent Sessions")
        for session in recent_sessions:
            parts.append(json.dumps(session, ensure_ascii=False))

    parts.append("</omt-session-context>")
    return "\n\n".join(parts)


def get_omt_agent_text(
    agent: str,
    repo_root: Path | None = None,
    finish: bool = False,
) -> str:
    data = get_omt_agent_json(agent, repo_root, finish)
    parts = [
        f"# OMT {agent.title()} Context",
        "## Context Bundle",
        json.dumps({
            "agent": data.get("agent"),
            "finish": data.get("finish"),
            "task": data.get("task"),
            "recent_sessions": data.get("recent_sessions"),
            "spec_scope": data.get("spec_scope"),
        }, indent=2, ensure_ascii=False),
    ]

    entry_text = _entries_to_text(data.get("context_entries") or [])
    if entry_text:
        parts.extend(["## Referenced Context", entry_text])

    extra_text = _entries_to_text(data.get("extra_files") or [])
    if extra_text:
        parts.extend(["## Task Artifacts", extra_text])

    return "\n\n".join(parts)
