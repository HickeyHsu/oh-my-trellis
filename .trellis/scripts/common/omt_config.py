#!/usr/bin/env python3
from __future__ import annotations

import json
import re
from pathlib import Path

from .paths import get_repo_root

OMT_DEFAULTS_FILE = "oh-my-trellis.defaults.jsonc"
OMT_ROOT_CONFIG_BASENAME = "oh-my-trellis"
OMT_ROOT_CONFIG_FILES = ("oh-my-trellis.jsonc", "oh-my-trellis.json")


def _strip_jsonc_comments(content: str) -> str:
    content = re.sub(r"/\*.*?\*/", "", content, flags=re.DOTALL)
    content = re.sub(r"(^|\s)//.*$", "", content, flags=re.MULTILINE)
    return content


def _deep_merge(base: dict, override: dict) -> dict:
    merged: dict = dict(base)
    for key, value in override.items():
        current = merged.get(key)
        if isinstance(current, dict) and isinstance(value, dict):
            merged[key] = _deep_merge(current, value)
        else:
            merged[key] = value
    return merged


def get_omt_defaults_path(repo_root: Path | None = None) -> Path:
    root = repo_root or get_repo_root()
    return root / ".omt" / "config" / OMT_DEFAULTS_FILE


def get_omt_project_config_path(repo_root: Path | None = None) -> Path | None:
    root = repo_root or get_repo_root()
    for filename in OMT_ROOT_CONFIG_FILES:
        candidate = root / filename
        if candidate.is_file():
            return candidate
    return None


def load_jsonc_file(path: Path) -> dict:
    try:
        content = path.read_text(encoding="utf-8")
    except (OSError, IOError):
        return {}

    stripped = _strip_jsonc_comments(content)
    if not stripped.strip():
        return {}

    try:
        data = json.loads(stripped)
    except json.JSONDecodeError:
        return {}
    return data if isinstance(data, dict) else {}


def resolve_omt_config(repo_root: Path | None = None) -> dict:
    root = repo_root or get_repo_root()
    defaults = load_jsonc_file(get_omt_defaults_path(root))
    project_path = get_omt_project_config_path(root)
    if project_path is None:
        return defaults
    project = load_jsonc_file(project_path)
    return _deep_merge(defaults, project)
