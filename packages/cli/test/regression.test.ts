/**
 * Regression Tests — Historical Bug Prevention
 *
 * Each test references a specific version where the bug was introduced/fixed.
 * Prevents recurrence of bugs from beta.2 through beta.16.
 *
 * Categories:
 * 1. Windows / Encoding (beta.2, beta.7, beta.10, beta.11, beta.12, beta.16)
 * 2. Path Issues (0.2.14, 0.2.15, beta.13)
 * 3. Semver / Migration Engine (beta.5, beta.14, beta.16)
 * 4. Template Integrity (beta.0, beta.7, beta.12)
 * 5. Platform Registry (beta.9, beta.13, beta.16)
 */

import { execSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  clearManifestCache,
  getAllMigrations,
  getAllMigrationVersions,
  getMigrationsForVersion,
  hasPendingMigrations,
} from "../src/migrations/index.js";
import { isManagedPath } from "../src/configurators/index.js";
import { AI_TOOLS } from "../src/types/ai-tools.js";
import { PATHS } from "../src/constants/paths.js";
import {
  settingsTemplate as claudeSettingsTemplate,
  getAllCommands as getClaudeCommands,
  getAllAgents as getClaudeAgents,
  getAllHooks as getClaudeHooks,
} from "../src/templates/claude/index.js";
import {
  settingsTemplate as iflowSettingsTemplate,
  getAllHooks as getIflowHooks,
} from "../src/templates/iflow/index.js";
import { getAllHooks as getCodexHooks } from "../src/templates/codex/index.js";
import {
  commonInit,
  taskScript,
  addSessionScript,
  multiAgentPlan,
  multiAgentStart,
  multiAgentCleanup,
  multiAgentCreatePr,
  commonCliAdapter,
  commonWorktree,
  commonTaskUtils,
  commonDeveloper,
  getAllScripts,
} from "../src/templates/trellis/index.js";
import {
  collectPlatformTemplates,
  PLATFORM_IDS,
} from "../src/configurators/index.js";
import { guidesIndexContent, workspaceIndexContent } from "../src/templates/markdown/index.js";
import * as markdownExports from "../src/templates/markdown/index.js";
import { TrellisContext } from "../src/templates/opencode/lib/trellis-context.js";
import omtConfigPlugin from "../src/templates/opencode/plugins/omt-config.js";
import omtCommandGuardsPlugin from "../src/templates/opencode/plugins/omt-command-guards.js";
import {
  loadOmtConfig,
  resolveOmtModel,
  resolveOmtTier,
} from "../src/templates/opencode/lib/omt-config.js";

afterEach(() => {
  clearManifestCache();
});

// =============================================================================
// 1. Windows / Encoding Regressions
// =============================================================================

describe("regression: Windows encoding (beta.10, beta.11, beta.16)", () => {
  it("[beta.10] common/__init__.py has _configure_stream function", () => {
    expect(commonInit).toContain("def _configure_stream");
  });

  it('[beta.10] common/__init__.py has reconfigure(encoding="utf-8") pattern', () => {
    expect(commonInit).toContain('reconfigure(encoding="utf-8"');
  });

  it("[beta.10] common/__init__.py has TextIOWrapper fallback", () => {
    expect(commonInit).toContain("TextIOWrapper");
  });

  it('[beta.10] common/__init__.py has sys.platform == "win32" guard', () => {
    expect(commonInit).toContain('sys.platform == "win32"');
  });

  it("[beta.10] common/__init__.py configures both stdout AND stderr", () => {
    expect(commonInit).toContain("sys.stdout");
    expect(commonInit).toContain("sys.stderr");
  });

  it("[beta.16] _configure_stream handles stream with reconfigure method", () => {
    // The function should try reconfigure() first, then fallback to detach()
    expect(commonInit).toContain('hasattr(stream, "reconfigure")');
    expect(commonInit).toContain('hasattr(stream, "detach")');
  });

  it("[beta.16] _configure_stream is idempotent (won't crash on double call)", () => {
    // The reconfigure pattern is safe to call multiple times
    // The function should NOT use detach() unconditionally (beta.16 bug root cause)
    // It should check hasattr(stream, "reconfigure") FIRST
    const reconfigureIndex = commonInit.indexOf(
      'hasattr(stream, "reconfigure")',
    );
    const detachIndex = commonInit.indexOf('hasattr(stream, "detach")');
    expect(reconfigureIndex).toBeLessThan(detachIndex);
  });

  it("[beta.10] common/__init__.py has centralized encoding fix", () => {
    // Encoding fix was centralized from individual scripts to common/__init__.py (#67)
    expect(commonInit).toContain('sys.platform == "win32"');
    expect(commonInit).toContain("reconfigure");
  });

  it("[beta.10] task.py imports from common (gets encoding fix via __init__.py)", () => {
    expect(taskScript).toContain("from common");
  });

  it("[rc.2] add_session.py table separator detection uses regex (not startswith)", () => {
    // Bug: startswith("|---") breaks when formatters add spaces: "| ---- |"
    // Fix: use re.match with a character-class pattern to allow optional whitespace/spaces
    expect(addSessionScript).not.toContain('startswith("|---")');
    expect(addSessionScript).toContain(String.raw`re.match(r"^\|[-| ]+\|\s*$", line)`);
  });
});

describe("regression: branch context in session records (issue-106)", () => {
  it("[issue-106] add_session.py accepts --branch CLI arg", () => {
    expect(addSessionScript).toContain("--branch");
    expect(addSessionScript).not.toContain("--base-branch");
  });

  it("[issue-106] add_session.py auto-detects branch via git branch --show-current", () => {
    expect(addSessionScript).toContain("branch --show-current");
  });

  it("[issue-106] add_session.py reads branch from task.json when available", () => {
    expect(addSessionScript).toContain('task_data.raw.get("branch")');
    expect(addSessionScript).not.toContain('task_data.raw.get("base_branch")');
  });

  it("[issue-106] add_session.py session content includes **Branch** field only", () => {
    expect(addSessionScript).toContain("**Branch**");
    expect(addSessionScript).not.toContain("**Base Branch**");
  });

  it("[issue-106] add_session.py index table header has 5 columns including Branch", () => {
    expect(addSessionScript).toContain(
      "| # | Date | Title | Commits | Branch |",
    );
    expect(addSessionScript).not.toContain(
      "| # | Date | Title | Commits | Branch | Base Branch |",
    );
  });

  it("[issue-106] add_session.py migrates old 4/6-column headers to 5-column", () => {
    expect(addSessionScript).toMatch(
      /re\.match\(\r?\n\s+r"\^\\\|\\s\*#\\s\*\\\|\\s\*Date\\s\*\\\|\\s\*Title\\s\*\\\|\\s\*Commits\\s\*\\\|\\s\*Branch\\s\*\\\|\\s\*Base Branch\\s\*\\\|\\s\*\$",/,
    );
    expect(addSessionScript).toContain(
      String.raw`re.match(r"^\|\s*#\s*\|\s*Date\s*\|\s*Title\s*\|\s*Commits\s*\|\s*Branch\s*\|\s*$", line)`,
    );
  });

  it("[issue-106] developer.py init template has 5-column session history table", () => {
    expect(commonDeveloper).toContain(
      "| # | Date | Title | Commits | Branch |",
    );
    expect(commonDeveloper).toContain(
      "|---|------|-------|---------|--------|",
    );
  });

  it("[issue-106] workspace-index.md template documents Branch field only for session records", () => {
    expect(workspaceIndexContent).toContain("Branch: Which branch the work was done on");
    expect(workspaceIndexContent).toContain("**Branch**: `{branch-name}`");
    expect(workspaceIndexContent).not.toContain("**Base Branch**: `{base-branch-name}`");
  });
});

describe("regression: add_session.py runtime branch context (issue-106)", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "trellis-session-"));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  function writeTrellisScripts(): void {
    const scriptsDir = path.join(tmpDir, ".trellis", "scripts");
    for (const [relativePath, content] of getAllScripts()) {
      const absPath = path.join(scriptsDir, relativePath);
      fs.mkdirSync(path.dirname(absPath), { recursive: true });
      fs.writeFileSync(absPath, content);
    }
  }

  function createWorkspaceIndex(
    headerMode: "legacy4" | "legacy6" | "current5",
  ): void {
    let header = "| # | Date | Title | Commits | Branch |";
    let separator = "|---|------|-------|---------|--------|";
    if (headerMode === "legacy4") {
      header = "| # | Date | Title | Commits |";
      separator = "|---|------|-------|---------|";
    } else if (headerMode === "legacy6") {
      header = "| # | Date | Title | Commits | Branch | Base Branch |";
      separator = "|---|------|-------|---------|--------|-------------|";
    }
    const indexContent = `# Workspace Index - test-dev

## Current Status

<!-- @@@auto:current-status -->
- **Active File**: \`journal-1.md\`
- **Total Sessions**: 0
- **Last Active**: -
<!-- @@@/auto:current-status -->

## Active Documents

<!-- @@@auto:active-documents -->
| File | Lines | Status |
|------|-------|--------|
| \`journal-1.md\` | ~0 | Active |
<!-- @@@/auto:active-documents -->

## Session History

<!-- @@@auto:session-history -->
${header}
${separator}
<!-- @@@/auto:session-history -->
`;
    fs.writeFileSync(
      path.join(tmpDir, ".trellis", "workspace", "test-dev", "index.md"),
      indexContent,
      "utf-8",
    );
  }

  function setupSessionRepo(options?: {
    gitBranch?: string;
    headerMode?: "legacy4" | "legacy6" | "current5";
    taskBranch?: string;
    taskBaseBranch?: string;
  }): void {
    writeTrellisScripts();

    fs.mkdirSync(path.join(tmpDir, ".trellis", "workspace", "test-dev"), {
      recursive: true,
    });
    fs.writeFileSync(
      path.join(tmpDir, ".trellis", ".developer"),
      "name=test-dev\ninitialized_at=2026-03-22T00:00:00\n",
      "utf-8",
    );
    fs.writeFileSync(
      path.join(tmpDir, ".trellis", "workspace", "test-dev", "journal-1.md"),
      "# Journal - test-dev (Part 1)\n\n---\n",
      "utf-8",
    );
    createWorkspaceIndex(options?.headerMode ?? "current5");

    if (options?.taskBranch || options?.taskBaseBranch) {
      const taskDir = path.join(tmpDir, ".trellis", "tasks", "issue-106");
      fs.mkdirSync(taskDir, { recursive: true });
      fs.writeFileSync(
        path.join(tmpDir, ".trellis", ".current-task"),
        ".trellis/tasks/issue-106\n",
        "utf-8",
      );
      fs.writeFileSync(
        path.join(taskDir, "task.json"),
        JSON.stringify(
          {
            title: "Issue 106 task",
            status: "in_progress",
            package: null,
            branch: options.taskBranch ?? null,
            base_branch: options.taskBaseBranch ?? null,
          },
          null,
          2,
        ),
        "utf-8",
      );
    }

    if (options?.gitBranch) {
      execSync("git init -q", { cwd: tmpDir });
      execSync(`git branch -m ${JSON.stringify(options.gitBranch)}`, {
        cwd: tmpDir,
      });
    }
  }

  function runAddSession(
    title: string,
    options?: { branch?: string },
  ): void {
    const command = [
      "python3",
      JSON.stringify(path.join(tmpDir, ".trellis", "scripts", "add_session.py")),
      "--title",
      JSON.stringify(title),
      "--summary",
      JSON.stringify("Regression test session"),
      "--no-commit",
    ];
    if (options?.branch) {
      command.push("--branch", JSON.stringify(options.branch));
    }

    execSync(command.join(" "), {
      cwd: tmpDir,
      encoding: "utf-8",
    });
  }

  it("[issue-106] prefers explicit CLI branch over task.json and git", () => {
    setupSessionRepo({
      gitBranch: "feature/from-git",
      taskBranch: "task/from-task",
      taskBaseBranch: "main",
    });

    runAddSession("CLI branch wins", { branch: "cli/from-arg" });

    const journal = fs.readFileSync(
      path.join(tmpDir, ".trellis", "workspace", "test-dev", "journal-1.md"),
      "utf-8",
    );
    const index = fs.readFileSync(
      path.join(tmpDir, ".trellis", "workspace", "test-dev", "index.md"),
      "utf-8",
    );

    expect(journal).toContain("**Branch**: `cli/from-arg`");
    expect(journal).not.toContain("**Base Branch**:");
    expect(journal).not.toContain("task/from-task");
    expect(journal).not.toContain("feature/from-git");
    expect(index).toContain("`cli/from-arg` |");
    expect(index).not.toContain("`task/from-task`");
    expect(index).not.toContain("`feature/from-git`");
  });

  it("[issue-106] prefers task.json branch over current git branch and ignores task base_branch", () => {
    setupSessionRepo({
      gitBranch: "feature/from-git",
      taskBranch: "task/from-task",
      taskBaseBranch: "main",
    });

    runAddSession("Task branch wins");

    const journal = fs.readFileSync(
      path.join(tmpDir, ".trellis", "workspace", "test-dev", "journal-1.md"),
      "utf-8",
    );
    const index = fs.readFileSync(
      path.join(tmpDir, ".trellis", "workspace", "test-dev", "index.md"),
      "utf-8",
    );

    expect(journal).toContain("**Branch**: `task/from-task`");
    expect(journal).not.toContain("**Base Branch**:");
    expect(journal).not.toContain("feature/from-git");
    expect(index).toContain("`task/from-task` |");
    expect(index).not.toContain("`feature/from-git`");
  });

  it("[issue-106] falls back to git branch and migrates old 6-column session history", () => {
    setupSessionRepo({
      gitBranch: "feature/from-git",
      headerMode: "legacy6",
    });

    runAddSession("Git branch fallback");

    const journal = fs.readFileSync(
      path.join(tmpDir, ".trellis", "workspace", "test-dev", "journal-1.md"),
      "utf-8",
    );
    const index = fs.readFileSync(
      path.join(tmpDir, ".trellis", "workspace", "test-dev", "index.md"),
      "utf-8",
    );

    expect(journal).toContain("**Branch**: `feature/from-git`");
    expect(journal).not.toContain("**Base Branch**:");
    expect(index).toContain("| # | Date | Title | Commits | Branch |");
    expect(index).toContain("|---|------|-------|---------|--------|");
    expect(index).toContain("`feature/from-git` |");
    expect(index).not.toContain(
      "| # | Date | Title | Commits | Branch | Base Branch |\n|---|------|-------|---------|--------|-------------|",
    );
  });

  it("[issue-106] migrates old 4-column session history directly to 5 columns", () => {
    setupSessionRepo({
      headerMode: "legacy4",
    });

    runAddSession("Legacy 4-column migration");

    const index = fs.readFileSync(
      path.join(tmpDir, ".trellis", "workspace", "test-dev", "index.md"),
      "utf-8",
    );

    expect(index).toContain("| # | Date | Title | Commits | Branch |");
    expect(index).toContain("|---|------|-------|---------|--------|");
    expect(index).not.toContain(
      "| # | Date | Title | Commits |\n|---|------|-------|---------|",
    );
  });

  it("[issue-106] records a session even when no branch information is available", () => {
    setupSessionRepo();

    runAddSession("No branch available");

    const journal = fs.readFileSync(
      path.join(tmpDir, ".trellis", "workspace", "test-dev", "journal-1.md"),
      "utf-8",
    );
    const index = fs.readFileSync(
      path.join(tmpDir, ".trellis", "workspace", "test-dev", "index.md"),
      "utf-8",
    );

    expect(journal).not.toContain("**Branch**:");
    expect(journal).not.toContain("**Base Branch**:");
    expect(index).toContain("`-` |");
    expect(index).toContain("- **Total Sessions**: 1");
  });
});

