---
name: git-master
description: Expert git workflow guidance for commits, rebases, history search, and safe repository operations.
---

# Git Master

Use this skill for git-heavy work:

- atomic commits
- safe rebases
- autosquash / history cleanup
- blame / pickaxe / bisect style history search

Default rules:

1. split unrelated changes into separate commits
2. keep commit messages concise and repository-consistent
3. prefer `--force-with-lease` over `--force`
4. avoid rewriting shared history unless explicitly intended