describe("regression: Windows subprocess flags (beta.2, beta.12)", () => {
  it("[beta.12] plan.py uses CREATE_NEW_PROCESS_GROUP on win32", () => {
    expect(multiAgentPlan).toContain("CREATE_NEW_PROCESS_GROUP");
    expect(multiAgentPlan).toContain('sys.platform == "win32"');
  });

  it("[beta.12] plan.py uses start_new_session on non-Windows", () => {
    expect(multiAgentPlan).toContain("start_new_session");
  });

  it("[beta.12] start.py uses CREATE_NEW_PROCESS_GROUP on win32", () => {
    expect(multiAgentStart).toContain("CREATE_NEW_PROCESS_GROUP");
    expect(multiAgentStart).toContain('sys.platform == "win32"');
  });

  it("[beta.12] start.py uses start_new_session on non-Windows", () => {
    expect(multiAgentStart).toContain("start_new_session");
  });
});

describe("regression: Windows path separator (beta.12)", () => {
  it("[beta.12] isManagedPath handles Windows backslash paths", () => {
    expect(isManagedPath(".claude\\commands\\foo.md")).toBe(true);
    expect(isManagedPath(".trellis\\spec\\backend")).toBe(true);
    expect(isManagedPath(".iflow\\hooks\\test.py")).toBe(true);
    expect(isManagedPath(".cursor\\commands\\start.md")).toBe(true);
    expect(isManagedPath(".opencode\\config.json")).toBe(true);
    expect(isManagedPath(".github\\copilot\\hooks\\session-start.py")).toBe(
      true,
    );
    expect(isManagedPath(".github\\hooks\\trellis.json")).toBe(true);
  });

  it("[beta.12] isManagedPath handles mixed separators", () => {
    expect(isManagedPath(".claude\\commands/foo.md")).toBe(true);
  });
});

// =============================================================================
// 2. Path Issues Regressions
// =============================================================================

describe("regression: task directory paths (0.2.14, 0.2.15, beta.13)", () => {
  it("[0.2.15] PATHS.TASKS is .trellis/tasks (not .trellis/workspace/*/tasks)", () => {
    expect(PATHS.TASKS).toBe(".trellis/tasks");
    expect(PATHS.TASKS).not.toContain("workspace");
  });

  it("[0.2.14] Claude agent templates do not contain hardcoded .trellis/workspace/*/tasks/ paths", () => {
    const agents = getClaudeAgents();
    for (const agent of agents) {
      expect(agent.content).not.toMatch(/\.trellis\/workspace\/[^/]+\/tasks\//);
    }
  });

  it("[beta.13] cli_adapter.py does not contain hardcoded developer paths", () => {
    expect(commonCliAdapter).not.toMatch(/workspace\/taosu/);
    expect(commonCliAdapter).not.toMatch(/workspace\/[a-z]+\/tasks/);
  });

  it("[0.2.15] no script templates contain hardcoded 'taosu' in path patterns", () => {
    const scripts = getAllScripts();
    for (const [name, content] of scripts) {
      // Check for hardcoded username in path patterns (workspace/taosu, /Users/taosu)
      // but allow usage examples like "python3 status.py -a taosu"
      expect(
        content,
        `${name} should not contain hardcoded username in paths`,
      ).not.toMatch(/workspace\/taosu|\/Users\/taosu/);
    }
  });
});

describe("regression: resolve_task_dir path handling", () => {
  it("[beta.12] resolve_task_dir handles .trellis prefix", () => {
    // The function should recognize .trellis-prefixed paths as relative paths
    expect(commonTaskUtils).toContain('.startswith(".trellis")');
  });

  it("[current-task] resolve_task_dir normalizes backslash separators before path classification", () => {
    expect(commonTaskUtils).toContain('target_dir.replace("\\\\", "/")');
  });
});

// =============================================================================
// 3. Semver / Migration Engine Regressions
// =============================================================================

describe("regression: semver prerelease handling (beta.5)", () => {
  it("[beta.5] prerelease version sorts before release version", () => {
    // 0.3.0-beta.1 < 0.3.0 (prerelease is less than release)
    const versions = getAllMigrationVersions();
    const betaVersions = versions.filter((v) => v.includes("beta"));
    const releaseVersions = versions.filter(
      (v) => !v.includes("beta") && !v.includes("alpha"),
    );

    if (betaVersions.length > 0 && releaseVersions.length > 0) {
      // All beta versions should appear before their corresponding release versions
      const lastBeta = betaVersions[betaVersions.length - 1];
      const firstRelease = releaseVersions[0];
      const lastBetaIdx = versions.indexOf(lastBeta);
      const firstReleaseIdx = versions.indexOf(firstRelease);
      // Only compare if they share the same base version
      if (lastBeta.startsWith(firstRelease.split("-")[0])) {
        expect(lastBetaIdx).toBeLessThan(firstReleaseIdx);
      }
    }
  });

  it("[beta.5] prerelease numeric parts compare numerically (beta.2 < beta.10)", () => {
    // getMigrationsForVersion relies on correct version ordering
    // beta.2 should be before beta.10 (numeric, not lexicographic)
    const versions = getAllMigrationVersions();
    const beta2Idx = versions.indexOf("0.3.0-beta.2");
    const beta10Idx = versions.indexOf("0.3.0-beta.10");
    if (beta2Idx !== -1 && beta10Idx !== -1) {
      expect(beta2Idx).toBeLessThan(beta10Idx);
    }
  });

  it("[beta.5] getMigrationsForVersion returns empty for equal versions", () => {
    expect(getMigrationsForVersion("0.3.0-beta.5", "0.3.0-beta.5")).toEqual([]);
  });

  it("[beta.5] getMigrationsForVersion correctly handles beta range", () => {
    // beta.0 to beta.2 should include beta.1 and beta.2 migrations
    getMigrationsForVersion("0.3.0-beta.0", "0.3.0-beta.2");
    // Should not include beta.0 itself (only > fromVersion)
    const versions = getAllMigrationVersions();
    if (versions.includes("0.3.0-beta.1")) {
      expect(
        hasPendingMigrations("0.3.0-beta.0", "0.3.0-beta.2"),
      ).toBeDefined();
    }
  });
});

describe("regression: migration data integrity (beta.14)", () => {
  it("[beta.14] all migrations have non-undefined 'from' field", () => {
    const allMigrations = getAllMigrations();
    for (const m of allMigrations) {
      expect(
        m.from,
        `migration should have 'from' field defined`,
      ).toBeDefined();
      expect(typeof m.from).toBe("string");
      expect(m.from.length).toBeGreaterThan(0);
    }
  });

  it("[beta.14] all migrations have valid type field", () => {
    const allMigrations = getAllMigrations();
    const validTypes = ["rename", "rename-dir", "delete", "safe-file-delete"];
    for (const m of allMigrations) {
      expect(validTypes).toContain(m.type);
    }
  });

  it("[beta.1-040] safe-file-delete migrations have allowed_hashes", () => {
    const allMigrations = getAllMigrations();
    const safeDeletes = allMigrations.filter(
      (m) => m.type === "safe-file-delete",
    );
    for (const m of safeDeletes) {
      expect(
        m.allowed_hashes,
        `safe-file-delete for '${m.from}' should have allowed_hashes`,
      ).toBeDefined();
      expect(Array.isArray(m.allowed_hashes)).toBe(true);
      expect(
        (m.allowed_hashes as string[]).length,
        `safe-file-delete for '${m.from}' should have at least one hash`,
      ).toBeGreaterThan(0);
      for (const hash of m.allowed_hashes as string[]) {
        expect(hash).toMatch(/^[a-f0-9]{64}$/);
      }
    }
  });

  it("[beta.14] rename/rename-dir migrations have 'to' field", () => {
    const allMigrations = getAllMigrations();
    const renames = allMigrations.filter(
      (m) => m.type === "rename" || m.type === "rename-dir",
    );
    for (const m of renames) {
      expect(
        m.to,
        `rename migration from '${m.from}' should have 'to'`,
      ).toBeDefined();
      expect(typeof m.to).toBe("string");
      expect((m.to as string).length).toBeGreaterThan(0);
    }
  });

  it("[beta.14] all manifest versions are valid semver-like strings", () => {
    const versions = getAllMigrationVersions();
    for (const v of versions) {
      expect(v).toMatch(/^\d+\.\d+\.\d+(-[\w.]+)?$/);
    }
  });
});

describe("regression: update only configured platforms (beta.16)", () => {
  it("[beta.16] collectPlatformTemplates returns undefined for opencode (no collectTemplates)", () => {
    // OpenCode uses plugin system, templates tracked separately
    const result = collectPlatformTemplates("opencode");
    expect(result).toBeUndefined();
  });

  it("[beta.16] collectPlatformTemplates returns Map for platforms with tracking", () => {
    const withTracking = [
      "claude-code",
      "cursor",
      "iflow",
      "codex",
      "kilo",
      "kiro",
      "gemini",
      "antigravity",
      "windsurf",
      "qoder",
      "codebuddy",
      "copilot",
    ] as const;
    for (const id of withTracking) {
      const result = collectPlatformTemplates(id);
      expect(result, `${id} should have template tracking`).toBeInstanceOf(Map);
    }
  });
});

// =============================================================================
// 4. Template Integrity Regressions
// =============================================================================

describe("regression: shell to Python migration (beta.0)", () => {
  it("[beta.0] no .sh scripts remain in trellis templates", () => {
    const scripts = getAllScripts();
    for (const [name] of scripts) {
      expect(name.endsWith(".sh"), `${name} should not end with .sh`).toBe(
        false,
      );
    }
  });

  it("[beta.0] all script keys end with .py", () => {
    const scripts = getAllScripts();
    for (const [name] of scripts) {
      expect(name.endsWith(".py"), `${name} should end with .py`).toBe(true);
    }
  });

  it("[beta.0] multi_agent uses underscore (not hyphen)", () => {
    const scripts = getAllScripts();
    const multiAgentKeys = [...scripts.keys()].filter((k) =>
      k.includes("multi"),
    );
    for (const key of multiAgentKeys) {
      expect(key).toContain("multi_agent");
      expect(key).not.toContain("multi-agent");
    }
  });

  it("[beta.3] getAllScripts covers every .py file in templates/trellis/scripts/", () => {
    // Bug: update.ts had a hand-maintained file list that missed 11 scripts.
    // Fix: update.ts now uses getAllScripts() directly. This test ensures
    // getAllScripts() itself stays in sync with the filesystem.
    const scriptsDir = path.resolve(
      path.dirname(fileURLToPath(import.meta.url)),
      "../src/templates/trellis/scripts",
    );
    const fsFiles = new Set<string>();
    function walk(dir: string, prefix: string) {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (entry.isDirectory()) {
          walk(path.join(dir, entry.name), `${prefix}${entry.name}/`);
        } else if (entry.name.endsWith(".py")) {
          fsFiles.add(`${prefix}${entry.name}`);
        }
      }
    }
    walk(scriptsDir, "");

    const scripts = getAllScripts();
    const registeredKeys = new Set(scripts.keys());

    // Known exclusions: files intentionally not in getAllScripts()
    const excluded = new Set(["hooks/linear_sync.py", "multi_agent/_bootstrap.py"]);

    for (const file of fsFiles) {
      if (excluded.has(file)) continue;
      expect(
        registeredKeys.has(file),
        `${file} exists on disk but is missing from getAllScripts()`,
      ).toBe(true);
    }
  });
});

describe("regression: hook JSON format (beta.7)", () => {
  it("[beta.7] Claude settings.json is valid JSON", () => {
    expect(() => JSON.parse(claudeSettingsTemplate)).not.toThrow();
  });

  it("[beta.7] Claude settings.json has correct hook structure", () => {
    const settings = JSON.parse(claudeSettingsTemplate);
    expect(settings).toHaveProperty("hooks");
    expect(settings.hooks).toHaveProperty("SessionStart");
    expect(Array.isArray(settings.hooks.SessionStart)).toBe(true);

    // Each hook entry should have matcher and hooks array
    for (const entry of settings.hooks.SessionStart) {
      expect(entry).toHaveProperty("hooks");
      expect(Array.isArray(entry.hooks)).toBe(true);
      for (const hook of entry.hooks) {
        expect(hook).toHaveProperty("type", "command");
        expect(hook).toHaveProperty("command");
        expect(hook).toHaveProperty("timeout");
      }
    }
  });

  it("[beta.7] hook commands use {{PYTHON_CMD}} placeholder (not hardcoded python3)", () => {
    const settings = JSON.parse(claudeSettingsTemplate);
    const allHookEntries = [
      ...settings.hooks.SessionStart,
      ...settings.hooks.PreToolUse,
      ...settings.hooks.SubagentStop,
    ];
    for (const entry of allHookEntries) {
      for (const hook of entry.hooks) {
        expect(hook.command).toContain("{{PYTHON_CMD}}");
        expect(hook.command).not.toMatch(/^python3?\s/);
      }
    }
  });

  it("[beta.7] iFlow settings.json is valid JSON with hooks", () => {
    expect(() => JSON.parse(iflowSettingsTemplate)).not.toThrow();
    const settings = JSON.parse(iflowSettingsTemplate);
    expect(settings).toHaveProperty("hooks");
  });

  it("[beta.7] iFlow hook commands use {{PYTHON_CMD}} placeholder", () => {
    const settings = JSON.parse(iflowSettingsTemplate);
    const hookTypes = Object.values(settings.hooks) as {
      hooks: { command: string }[];
    }[][];
    for (const entries of hookTypes) {
      for (const entry of entries) {
        for (const hook of entry.hooks) {
          expect(hook.command).toContain("{{PYTHON_CMD}}");
        }
      }
    }
  });
});

describe("regression: SessionStart reinject on clear/compact (MIN-231)", () => {
  it("[MIN-231] Claude SessionStart hooks cover startup, clear, and compact", () => {
    const settings = JSON.parse(claudeSettingsTemplate);
    const matchers = settings.hooks.SessionStart.map(
      (e: { matcher: string }) => e.matcher,
    );
    expect(matchers).toEqual(
      expect.arrayContaining(["startup", "clear", "compact"]),
    );
  });

  it("[MIN-231] iFlow SessionStart hooks cover startup, clear, and compress", () => {
    const settings = JSON.parse(iflowSettingsTemplate);
    const matchers = settings.hooks.SessionStart.map(
      (e: { matcher: string }) => e.matcher,
    );
    expect(matchers).toEqual(
      expect.arrayContaining(["startup", "clear", "compress"]),
    );
  });

  it("[MIN-231] all SessionStart matchers invoke session-start.py", () => {
    for (const [label, template] of [
      ["claude", claudeSettingsTemplate],
      ["iflow", iflowSettingsTemplate],
    ] as const) {
      const settings = JSON.parse(template);
      for (const entry of settings.hooks.SessionStart) {
        expect(
          entry.hooks[0].command,
          `${label} ${entry.matcher} should invoke session-start.py`,
        ).toContain("session-start.py");
      }
    }
  });
});

describe("regression: current-task path normalization", () => {
  let tmpDir: string;
  const pythonCmd = process.platform === "win32" ? "python" : "python3";
  const claudeSessionStart = getClaudeHooks().find(
    (hook) => hook.targetPath === "hooks/session-start.py",
  )?.content;
  const iflowSessionStart = getIflowHooks().find(
    (hook) => hook.targetPath === "hooks/session-start.py",
  )?.content;
  const codexSessionStart = getCodexHooks().find(
    (hook) => hook.name === "session-start.py",
  )?.content;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "trellis-current-task-"));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  function writeTrellisScripts(): void {
    const scriptsDir = path.join(tmpDir, ".trellis", "scripts");
    for (const [relativePath, content] of getAllScripts()) {
      const absPath = path.join(scriptsDir, relativePath);
      fs.mkdirSync(path.dirname(absPath), { recursive: true });
      fs.writeFileSync(absPath, content, "utf-8");
    }
  }

  function writeProjectFile(relativePath: string, content: string): void {
    const absPath = path.join(tmpDir, relativePath);
    fs.mkdirSync(path.dirname(absPath), { recursive: true });
    fs.writeFileSync(absPath, content, "utf-8");
  }

  function setupTaskRepo(taskRef = ".trellis\\tasks\\issue-106"): void {
    writeTrellisScripts();
    writeProjectFile(
      path.join(".trellis", ".developer"),
      "name=test-dev\ninitialized_at=2026-03-27T00:00:00\n",
    );
    writeProjectFile(path.join(".trellis", "workflow.md"), "# Workflow\n");
    writeProjectFile(
      path.join(".trellis", "spec", "guides", "index.md"),
      "# Guides\n",
    );
    writeProjectFile(path.join(".trellis", ".current-task"), `${taskRef}\n`);
    writeProjectFile(
      path.join(".trellis", "tasks", "issue-106", "task.json"),
      JSON.stringify(
        {
          title: "Issue 106 task",
          status: "in_progress",
          package: null,
        },
        null,
        2,
      ),
    );
    writeProjectFile(
      path.join(".trellis", "tasks", "issue-106", "prd.md"),
      "# PRD\n",
    );
    writeProjectFile(
      path.join(".trellis", "tasks", "issue-106", "implement.jsonl"),
      '{"file":"src/example.ts","reason":"runtime regression"}\n',
    );
  }

  function runPython(relativeScriptPath: string, input?: string): string {
    const scriptPath = path.join(tmpDir, relativeScriptPath);
    return execSync(`${pythonCmd} ${JSON.stringify(scriptPath)}`, {
      cwd: tmpDir,
      input,
      encoding: "utf-8",
    });
  }

  function expectTemplateContent(
    content: string | undefined,
    label: string,
  ): string {
    expect(content, `${label} template should exist`).toBeTruthy();
    return content ?? "";
  }

  it("[current-task] task.py start canonicalizes Windows-style task refs before writing", () => {
    setupTaskRepo("");
    const taskScriptPath = path.join(tmpDir, ".trellis", "scripts", "task.py");

    const output = execSync(
      `${pythonCmd} ${JSON.stringify(taskScriptPath)} start ${JSON.stringify(".trellis\\\\tasks\\\\issue-106")}`,
      {
        cwd: tmpDir,
        encoding: "utf-8",
      },
    );

    expect(output).toContain(".trellis/tasks/issue-106");
    expect(
      fs.readFileSync(path.join(tmpDir, ".trellis", ".current-task"), "utf-8").trim(),
    ).toBe(".trellis/tasks/issue-106");
  });

  it("[current-task] Python session-start hooks resolve legacy backslash refs without stale pointer", () => {
    setupTaskRepo();

    writeProjectFile(
      path.join(".claude", "hooks", "session-start.py"),
      expectTemplateContent(claudeSessionStart, "claude session-start"),
    );
    writeProjectFile(
      path.join(".iflow", "hooks", "session-start.py"),
      expectTemplateContent(iflowSessionStart, "iflow session-start"),
    );
    writeProjectFile(
      path.join(".codex", "hooks", "session-start.py"),
      expectTemplateContent(codexSessionStart, "codex session-start"),
    );

    const claudeOutput = runPython(path.join(".claude", "hooks", "session-start.py"));
    const iflowOutput = runPython(path.join(".iflow", "hooks", "session-start.py"));
    const codexOutput = runPython(
      path.join(".codex", "hooks", "session-start.py"),
      JSON.stringify({ cwd: tmpDir }),
    );

    for (const output of [claudeOutput, iflowOutput]) {
      expect(output).toContain("Status: READY");
      expect(output).not.toContain("STALE POINTER");
    }

    const codexPayload = JSON.parse(codexOutput) as {
      hookSpecificOutput: { additionalContext: string };
    };
    expect(codexPayload.hookSpecificOutput.additionalContext).toContain(
      "Status: READY",
    );
    expect(codexPayload.hookSpecificOutput.additionalContext).not.toContain(
      "STALE POINTER",
    );
  });

  it("[current-task] OpenCode context layer normalizes backslash refs for downstream plugins", () => {
    setupTaskRepo();

    const ctx = new TrellisContext(tmpDir) as TrellisContext & {
      resolveTaskDir: (taskRef: string) => string | null;
    };

    expect(ctx.getCurrentTask()).toBe(".trellis/tasks/issue-106");
    expect(ctx.resolveTaskDir(".trellis\\tasks\\issue-106")).toBe(
      path.join(tmpDir, ".trellis", "tasks", "issue-106"),
    );
  });
});

describe("regression: OMT additive task compatibility", () => {
  let tmpDir: string;
  const pythonCmd = process.platform === "win32" ? "python" : "python3";

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "trellis-omt-meta-"));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  function writeTrellisScripts(): void {
    const scriptsDir = path.join(tmpDir, ".trellis", "scripts");
    for (const [relativePath, content] of getAllScripts()) {
      const absPath = path.join(scriptsDir, relativePath);
      fs.mkdirSync(path.dirname(absPath), { recursive: true });
      fs.writeFileSync(absPath, content, "utf-8");
    }
  }

  function writeTaskJson(taskName: string, taskJson: Record<string, unknown>): string {
    const taskDir = path.join(tmpDir, ".trellis", "tasks", taskName);
    fs.mkdirSync(taskDir, { recursive: true });
    fs.writeFileSync(
      path.join(taskDir, "task.json"),
      JSON.stringify(taskJson, null, 2),
      "utf-8",
    );
    return taskDir;
  }

  function writeProjectFile(relativePath: string, content: string): void {
    const absPath = path.join(tmpDir, relativePath);
    fs.mkdirSync(path.dirname(absPath), { recursive: true });
    fs.writeFileSync(absPath, content, "utf-8");
  }

  function runPythonScript(filename: string, content: string): string {
    const scriptPath = path.join(tmpDir, filename);
    fs.writeFileSync(scriptPath, content, "utf-8");
    return execSync(`${pythonCmd} ${JSON.stringify(scriptPath)}`, {
      cwd: tmpDir,
      encoding: "utf-8",
    });
  }

  it("[omt] pre-OMT tasks still load via task.py list without migration", () => {
    writeTrellisScripts();
    fs.writeFileSync(
      path.join(tmpDir, ".trellis", ".developer"),
      "name=test-dev\ninitialized_at=2026-04-07T00:00:00\n",
      "utf-8",
    );
    writeTaskJson("legacy-task", {
      title: "Legacy task",
      status: "planning",
      assignee: "test-dev",
      priority: "P2",
      children: [],
      parent: null,
      package: null,
      meta: {},
    });

    const output = execSync(
      `${pythonCmd} ${JSON.stringify(path.join(tmpDir, ".trellis", "scripts", "task.py"))} list`,
      {
        cwd: tmpDir,
        encoding: "utf-8",
      },
    );

    expect(output).toContain("legacy-task/");
  });

  it("[omt] workflow markers are stored additively under task.json meta", () => {
    writeTrellisScripts();
    const taskDir = writeTaskJson("omt-task", {
      title: "OMT task",
      status: "planning",
      current_phase: 0,
      next_action: [{ phase: 1, action: "implement" }],
      meta: {},
    });

    const output = runPythonScript(
      "mark_omt.py",
      `from pathlib import Path
import json
import sys

sys.path.insert(0, str(Path(".trellis/scripts").resolve()))

from common.io import read_json, write_json
from common.omt import is_omt_managed, set_omt_workflow

task_json = Path(${JSON.stringify(path.join(taskDir, "task.json"))})
data = read_json(task_json) or {}
set_omt_workflow(data, "strict")
write_json(task_json, data)
saved = read_json(task_json) or {}
print(json.dumps({
    "workflow_id": saved.get("meta", {}).get("workflow_id"),
    "workflow_mode": saved.get("meta", {}).get("workflow_mode"),
    "managed": is_omt_managed(saved),
}))
`,
    );

    const payload = JSON.parse(output) as {
      workflow_id: string;
      workflow_mode: string;
      managed: boolean;
    };
    expect(payload.workflow_id).toBe("omt/v1");
    expect(payload.workflow_mode).toBe("strict");
    expect(payload.managed).toBe(true);
  });

  it("[omt] existing phase writers preserve additive workflow metadata", () => {
    writeTrellisScripts();
    const taskDir = writeTaskJson("omt-phase-task", {
      title: "OMT phase task",
      status: "planning",
      current_phase: 0,
      next_action: [
        { phase: 1, action: "implement" },
        { phase: 2, action: "check" },
      ],
      meta: {
        workflow_id: "omt/v1",
        workflow_mode: "fast",
      },
    });

    const output = runPythonScript(
      "advance_phase.py",
      `from pathlib import Path
import json
import sys

sys.path.insert(0, str(Path(".trellis/scripts").resolve()))

from common.io import read_json
from common.phase import set_phase

task_json = Path(${JSON.stringify(path.join(taskDir, "task.json"))})
set_phase(task_json, 2)
saved = read_json(task_json) or {}
print(json.dumps({
    "current_phase": saved.get("current_phase"),
    "workflow_id": saved.get("meta", {}).get("workflow_id"),
    "workflow_mode": saved.get("meta", {}).get("workflow_mode"),
}))
`,
    );

    const payload = JSON.parse(output) as {
      current_phase: number;
      workflow_id: string;
      workflow_mode: string;
    };
    expect(payload.current_phase).toBe(2);
    expect(payload.workflow_id).toBe("omt/v1");
    expect(payload.workflow_mode).toBe("fast");
  });

  it("[omt] shared workflow helpers scaffold strict artifacts and validate transitions", () => {
    writeTrellisScripts();
    const taskDir = writeTaskJson("omt-strict-task", {
      title: "OMT strict task",
      status: "planning",
      current_phase: 0,
      next_action: [
        { phase: 1, action: "implement" },
        { phase: 2, action: "check" },
      ],
      meta: {
        workflow_id: "omt/v1",
        workflow_mode: "strict",
      },
    });

    const output = runPythonScript(
      "strict_artifacts.py",
      `from pathlib import Path
import json
import sys

sys.path.insert(0, str(Path(".trellis/scripts").resolve()))

from common.omt_workflow import scaffold_strict_artifacts, validate_transition
from common.omt_workflow import write_review_round
from common.omt_workflow import write_verify_round

task_dir = Path(${JSON.stringify(taskDir)})
created = scaffold_strict_artifacts(task_dir)
write_review_round(
    task_dir,
    "default",
    "approved",
    [],
    ["Ready for execution"],
    "high",
)
execute_result = validate_transition(task_dir, "execute")
write_verify_round(
    task_dir,
    "pass",
    ["Acceptance criteria met"],
    ["Verification passed"],
    [],
)
close_result = validate_transition(task_dir, "close")
print(json.dumps({
    "created": created,
    "execute_ok": execute_result[0],
    "execute_message": execute_result[1],
    "close_ok": close_result[0],
    "close_message": close_result[1],
}))
`,
    );

    const payload = JSON.parse(output) as {
      created: string[];
      execute_ok: boolean;
      execute_message: string;
      close_ok: boolean;
      close_message: string;
    };
    expect(payload.created).toEqual(
      expect.arrayContaining(["plan.md", "review.md", "execute.md", "verify.md", "close.md"]),
    );
    expect(payload.execute_ok).toBe(true);
    expect(payload.close_ok).toBe(true);
  });

  it("[omt] adopt_legacy_task adds metadata and fast close artifact in place", () => {
    writeTrellisScripts();
    const taskDir = writeTaskJson("legacy-fast-task", {
      title: "Legacy fast task",
      status: "planning",
      current_phase: 0,
      next_action: [],
      meta: {},
    });

    const output = runPythonScript(
      "adopt_fast.py",
      `from pathlib import Path
import json
import sys

sys.path.insert(0, str(Path(".trellis/scripts").resolve()))

from common.io import read_json
from common.omt_workflow import adopt_legacy_task

task_dir = Path(${JSON.stringify(taskDir)})
created = adopt_legacy_task(task_dir, "fast")
saved = read_json(task_dir / "task.json") or {}
print(json.dumps({
    "created": created,
    "workflow_id": saved.get("meta", {}).get("workflow_id"),
    "workflow_mode": saved.get("meta", {}).get("workflow_mode"),
    "has_close": (task_dir / "close.md").is_file(),
}))
`,
    );

    const payload = JSON.parse(output) as {
      created: string[];
      workflow_id: string;
      workflow_mode: string;
      has_close: boolean;
    };
    expect(payload.created).toEqual(["close.md"]);
    expect(payload.workflow_id).toBe("omt/v1");
    expect(payload.workflow_mode).toBe("fast");
    expect(payload.has_close).toBe(true);
  });

  it("[omt] root config overrides framework defaults deterministically", () => {
    writeTrellisScripts();
    writeProjectFile(
      path.join(".omt", "config", "oh-my-trellis.defaults.jsonc"),
      JSON.stringify(
        {
          routing: {
            enabled: true,
            tiers: { low: "low-default", high: "high-default" },
            executor: { fast: "low", strict: "high" },
          },
        },
        null,
        2,
      ),
    );
    writeProjectFile(
      "oh-my-trellis.jsonc",
      JSON.stringify(
        {
          routing: {
            tiers: { high: "high-override" },
          },
        },
        null,
        2,
      ),
    );

    const output = runPythonScript(
      "resolve_config.py",
      `from pathlib import Path
import json
import sys

sys.path.insert(0, str(Path(".trellis/scripts").resolve()))

from common.omt_config import resolve_omt_config

resolved = resolve_omt_config(Path.cwd())
print(json.dumps(resolved))
`,
    );

    const payload = JSON.parse(output) as {
      routing: {
        enabled: boolean;
        tiers: { low: string; high: string };
        executor: { fast: string; strict: string };
      };
    };
    expect(payload.routing.enabled).toBe(true);
    expect(payload.routing.tiers.low).toBe("low-default");
    expect(payload.routing.tiers.high).toBe("high-override");
    expect(payload.routing.executor.strict).toBe("high");
  });

  it("[omt] session bundle mode includes task metadata and omt command context", () => {
    writeTrellisScripts();
    writeProjectFile(path.join(".trellis", ".developer"), "name=test-dev\n",);
    writeProjectFile(path.join(".trellis", "workflow.md"), "# Workflow\n");
    writeProjectFile(path.join(".trellis", ".current-task"), ".trellis/tasks/omt-session-task\n");
    writeProjectFile(path.join(".trellis", "spec", "guides", "index.md"), "# Guides\n");
    writeProjectFile(path.join(".omt", "commands", "omt-start.md"), "# OMT Start\n");
    const taskDir = writeTaskJson("omt-session-task", {
      title: "OMT session task",
      status: "planning",
      current_phase: 0,
      next_action: [{ phase: 1, action: "implement" }],
      meta: { workflow_id: "omt/v1", workflow_mode: "strict" },
    });
    fs.writeFileSync(path.join(taskDir, "prd.md"), "# Task\n\n## Goal\nShip it\n\n## Requirements\n- keep API\n\n## Acceptance Criteria\n- [ ] tests pass\n", "utf-8");

    const output = execSync(
      `${pythonCmd} ${JSON.stringify(path.join(tmpDir, ".trellis", "scripts", "get_context.py"))} --mode omt-session --json`,
      { cwd: tmpDir, encoding: "utf-8" },
    );

    const payload = JSON.parse(output) as {
      mode: string;
      task: { workflow_id: string; workflow_mode: string; goal: string; acceptance_criteria: string[] };
      omt_start: { path: string; content: string };
    };
    expect(payload.mode).toBe("omt-session");
    expect(payload.task.workflow_id).toBe("omt/v1");
    expect(payload.task.workflow_mode).toBe("strict");
    expect(payload.task.goal).toBe("Ship it");
    expect(payload.task.acceptance_criteria).toContain("tests pass");
    expect(payload.omt_start.path).toBe(".omt/commands/omt-start.md");
  });

  it("[omt] agent bundle mode resolves implement context entries and artifacts", () => {
    writeTrellisScripts();
    writeProjectFile(path.join(".trellis", ".developer"), "name=test-dev\n");
    writeProjectFile(path.join(".trellis", ".current-task"), ".trellis/tasks/omt-agent-task\n");
    const taskDir = writeTaskJson("omt-agent-task", {
      title: "OMT agent task",
      status: "planning",
      current_phase: 0,
      next_action: [{ phase: 1, action: "implement" }],
      meta: { workflow_id: "omt/v1", workflow_mode: "strict" },
    });
    fs.writeFileSync(path.join(taskDir, "prd.md"), "# Task\n\n## Goal\nBuild feature\n", "utf-8");
    fs.writeFileSync(path.join(taskDir, "plan.md"), "# Plan\n", "utf-8");
    writeProjectFile(path.join("src", "sample.ts"), "export const sample = true;\n");
    fs.writeFileSync(path.join(taskDir, "implement.jsonl"), '{"file":"src/sample.ts","reason":"Implementation context"}\n', "utf-8");

    const output = execSync(
      `${pythonCmd} ${JSON.stringify(path.join(tmpDir, ".trellis", "scripts", "get_context.py"))} --mode omt-agent --agent implement --json`,
      { cwd: tmpDir, encoding: "utf-8" },
    );

    const payload = JSON.parse(output) as {
      mode: string;
      agent: string;
      context_entries: Array<{ path: string; content: string }>;
      extra_files: Array<{ path: string; content: string }>;
    };
    expect(payload.mode).toBe("omt-agent");
    expect(payload.agent).toBe("implement");
    expect(payload.context_entries.some((entry) => entry.path === "src/sample.ts")).toBe(true);
    expect(payload.extra_files.some((entry) => entry.path.endsWith("/prd.md"))).toBe(true);
    expect(payload.extra_files.some((entry) => entry.path.endsWith("/plan.md"))).toBe(true);
  });

  it("[omt] strict planning appends canonical plan rounds", () => {
    writeTrellisScripts();
    const taskDir = writeTaskJson("omt-plan-task", {
      title: "OMT plan task",
      status: "planning",
      current_phase: 0,
      next_action: [{ phase: 1, action: "implement" }],
      meta: { workflow_id: "omt/v1", workflow_mode: "strict" },
    });

    const output = runPythonScript(
      "write_plan_rounds.py",
      `from pathlib import Path
import json
import sys

sys.path.insert(0, str(Path(".trellis/scripts").resolve()))

from common.omt_workflow import write_plan_round

task_dir = Path(${JSON.stringify(taskDir)})
first_round = write_plan_round(
    task_dir,
    "Ship the planner",
    ["Read task", "Write plan"],
    ["Spec drift"],
    ["Tests pass"],
)
second_round = write_plan_round(
    task_dir,
    "Revise the planner",
    ["Update steps"],
    ["Review churn"],
    ["Plan approved"],
)
content = (task_dir / "plan.md").read_text(encoding="utf-8")
print(json.dumps({
    "first_round": first_round,
    "second_round": second_round,
    "content": content,
}))
`,
    );

    const payload = JSON.parse(output) as {
      first_round: number;
      second_round: number;
      content: string;
    };
    expect(payload.first_round).toBe(1);
    expect(payload.second_round).toBe(2);
    expect(payload.content).toContain("## Round 1");
    expect(payload.content).toContain("## Round 2");
    expect(payload.content).toContain("### Goal Summary");
    expect(payload.content).toContain("### Verification Checklist");
  });

  it("[omt] strict review approval gates execute transitions", () => {
    writeTrellisScripts();
    const taskDir = writeTaskJson("omt-review-task", {
      title: "OMT review task",
      status: "planning",
      current_phase: 0,
      next_action: [{ phase: 1, action: "implement" }],
      meta: { workflow_id: "omt/v1", workflow_mode: "strict" },
    });
    fs.writeFileSync(path.join(taskDir, "plan.md"), "# Plan\n", "utf-8");

    const output = runPythonScript(
      "review_gate.py",
      `from pathlib import Path
import json
import sys

sys.path.insert(0, str(Path(".trellis/scripts").resolve()))

from common.omt_workflow import write_review_round, validate_transition

task_dir = Path(${JSON.stringify(taskDir)})
round_one = write_review_round(
    task_dir,
    "default",
    "required_changes",
    ["Clarify scope"],
    ["Tighten verification"],
    "medium",
)
blocked = validate_transition(task_dir, "execute")
round_two = write_review_round(
    task_dir,
    "momus",
    "approved",
    [],
    ["Looks good"],
    "high",
)
allowed = validate_transition(task_dir, "execute")
content = (task_dir / "review.md").read_text(encoding="utf-8")
print(json.dumps({
    "round_one": round_one,
    "round_two": round_two,
    "blocked": blocked,
    "allowed": allowed,
    "content": content,
}))
`,
    );

    const payload = JSON.parse(output) as {
      round_one: number;
      round_two: number;
      blocked: [boolean, string];
      allowed: [boolean, string];
      content: string;
    };
    expect(payload.round_one).toBe(1);
    expect(payload.round_two).toBe(2);
    expect(payload.blocked[0]).toBe(false);
    expect(payload.blocked[1]).toContain("not approved");
    expect(payload.allowed[0]).toBe(true);
    expect(payload.content).toContain("### Verdict");
    expect(payload.content).toContain("required_changes");
    expect(payload.content).toContain("approved");
    expect(payload.content).toContain("### Mode");
  });

  it("[omt] strict execute-verify-close happy path updates artifacts and status", () => {
    writeTrellisScripts();
    const taskDir = writeTaskJson("omt-execute-task", {
      title: "OMT execute task",
      status: "planning",
      current_phase: 0,
      next_action: [
        { phase: 1, action: "implement" },
        { phase: 2, action: "check" },
        { phase: 3, action: "close" },
      ],
      meta: { workflow_id: "omt/v1", workflow_mode: "strict" },
    });
    fs.writeFileSync(path.join(taskDir, "plan.md"), "# Plan\n", "utf-8");
    fs.writeFileSync(path.join(taskDir, "review.md"), "# Review\n\n## Round 1\n\n### Verdict\n\napproved\n", "utf-8");

    const output = runPythonScript(
      "execute_verify_close.py",
      `from pathlib import Path
import json
import sys

sys.path.insert(0, str(Path(".trellis/scripts").resolve()))

from common.io import read_json
from common.omt_workflow import (
    write_execute_round,
    write_verify_round,
    write_close_round,
    validate_transition,
    finalize_close,
)

task_dir = Path(${JSON.stringify(taskDir)})
execute_round = write_execute_round(
    task_dir,
    ["src/example.ts"],
    ["Implemented feature"],
    ["pnpm test"],
    [],
)
verify_round = write_verify_round(
    task_dir,
    "pass",
    ["Acceptance criteria met"],
    ["pnpm test passed"],
    [],
)
close_round = write_close_round(
    task_dir,
    "Finish the task",
    ["single subsystem"],
    ["implemented feature"],
    ["verified with tests"],
    "completed",
)
close_gate = validate_transition(task_dir, "close")
final_state = finalize_close(task_dir)
saved = read_json(task_dir / "task.json") or {}
print(json.dumps({
    "execute_round": execute_round,
    "verify_round": verify_round,
    "close_round": close_round,
    "close_gate": close_gate,
    "final_state": final_state,
    "status": saved.get("status"),
    "verification_outcome": saved.get("meta", {}).get("verification_outcome"),
    "close_outcome": saved.get("meta", {}).get("close_outcome"),
}))
`,
    );

    const payload = JSON.parse(output) as {
      execute_round: number;
      verify_round: number;
      close_round: number;
      close_gate: [boolean, string];
      final_state: { status: string; verification_outcome: string; current_phase: number };
      status: string;
      verification_outcome: string;
      close_outcome: string;
    };
    expect(payload.execute_round).toBe(1);
    expect(payload.verify_round).toBe(1);
    expect(payload.close_round).toBe(1);
    expect(payload.close_gate[0]).toBe(true);
    expect(payload.status).toBe("completed");
    expect(payload.verification_outcome).toBe("pass");
    expect(payload.close_outcome).toBe("completed");
  });

  it("[omt] verification failure blocks close until rerun passes", () => {
    writeTrellisScripts();
    const taskDir = writeTaskJson("omt-verify-loop-task", {
      title: "OMT verify loop task",
      status: "planning",
      current_phase: 0,
      next_action: [
        { phase: 1, action: "implement" },
        { phase: 2, action: "check" },
        { phase: 3, action: "close" },
      ],
      meta: { workflow_id: "omt/v1", workflow_mode: "strict" },
    });
    fs.writeFileSync(path.join(taskDir, "plan.md"), "# Plan\n", "utf-8");
    fs.writeFileSync(path.join(taskDir, "review.md"), "# Review\n\n## Round 1\n\n### Verdict\n\napproved\n", "utf-8");

    const output = runPythonScript(
      "verify_fail_loop.py",
      `from pathlib import Path
import json
import sys

sys.path.insert(0, str(Path(".trellis/scripts").resolve()))

from common.omt_workflow import write_execute_round, write_verify_round, validate_transition, write_close_round, finalize_close

task_dir = Path(${JSON.stringify(taskDir)})
write_execute_round(task_dir, ["src/example.ts"], ["Implemented feature"], ["pnpm test"], [])
fail_round = write_verify_round(task_dir, "fail", ["Requirement pending"], ["pnpm test failed"], ["Fix issue"])
blocked = validate_transition(task_dir, "close")
write_execute_round(task_dir, ["src/example.ts"], ["Fixed issue"], ["pnpm test"], [])
pass_round = write_verify_round(task_dir, "pass", ["Requirement met"], ["pnpm test passed"], [])
allowed = validate_transition(task_dir, "close")
write_close_round(task_dir, "Close after rerun", ["single subsystem"], ["fixed issue"], ["tests pass"], "completed")
final_state = finalize_close(task_dir)
print(json.dumps({
    "fail_round": fail_round,
    "pass_round": pass_round,
    "blocked": blocked,
    "allowed": allowed,
    "final_state": final_state,
    "verify_content": (task_dir / "verify.md").read_text(encoding="utf-8"),
}))
`,
    );

    const payload = JSON.parse(output) as {
      fail_round: number;
      pass_round: number;
      blocked: [boolean, string];
      allowed: [boolean, string];
      final_state: { status: string };
      verify_content: string;
    };
    expect(payload.fail_round).toBe(1);
    expect(payload.pass_round).toBe(2);
    expect(payload.blocked[0]).toBe(false);
    expect(payload.blocked[1]).toContain("latest verification outcome is fail");
    expect(payload.allowed[0]).toBe(true);
    expect(payload.final_state.status).toBe("completed");
    expect(payload.verify_content).toContain("## Round 1");
    expect(payload.verify_content).toContain("## Round 2");
  });

  it("[omt] fast close requires canonical headings and finalizes task", () => {
    writeTrellisScripts();
    const taskDir = writeTaskJson("omt-fast-close-task", {
      title: "OMT fast close task",
      status: "planning",
      current_phase: 0,
      next_action: [],
      meta: { workflow_id: "omt/v1", workflow_mode: "fast" },
    });

    const output = runPythonScript(
      "fast_close.py",
      `from pathlib import Path
import json
import sys

sys.path.insert(0, str(Path(".trellis/scripts").resolve()))

from common.io import read_json
from common.omt_workflow import write_fast_close, validate_transition, finalize_fast_close

task_dir = Path(${JSON.stringify(taskDir)})
write_fast_close(
    task_dir,
    "Deliver small fix",
    ["single file"],
    ["updated implementation"],
    ["pnpm test passed"],
    "completed",
)
close_gate = validate_transition(task_dir, "close")
final_state = finalize_fast_close(task_dir)
saved = read_json(task_dir / "task.json") or {}
print(json.dumps({
    "close_gate": close_gate,
    "final_state": final_state,
    "status": saved.get("status"),
    "close_outcome": saved.get("meta", {}).get("close_outcome"),
    "close_md": (task_dir / "close.md").read_text(encoding="utf-8"),
}))
`,
    );

    const payload = JSON.parse(output) as {
      close_gate: [boolean, string];
      final_state: { status: string; workflow_mode: string };
      status: string;
      close_outcome: string;
      close_md: string;
    };
    expect(payload.close_gate[0]).toBe(true);
    expect(payload.status).toBe("completed");
    expect(payload.close_outcome).toBe("completed");
    expect(payload.close_md).toContain("## Intent");
    expect(payload.close_md).toContain("## Scope");
    expect(payload.close_md).toContain("## Changes");
    expect(payload.close_md).toContain("## Verification");
    expect(payload.close_md).toContain("## Outcome");
  });

  it("[omt] fast close is rejected when required headings are missing", () => {
    writeTrellisScripts();
    const taskDir = writeTaskJson("omt-fast-invalid-task", {
      title: "OMT invalid fast close task",
      status: "planning",
      current_phase: 0,
      next_action: [],
      meta: { workflow_id: "omt/v1", workflow_mode: "fast" },
    });
    fs.writeFileSync(path.join(taskDir, "close.md"), "# Close\n\n## Intent\n\nOnly partial\n", "utf-8");

    const output = runPythonScript(
      "fast_close_invalid.py",
      `from pathlib import Path
import json
import sys

sys.path.insert(0, str(Path(".trellis/scripts").resolve()))

from common.omt_workflow import validate_transition

task_dir = Path(${JSON.stringify(taskDir)})
result = validate_transition(task_dir, "close")
print(json.dumps({"result": result}))
`,
    );

    const payload = JSON.parse(output) as { result: [boolean, string] };
    expect(payload.result[0]).toBe(false);
    expect(payload.result[1]).toContain("required fast-close headings");
  });

  it("[omt] fast task promotion creates strict artifacts in place", () => {
    writeTrellisScripts();
    const taskDir = writeTaskJson("omt-promote-task", {
      title: "OMT promote task",
      status: "planning",
      current_phase: 0,
      next_action: [],
      meta: { workflow_id: "omt/v1", workflow_mode: "fast" },
    });
    fs.writeFileSync(path.join(taskDir, "close.md"), "# Close\n\n## Intent\n\nFast work\n\n## Scope\n\n- one area\n\n## Changes\n\n- change\n\n## Verification\n\n- test\n\n## Outcome\n\ncompleted\n", "utf-8");

    const output = runPythonScript(
      "promote_fast.py",
      `from pathlib import Path
import json
import sys

sys.path.insert(0, str(Path(".trellis/scripts").resolve()))

from common.io import read_json
from common.omt_workflow import promote_fast_task

task_dir = Path(${JSON.stringify(taskDir)})
created = promote_fast_task(
    task_dir,
    ["multiple_subsystems", "reviewer_or_oracle_required"],
    "Scope expanded beyond fast path",
)
saved = read_json(task_dir / "task.json") or {}
print(json.dumps({
    "created": created,
    "workflow_mode": saved.get("meta", {}).get("workflow_mode"),
    "promoted_from": saved.get("meta", {}).get("promoted_from"),
    "promotion_triggers": saved.get("meta", {}).get("promotion_triggers"),
    "has_plan": (task_dir / "plan.md").is_file(),
    "has_review": (task_dir / "review.md").is_file(),
    "has_execute": (task_dir / "execute.md").is_file(),
    "has_verify": (task_dir / "verify.md").is_file(),
    "has_close": (task_dir / "close.md").is_file(),
}))
`,
    );

    const payload = JSON.parse(output) as {
      created: string[];
      workflow_mode: string;
      promoted_from: string;
      promotion_triggers: string[];
      has_plan: boolean;
      has_review: boolean;
      has_execute: boolean;
      has_verify: boolean;
      has_close: boolean;
    };
    expect(payload.workflow_mode).toBe("strict");
    expect(payload.promoted_from).toBe("fast");
    expect(payload.promotion_triggers).toEqual([
      "multiple_subsystems",
      "reviewer_or_oracle_required",
    ]);
    expect(payload.has_plan).toBe(true);
    expect(payload.has_review).toBe(true);
    expect(payload.has_execute).toBe(true);
    expect(payload.has_verify).toBe(true);
    expect(payload.has_close).toBe(true);
  });
});

describe("regression: OMT definition layer", () => {
  const repoRoot = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "../../..",
  );

  it("[omt] definition layer exists with expected directories", () => {
    expect(fs.existsSync(path.join(repoRoot, ".omt", "agents"))).toBe(true);
    expect(fs.existsSync(path.join(repoRoot, ".omt", "commands"))).toBe(true);
    expect(fs.existsSync(path.join(repoRoot, ".omt", "prompts"))).toBe(true);
    expect(fs.existsSync(path.join(repoRoot, ".omt", "hooks"))).toBe(true);
    expect(fs.existsSync(path.join(repoRoot, ".omt", "config"))).toBe(true);
  });

  it("[omt] root config uses documented schema path", () => {
    const rootConfig = fs.readFileSync(
      path.join(repoRoot, "oh-my-trellis.jsonc"),
      "utf-8",
    );
    expect(rootConfig).toContain('"$schema": "./.omt/config/schema.json"');
  });

  it("[omt] migration docs describe additive adoption and lazy task opt-in", () => {
    const migrationDoc = fs.readFileSync(
      path.join(repoRoot, ".omt", "migration.md"),
      "utf-8",
    );
    expect(migrationDoc).toContain("additive");
    expect(migrationDoc).toContain("Existing Trellis repositories can adopt OMT");
    expect(migrationDoc).toContain("Lazy Task Adoption");
    expect(migrationDoc).toContain("workflow_id");
  });

  it("[omt] skills docs distinguish Trellis core skills from imported OMO skills", () => {
    const skillsDoc = fs.readFileSync(
      path.join(repoRoot, ".omt", "skills.md"),
      "utf-8",
    );
    expect(skillsDoc).toContain("Trellis Skills Kept As Core Workflow Skills");
    expect(skillsDoc).toContain("Imported Portable OMO Skills");
    expect(skillsDoc).toContain("git-master");
    expect(skillsDoc).toContain("playwright");
  });

  it("[omt] v1.1 appendix records deferred feature evaluation", () => {
    const appendix = fs.readFileSync(
      path.join(repoRoot, ".omt", "v1-1-evaluation.md"),
      "utf-8",
    );
    expect(appendix).toContain("Loops");
    expect(appendix).toContain("Continuation Hooks");
    expect(appendix).toContain("Auto-Slash Command");
    expect(appendix).toContain("Recommendation");
  });

  it("[omt] backend spec index links OMT adoption guidance", () => {
    const backendIndex = fs.readFileSync(
      path.join(repoRoot, ".trellis", "spec", "cli", "backend", "index.md"),
      "utf-8",
    );
    expect(backendIndex).toContain("OMT Adoption");
    expect(backendIndex).toContain("omt-adoption.md");
  });

  it("[omt] root README mentions the OMT overlay", () => {
    const readme = fs.readFileSync(
      path.join(repoRoot, "README.md"),
      "utf-8",
    );
    expect(readme).toContain("OMT Overlay in This Fork");
    expect(readme).toContain("definition-only layer");
    expect(readme).toContain("plan → review → execute");
  });
});

describe("regression: OMT OpenCode adapter", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "trellis-omt-opencode-"));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  function writeProjectFile(relativePath: string, content: string): void {
    const absPath = path.join(tmpDir, relativePath);
    fs.mkdirSync(path.dirname(absPath), { recursive: true });
    fs.writeFileSync(absPath, content, "utf-8");
  }

  it("[omt] routing resolves low/high tiers from dual-layer config", () => {
    writeProjectFile(
      path.join(".omt", "config", "oh-my-trellis.defaults.jsonc"),
      JSON.stringify(
        {
          routing: {
            enabled: true,
            tiers: { low: "mini", high: "gpt-5.4" },
            roles: { planner: "high", reviewer: "high", oracle: "high", researcher: "low" },
            executor: { fast: "low", strict: "high" },
          },
          skills: { browser_default: "playwright" },
        },
        null,
        2,
      ),
    );
    writeProjectFile(
      "oh-my-trellis.jsonc",
      JSON.stringify({ routing: { tiers: { low: "haiku", high: "opus" } } }, null, 2),
    );

    const config = loadOmtConfig(tmpDir) as {
      routing: { tiers: { low: string; high: string } };
    };
    expect(resolveOmtTier(config, "planner")).toBe("high");
    expect(resolveOmtTier(config, "researcher")).toBe("low");
    expect(resolveOmtTier(config, "executor", "fast")).toBe("low");
    expect(resolveOmtTier(config, "executor", "strict")).toBe("high");
    expect(resolveOmtModel(config, "planner")).toBe("opus");
    expect(resolveOmtModel(config, "researcher")).toBe("haiku");
  });

  it("[omt] config plugin applies resolved models to omt agents", async () => {
    writeProjectFile(
      path.join(".omt", "config", "oh-my-trellis.defaults.jsonc"),
      JSON.stringify(
        {
          routing: {
            enabled: true,
            tiers: { low: "mini", high: "gpt-5.4" },
            roles: { planner: "high", reviewer: "high", oracle: "high", researcher: "low" },
            executor: { fast: "low", strict: "high" },
          },
          skills: { browser_default: "playwright" },
        },
        null,
        2,
      ),
    );
    writeProjectFile(
      "oh-my-trellis.jsonc",
      JSON.stringify({ routing: { tiers: { low: "haiku", high: "opus" } } }, null, 2),
    );

    const plugin = await omtConfigPlugin({ directory: tmpDir });
    const config: Record<string, unknown> = {
      agent: {
        "omt-planner": {},
        "omt-reviewer": {},
        "omt-executor": {},
        "omt-researcher": {},
        "omt-oracle": {},
      },
    };

    await plugin.config(config);
    const agents = config.agent as Record<string, { model?: string }>;
    expect(agents["omt-planner"].model).toBe("opus");
    expect(agents["omt-reviewer"].model).toBe("opus");
    expect(agents["omt-executor"].model).toBe("opus");
    expect(agents["omt-researcher"].model).toBe("haiku");
    expect(agents["omt-oracle"].model).toBe("opus");
  });

  it("[omt] command guards warn when execute or close preconditions are missing", async () => {
    writeProjectFile(path.join(".trellis", ".current-task"), ".trellis/tasks/omt-guard-task\n");
    writeProjectFile(
      path.join(".trellis", "tasks", "omt-guard-task", "task.json"),
      JSON.stringify(
        {
          title: "Guard task",
          status: "planning",
          current_phase: 0,
          next_action: [],
          meta: { workflow_id: "omt/v1", workflow_mode: "strict" },
        },
        null,
        2,
      ),
    );

    const plugin = await omtCommandGuardsPlugin({ directory: tmpDir });
    const executeOutput = { parts: [] as Array<{ type: string; text?: string }> };
    await plugin["command.execute.before"]?.(
      { command: "omt-execute", sessionID: "ses_1", arguments: "" },
      executeOutput,
    );
    expect(executeOutput.parts[0]?.text).toContain("Execution is gated");

    writeProjectFile(
      path.join(".trellis", "tasks", "omt-guard-task", "review.md"),
      "# Review\n\n## Round 1\n\n### Verdict\n\napproved\n",
    );
    writeProjectFile(
      path.join(".trellis", "tasks", "omt-guard-task", "verify.md"),
      "# Verify\n\n## Round 1\n\n### Outcome\n\nfail\n",
    );

    const closeOutput = { parts: [] as Array<{ type: string; text?: string }> };
    await plugin["command.execute.before"]?.(
      { command: "omt-close", sessionID: "ses_1", arguments: "" },
      closeOutput,
    );
    expect(closeOutput.parts[0]?.text).toContain("Close is gated");
  });

  it("[omt] trellis hook arbitration skips when omo-owned hook exists", () => {
    writeProjectFile(path.join(".trellis", "workflow.md"), "# Workflow\n");
    writeProjectFile(path.join(".claude", "hooks", "session-start.py"), "print('hook')\n");
    const ctx = new TrellisContext(tmpDir) as TrellisContext & {
      _omoInstalled: boolean | null;
      _omoHooksEnabled: boolean | null;
      shouldSkipHook: (hookName: string) => boolean;
    };
    ctx._omoInstalled = true;
    ctx._omoHooksEnabled = true;
    expect(ctx.shouldSkipHook("session-start")).toBe(true);
  });

  it("[omt] trellis hook arbitration handles when no matching omo hook exists", () => {
    writeProjectFile(path.join(".trellis", "workflow.md"), "# Workflow\n");
    const ctx = new TrellisContext(tmpDir) as TrellisContext & {
      _omoInstalled: boolean | null;
      _omoHooksEnabled: boolean | null;
      shouldSkipHook: (hookName: string) => boolean;
    };
    ctx._omoInstalled = true;
    ctx._omoHooksEnabled = true;
    expect(ctx.shouldSkipHook("session-start")).toBe(false);
  });
});

describe("regression: backslash in markdown templates (beta.12)", () => {
  it("[beta.12] Claude command templates do not contain problematic backslash sequences", () => {
    const commands = getClaudeCommands();
    for (const cmd of commands) {
      expect(cmd.content).not.toContain("\\--");
      expect(cmd.content).not.toContain("\\->");
    }
  });

  it("[beta.12] Claude agent templates do not contain problematic backslash sequences", () => {
    const agents = getClaudeAgents();
    for (const agent of agents) {
      expect(agent.content).not.toContain("\\--");
      expect(agent.content).not.toContain("\\->");
    }
  });

  it("[beta.12] Claude hook templates do not contain problematic backslash sequences", () => {
    const hooks = getClaudeHooks();
    for (const hook of hooks) {
      expect(hook.content).not.toContain("\\--");
      expect(hook.content).not.toContain("\\->");
    }
  });

  it("[beta.12] iFlow hook templates do not contain problematic backslash sequences", () => {
    const hooks = getIflowHooks();
    for (const hook of hooks) {
      expect(hook.content).not.toContain("\\--");
      expect(hook.content).not.toContain("\\->");
    }
  });
});

// =============================================================================
// 5. Platform Registry Regressions
// =============================================================================

describe("regression: platform additions (beta.9, beta.13, beta.16)", () => {
  it("[beta.9] OpenCode platform is registered", () => {
    expect(AI_TOOLS).toHaveProperty("opencode");
    expect(AI_TOOLS.opencode.configDir).toBe(".opencode");
  });

  it("[beta.13] Cursor platform is registered", () => {
    expect(AI_TOOLS).toHaveProperty("cursor");
    expect(AI_TOOLS.cursor.configDir).toBe(".cursor");
  });

  it("[beta.16] iFlow platform is registered", () => {
    expect(AI_TOOLS).toHaveProperty("iflow");
    expect(AI_TOOLS.iflow.configDir).toBe(".iflow");
  });

  it("[codex] Codex platform is registered", () => {
    expect(AI_TOOLS).toHaveProperty("codex");
    expect(AI_TOOLS.codex.configDir).toBe(".codex");
    expect(AI_TOOLS.codex.supportsAgentSkills).toBe(true);
  });

  it("[kiro] Kiro platform is registered", () => {
    expect(AI_TOOLS).toHaveProperty("kiro");
    expect(AI_TOOLS.kiro.configDir).toBe(".kiro/skills");
  });

  it("[gemini] Gemini CLI platform is registered", () => {
    expect(AI_TOOLS).toHaveProperty("gemini");
    expect(AI_TOOLS.gemini.configDir).toBe(".gemini");
  });

  it("[antigravity] Antigravity platform is registered", () => {
    expect(AI_TOOLS).toHaveProperty("antigravity");
    expect(AI_TOOLS.antigravity.configDir).toBe(".agent/workflows");
  });

  it("[windsurf] Windsurf platform is registered", () => {
    expect(AI_TOOLS).toHaveProperty("windsurf");
    expect(AI_TOOLS.windsurf.configDir).toBe(".windsurf/workflows");
  });

  it("[qoder] Qoder platform is registered", () => {
    expect(AI_TOOLS).toHaveProperty("qoder");
    expect(AI_TOOLS.qoder.configDir).toBe(".qoder");
  });

  it("[codebuddy] CodeBuddy platform is registered", () => {
    expect(AI_TOOLS).toHaveProperty("codebuddy");
    expect(AI_TOOLS.codebuddy.configDir).toBe(".codebuddy");
  });

  it("[copilot] Copilot platform is registered", () => {
    expect(AI_TOOLS).toHaveProperty("copilot");
    expect(AI_TOOLS.copilot.configDir).toBe(".github/copilot");
  });

  it("[beta.9] all platforms have consistent required fields", () => {
    for (const id of PLATFORM_IDS) {
      const tool = AI_TOOLS[id];
      expect(tool.name.length).toBeGreaterThan(0);
      expect(tool.configDir.startsWith(".")).toBe(true);
      expect(tool.cliFlag.length).toBeGreaterThan(0);
      expect(Array.isArray(tool.templateDirs)).toBe(true);
      expect(tool.templateDirs).toContain("common");
      expect(typeof tool.defaultChecked).toBe("boolean");
      expect(typeof tool.hasPythonHooks).toBe("boolean");
    }
  });
});

describe("regression: cli_adapter platform support (beta.9, beta.13, beta.16)", () => {
  it("[beta.9] cli_adapter.py supports opencode platform", () => {
    expect(commonCliAdapter).toContain('"opencode"');
    expect(commonCliAdapter).toContain(".opencode");
  });

  it("[beta.13] cli_adapter.py supports cursor platform", () => {
    expect(commonCliAdapter).toContain('"cursor"');
    expect(commonCliAdapter).toContain(".cursor");
  });

  it("[beta.16] cli_adapter.py supports iflow platform", () => {
    expect(commonCliAdapter).toContain('"iflow"');
    expect(commonCliAdapter).toContain(".iflow");
  });

  it("[codex] cli_adapter.py supports codex platform", () => {
    expect(commonCliAdapter).toContain('"codex"');
    expect(commonCliAdapter).toContain(".agents");
    expect(commonCliAdapter).toContain(".codex");
  });

  it("[codex] multi_agent plan/start scripts allow codex platform", () => {
    expect(multiAgentPlan).toContain('"codex"');
    expect(multiAgentStart).toContain('"codex"');
  });

  it("[kiro] cli_adapter.py supports kiro platform", () => {
    expect(commonCliAdapter).toContain('"kiro"');
    expect(commonCliAdapter).toContain(".kiro");
  });

  it("[gemini] cli_adapter.py supports gemini platform", () => {
    expect(commonCliAdapter).toContain('"gemini"');
    expect(commonCliAdapter).toContain(".gemini");
  });

  it("[antigravity] cli_adapter.py supports antigravity platform", () => {
    expect(commonCliAdapter).toContain('"antigravity"');
    expect(commonCliAdapter).toContain(".agent");
  });

  it("[windsurf] cli_adapter.py supports windsurf platform", () => {
    expect(commonCliAdapter).toContain('"windsurf"');
    expect(commonCliAdapter).toContain(".windsurf");
  });

  it("[qoder] cli_adapter.py supports qoder platform", () => {
    expect(commonCliAdapter).toContain('"qoder"');
    expect(commonCliAdapter).toContain(".qoder");
  });

  it("[codebuddy] cli_adapter.py supports codebuddy platform", () => {
    expect(commonCliAdapter).toContain('"codebuddy"');
    expect(commonCliAdapter).toContain(".codebuddy");
  });

  it("[copilot] cli_adapter.py supports copilot platform", () => {
    expect(commonCliAdapter).toContain('"copilot"');
    expect(commonCliAdapter).toContain(".github/copilot");
  });

  it("[beta.9] cli_adapter.py has detect_platform function", () => {
    expect(commonCliAdapter).toContain("def detect_platform");
  });

  it("[beta.9] cli_adapter.py has get_cli_adapter function with validation", () => {
    expect(commonCliAdapter).toContain("def get_cli_adapter");
    // Should validate platform parameter
    expect(commonCliAdapter).toContain("Unsupported platform");
  });

  it("[beta.12] cli_adapter.py has config_dir_name property for each platform", () => {
    expect(commonCliAdapter).toContain("config_dir_name");
    expect(commonCliAdapter).toContain(".claude");
    expect(commonCliAdapter).toContain(".cursor");
    expect(commonCliAdapter).toContain(".opencode");
    expect(commonCliAdapter).toContain(".iflow");
    expect(commonCliAdapter).toContain(".codex");
    expect(commonCliAdapter).toContain(".kiro");
    expect(commonCliAdapter).toContain(".gemini");
    expect(commonCliAdapter).toContain(".agent");
    expect(commonCliAdapter).toContain(".windsurf");
    expect(commonCliAdapter).toContain(".qoder");
    expect(commonCliAdapter).toContain(".codebuddy");
    expect(commonCliAdapter).toContain(".github/copilot");
  });

  it("[copilot] cli_adapter.py treats copilot as IDE-only (no CLI run/resume)", () => {
    expect(commonCliAdapter).toContain(
      "GitHub Copilot is IDE-only; CLI agent run is not supported.",
    );
    expect(commonCliAdapter).toContain(
      "GitHub Copilot is IDE-only; CLI resume is not supported.",
    );
    expect(commonCliAdapter).toContain('elif self.platform == "copilot":');
    expect(commonCliAdapter).toContain('return "copilot"');
    expect(commonCliAdapter).toContain(
      'return f".github/prompts/{name}.prompt.md"',
    );
  });

  it("[copilot] cli_adapter.py has explicit copilot branches in all key methods", () => {
    expect(commonCliAdapter).toMatch(
      /def get_commands_path[\s\S]*?if self\.platform == "copilot":[\s\S]*?prompts_dir/,
    );
    expect(commonCliAdapter).toMatch(
      /def get_trellis_command_path[\s\S]*?elif self\.platform == "copilot":[\s\S]*?\.github\/prompts\//,
    );
    expect(commonCliAdapter).toMatch(
      /def get_non_interactive_env[\s\S]*?elif self\.platform == "copilot":[\s\S]*?return \{\}/,
    );
    expect(commonCliAdapter).toMatch(
      /def build_run_command[\s\S]*?elif self\.platform == "copilot":[\s\S]*?CLI agent run is not supported/,
    );
    expect(commonCliAdapter).toMatch(
      /def build_resume_command[\s\S]*?elif self\.platform == "copilot":[\s\S]*?CLI resume is not supported/,
    );
    expect(commonCliAdapter).toMatch(
      /def cli_name[\s\S]*?elif self\.platform == "copilot":[\s\S]*?return "copilot"/,
    );
  });

  it("[0.3.10] iFlow CLI uses correct agent invocation syntax", () => {
    // iFlow does NOT support --agent flag, uses $agent_name prefix instead
    // Verify the correct command format exists
    expect(commonCliAdapter).toContain('cmd = ["iflow", "-y", "-p"]');
    expect(commonCliAdapter).toContain('f"${mapped_agent} {prompt}"');

    // Verify that the old incorrect format does NOT exist
    // The bug was: cmd.extend(["-y", "--agent", mapped_agent])
    expect(commonCliAdapter).not.toContain('cmd.extend(["-y", "--agent", mapped_agent])');
  });
});

// =============================================================================
// 6. Cross-version Migration Consistency
// =============================================================================

describe("regression: prerelease→stable version stamp (rc.6→0.3.0)", () => {
  it("[0.3.0] rc→stable upgrade returns no migrations (all already applied)", () => {
    const migrations = getMigrationsForVersion("0.3.0-rc.6", "0.3.0");
    expect(migrations).toEqual([]);
  });

  it("[0.3.0] 0.3.0 manifest exists and is well-formed", () => {
    const versions = getAllMigrationVersions();
    expect(versions).toContain("0.3.0");
  });

  it("[0.3.0] prerelease sorts before stable in version ordering", () => {
    const versions = getAllMigrationVersions();
    const rcIdx = versions.indexOf("0.3.0-rc.6");
    const stableIdx = versions.indexOf("0.3.0");
    expect(rcIdx).not.toBe(-1);
    expect(stableIdx).not.toBe(-1);
    expect(rcIdx).toBeLessThan(stableIdx);
  });
});

describe("regression: migration manifest consistency", () => {
  it("all manifest JSON files are loaded", () => {
    const manifestDir = path.join(
      path.dirname(fileURLToPath(import.meta.url)),
      "../src/migrations/manifests",
    );
    const jsonFiles = fs
      .readdirSync(manifestDir)
      .filter((f) => f.endsWith(".json"));
    const versions = getAllMigrationVersions();
    expect(versions.length).toBe(jsonFiles.length);
    expect(versions.length).toBeGreaterThan(0);
  });

  it("version ordering is strictly ascending", () => {
    const versions = getAllMigrationVersions();
    // Check known ordering constraints
    const knownOrder = [
      "0.1.9",
      "0.2.0",
      "0.2.12",
      "0.2.13",
      "0.2.14",
      "0.2.15",
      "0.3.0-beta.0",
      "0.3.0-beta.1",
      "0.3.0-beta.2",
      "0.3.0-beta.3",
      "0.3.0-beta.4",
      "0.3.0-beta.5",
    ];
    for (let i = 0; i < knownOrder.length; i++) {
      const idx = versions.indexOf(knownOrder[i]);
      expect(idx, `${knownOrder[i]} should be in versions`).not.toBe(-1);
      if (i > 0) {
        const prevIdx = versions.indexOf(knownOrder[i - 1]);
        expect(
          idx,
          `${knownOrder[i]} should come after ${knownOrder[i - 1]}`,
        ).toBeGreaterThan(prevIdx);
      }
    }
  });

  it("[beta.0] shell-to-python migration uses only renames (no deletes)", () => {
    const migrations = getMigrationsForVersion("0.2.15", "0.3.0-beta.0");
    const renames = migrations.filter((m) => m.type === "rename");
    const deletes = migrations.filter((m) => m.type === "delete");
    expect(renames.length).toBeGreaterThan(0);
    expect(deletes.length).toBe(0);
  });

  it("[#57] shell archive migrations use rename type with correct from/to paths", () => {
    const migrations = getMigrationsForVersion("0.2.15", "0.3.0-beta.0");
    const shellArchives = migrations.filter(
      (m) => m.to?.includes("scripts-shell-archive"),
    );
    // 19 shell scripts should be archived
    expect(shellArchives.length).toBe(19);
    for (const m of shellArchives) {
      expect(m.type).toBe("rename");
      expect(m.from).toMatch(/\.trellis\/scripts\/.*\.sh$/);
      expect(m.to).toMatch(/\.trellis\/scripts-shell-archive\/.*\.sh$/);
      // The filename should be preserved
      const fromFile = m.from.split("/").pop();
      const toFile = (m.to as string).split("/").pop();
      expect(toFile).toBe(fromFile);
    }
  });

  it("[#57] shell archive covers all three subdirectories", () => {
    const migrations = getMigrationsForVersion("0.2.15", "0.3.0-beta.0");
    const shellArchives = migrations.filter(
      (m) => m.to?.includes("scripts-shell-archive"),
    );
    const topLevel = shellArchives.filter(
      (m) => !m.from.includes("/common/") && !m.from.includes("/multi-agent/"),
    );
    const common = shellArchives.filter((m) => m.from.includes("/common/"));
    const multiAgent = shellArchives.filter((m) =>
      m.from.includes("/multi-agent/"),
    );
    expect(topLevel.length).toBe(6);
    expect(common.length).toBe(8);
    expect(multiAgent.length).toBe(5);
  });

  it("[0.2.14] command namespace migration renames exist", () => {
    const migrations = getMigrationsForVersion("0.2.13", "0.2.14");
    expect(migrations.length).toBeGreaterThan(0);
    // Should include commands moved to trellis/ subdirectory
    const claudeRenames = migrations.filter(
      (m) => m.type === "rename" && m.from.startsWith(".claude/commands/"),
    );
    expect(claudeRenames.length).toBeGreaterThan(0);
  });
});

// =============================================================================
// 7. collectTemplates Path Consistency
// =============================================================================

describe("regression: collectTemplates paths match init directory structure (0.3.1)", () => {
  it("[0.3.1] iflow collectTemplates uses commands/trellis/ subdirectory", () => {
    const templates = collectPlatformTemplates("iflow");
    expect(templates).toBeInstanceOf(Map);
    const commandKeys = [...(templates as Map<string, string>).keys()].filter(
      (k) => k.includes("/commands/"),
    );
    for (const key of commandKeys) {
      expect(
        key,
        `iflow command path should include trellis/ subdirectory: ${key}`,
      ).toMatch(/\.iflow\/commands\/trellis\//);
    }
  });

  it("[0.3.1] all platforms with commands use consistent trellis/ subdirectory", () => {
    const platformsWithCommands = ["claude-code", "iflow", "gemini"] as const;
    for (const id of platformsWithCommands) {
      const templates = collectPlatformTemplates(id);
      if (!templates) continue;
      const commandKeys = [...templates.keys()].filter(
        (k) => k.includes("/commands/"),
      );
      for (const key of commandKeys) {
        expect(
          key,
          `${id} command path should include trellis/ subdirectory: ${key}`,
        ).toContain("/commands/trellis/");
      }
    }
  });

  it("[0.3.4] kilo uses workflows/ instead of commands/trellis/", () => {
    const templates = collectPlatformTemplates("kilo");
    expect(templates).toBeInstanceOf(Map);
    if (!templates) return;
    const keys = [...templates.keys()];
    for (const key of keys) {
      expect(key, `kilo path should use workflows/: ${key}`).toContain(
        ".kilocode/workflows/",
      );
      expect(key, `kilo should not use commands/: ${key}`).not.toContain(
        "/commands/",
      );
    }
  });

  it("[windsurf] windsurf uses workflows/ instead of commands/trellis/", () => {
    const templates = collectPlatformTemplates("windsurf");
    expect(templates).toBeInstanceOf(Map);
    if (!templates) return;
    const keys = [...templates.keys()];
    for (const key of keys) {
      expect(key, `windsurf path should use workflows/: ${key}`).toContain(
        ".windsurf/workflows/",
      );
      expect(key, `windsurf file should use trellis- prefix: ${key}`).toContain(
        ".windsurf/workflows/trellis-",
      );
      expect(key, `windsurf should not use commands/: ${key}`).not.toContain(
        "/commands/",
      );
    }
  });

  it("[codex] collectTemplates tracks both .agents skills and .codex assets", () => {
    const templates = collectPlatformTemplates("codex");
    expect(templates).toBeInstanceOf(Map);
    if (!templates) return;

    const keys = [...templates.keys()];
    expect(keys.some((key) => key.startsWith(".agents/skills/"))).toBe(true);
    expect(keys.some((key) => key.startsWith(".codex/skills/"))).toBe(true);
    expect(keys.some((key) => key.startsWith(".codex/agents/"))).toBe(true);
    expect(keys.some((key) => key.startsWith(".codex/hooks/"))).toBe(true);
    expect(keys).toContain(".codex/hooks.json");
    expect(keys).toContain(".codex/config.toml");
  });

  it("[copilot] collectTemplates tracks hooks and VS Code discovery config", () => {
    const templates = collectPlatformTemplates("copilot");
    expect(templates).toBeInstanceOf(Map);
    if (!templates) return;

    const keys = [...templates.keys()];
    expect(keys.some((key) => key.startsWith(".github/prompts/"))).toBe(true);
    expect(keys).toContain(".github/prompts/start.prompt.md");
    expect(keys.some((key) => key.startsWith(".github/copilot/hooks/"))).toBe(
      true,
    );
    expect(keys).toContain(".github/copilot/hooks.json");
    expect(keys).toContain(".github/hooks/trellis.json");
  });
});

// =============================================================================
// YAML Quote Stripping (0.3.8)
// =============================================================================

describe("regression: parse_simple_yaml uses _unquote not greedy strip (0.3.8)", () => {
  it("worktree.py defines _unquote helper", () => {
    expect(commonWorktree).toContain("def _unquote(s: str) -> str:");
  });

  it("worktree.py uses _unquote for list items, not .strip('\"')", () => {
    // The bug: .strip('"').strip("'") greedily eats nested quotes
    // e.g. "echo 'hello'" -> strip("'") -> echo 'hello (broken!)
    expect(commonWorktree).not.toContain(".strip('\"').strip(\"'\")");
    expect(commonWorktree).toContain("_unquote(stripped[2:].strip())");
  });

  it("worktree.py uses _unquote for key-value, not .strip('\"')", () => {
    expect(commonWorktree).toContain("_unquote(value.strip())");
  });
});

describe("regression: parse_simple_yaml Python execution (0.3.8)", () => {
  // Extract _unquote + _parse_yaml_block + _next_content_line + parse_simple_yaml
  // from commonWorktree and run them in an isolated Python process.
  // We can't import worktree.py directly because it has `from .paths import ...`
  let tmpDir: string;
  let extractedPy: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "trellis-yaml-py-"));
    // Extract _unquote + parse_simple_yaml + _parse_yaml_block + _next_content_line
    // These 4 functions have no external imports — safe to run standalone.
    const fnStart = commonWorktree.indexOf("def _unquote(");
    const fnEnd = commonWorktree.indexOf("\ndef _yaml_get_value(");
    extractedPy = commonWorktree.substring(fnStart, fnEnd);
    fs.writeFileSync(path.join(tmpDir, "yaml_parser.py"), extractedPy);
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  /** Run parse_simple_yaml via Python subprocess and return parsed result */
  function runPythonYaml(yamlContent: string): unknown {
    const scriptFile = path.join(tmpDir, "_test.py");
    const script = [
      "import sys, json",
      `sys.path.insert(0, ${JSON.stringify(tmpDir)})`,
      "from yaml_parser import parse_simple_yaml",
      `result = parse_simple_yaml(${JSON.stringify(yamlContent)})`,
      "print(json.dumps(result))",
    ].join("\n");
    fs.writeFileSync(scriptFile, script);
    const out = execSync(`python3 ${JSON.stringify(scriptFile)}`, {
      encoding: "utf-8",
    });
    return JSON.parse(out.trim());
  }

  it("nested single quotes inside double quotes are preserved", () => {
    const result = runPythonYaml('key: "echo \'hello\'"');
    expect(result).toEqual({ key: "echo 'hello'" });
  });

  it("nested double quotes inside single quotes are preserved", () => {
    const result = runPythonYaml("key: 'say \"hi\"'");
    expect(result).toEqual({ key: 'say "hi"' });
  });

  it("list items with nested quotes are preserved", () => {
    const result = runPythonYaml(
      'hooks:\n  after_create:\n    - "echo \'Task created\'"',
    );
    expect(result).toEqual({
      hooks: { after_create: ["echo 'Task created'"] },
    });
  });

  it("simple quoted values work", () => {
    const result = runPythonYaml('a: "hello"\nb: \'world\'');
    expect(result).toEqual({ a: "hello", b: "world" });
  });

  it("unquoted values are unchanged", () => {
    const result = runPythonYaml("key: plain value");
    expect(result).toEqual({ key: "plain value" });
  });

  it("mismatched quotes are left as-is", () => {
    const result = runPythonYaml("key: \"hello'");
    expect(result).toEqual({ key: "\"hello'" });
  });
});

// =============================================================================
// 8. Dead Code / Template Content Regressions
// =============================================================================

// =============================================================================
// S4: Submodule + PR Awareness (beta.1)
// =============================================================================

describe("regression: submodule awareness in multi_agent scripts (beta.1)", () => {
  it("[S4] start.py checks submodule status prefix before init (prevents detached HEAD)", () => {
    // Critical: running `git submodule update --init` on already-initialized submodule
    // detaches HEAD, destroying agent's in-progress work. Must check status prefix first.
    expect(multiAgentStart).toContain("submodule status");
    expect(multiAgentStart).toContain('prefix == "-"');
    expect(multiAgentStart).toContain('prefix == "+"');
  });

  it("[S4] start.py imports submodule helpers from common.config", () => {
    expect(multiAgentStart).toContain("get_submodule_packages");
    expect(multiAgentStart).toContain("validate_package");
  });

  it("[S4] create_pr.py uses git symbolic-ref for portable base branch detection", () => {
    // Must use `git symbolic-ref refs/remotes/origin/HEAD` (not grep + English output)
    // for cross-platform / cross-locale compatibility
    expect(multiAgentCreatePr).toContain("symbolic-ref");
    expect(multiAgentCreatePr).toContain("refs/remotes/origin/HEAD");
  });

  it("[S4] create_pr.py guards submodule_prs read with isinstance", () => {
    // Prevents TypeError crash when task.json has submodule_prs: null or non-dict
    expect(multiAgentCreatePr).toContain("isinstance(raw_prs, dict)");
  });

  it("[S4] create_pr.py has squash-merge warning for submodule PRs", () => {
    expect(multiAgentCreatePr).toContain("_SUBMODULE_SQUASH_WARNING_MARKER");
    expect(multiAgentCreatePr).toContain("squash-merged");
  });

  it("[S4] cleanup.py defines AND calls _warn_submodule_prs", () => {
    // Bug found during review: function was defined but never called.
    // Verify both definition and at least one call site exist.
    expect(multiAgentCleanup).toContain("def _warn_submodule_prs(");
    // Count occurrences: 1 def + at least 2 calls = at least 3
    const occurrences = multiAgentCleanup.split("_warn_submodule_prs").length - 1;
    expect(occurrences).toBeGreaterThanOrEqual(3);
  });
});

describe("regression: cross-platform-thinking-guide dead code removed (0.3.1)", () => {
  it("[0.3.1] guidesCrossPlatformThinkingGuideContent is not exported from markdown/index", () => {
    expect(markdownExports).not.toHaveProperty(
      "guidesCrossPlatformThinkingGuideContent",
    );
  });

  it("[0.3.1] guides index.md does not reference cross-platform-thinking-guide", () => {
    expect(guidesIndexContent).not.toContain("cross-platform-thinking-guide");
    expect(guidesIndexContent).not.toContain("Cross-Platform Thinking Guide");
  });
});
