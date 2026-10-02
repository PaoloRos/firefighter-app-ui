# Complete Claude-to-Codex repository migration

## Context

The repository has a mixed agent setup: Codex-native [AGENTS.md](AGENTS.md) and
[`.agents/skills`](.agents/skills/) coexist with tracked Claude instructions,
settings, and duplicate skills. A registered worktree also lives below the
ignored `.claude/worktrees/` directory and contains an uncommitted `Makefile`
change plus untracked Codex skills.

This migration makes the active workflow Codex-native without changing the
application architecture in [PLAN.md](PLAN.md), application source, public APIs,
database schema, or product behavior. Historical Claude references remain in
[IMPLEMENTATION.md](IMPLEMENTATION.md) and Git history.

## Decisions (confirmed with the user)

| Decision | Confirmed choice |
|---|---|
| Claude compatibility | Remove active Claude instructions, settings, and duplicate skills. |
| Historical attribution | Preserve history and describe the tool timeline accurately in the README. |
| Commit attribution | Use `AI-Assisted-By: OpenAI Codex (<exact session model>)`, falling back to `AI-Assisted-By: OpenAI Codex` when the model is not exposed. |
| Permissions | Add project `.codex/config.toml` plus tested `.codex/rules`. |
| Dirty Claude worktree | Relocate it to `/Users/paolorossi/Develop/firefighter-app-ui-worktrees/tests` without changing its branch or working tree. |

## Scope / non-goals

- Do not rewrite, amend, or reattribute existing commits.
- Do not commit, push, pull, fetch, create tags, modify remotes, or mutate GitHub.
- Do not change [PLAN.md](PLAN.md) or application code.
- Do not generate an event plan; only migrate the `$event-plan` skill wording.

## Implementation

1. Record the `worktree-tests` branch, status, and binary diff checksum. Move the
   registered `.claude/worktrees/tests` checkout to the confirmed neutral sibling
   path with `git worktree move`, then prove the recorded state is unchanged.
2. Queue `TASK-047` in [TODO.md](TODO.md) with the confirmed verbatim ask.
3. Remove `CLAUDE.md`, root `SKILL.md`, `.claude/settings*.json`, and duplicate
   `.claude/skills/`. Remove the corresponding Claude-only ignore rules.
4. Update [AGENTS.md](AGENTS.md) to reference `$ai-plan`, `$todo-task`, and
   `$event-plan`; use tool-neutral Codex progress tracking; retain repository
   workflow and security rules; require confirmation before a local commit; and
   add the confirmed `AI-Assisted-By` trailer policy.
5. Refine the three [`.agents/skills`](.agents/skills/) descriptions and Codex
   invocation wording. Preserve task-history and event-plan behavior. Make
   `$ai-plan` return `<proposed_plan>` without writing when Codex is in a
   non-mutating Plan mode.
6. Add [`.codex/config.toml`](.codex/config.toml) with `approval_policy =
   "on-request"` and `sandbox_mode = "workspace-write"`, without pinning a model,
   personality, plugin, or search mode.
7. Add [`.codex/rules/default.rules`](.codex/rules/default.rules). Allow the
   established build, run, test, verification, backend pytest/pip-check, and
   read-only Git commands. Leave setup, installs, staging, and commits unmatched.
   Forbid remote synchronization, tags, mutating remote configuration, and all
   `gh` commands. Include inline matching examples and safe alternatives.
8. Update the README credit with the accurate Codex–Claude–Codex timeline.
9. Verify Codex config, instruction and skill discovery, command-rule decisions,
   active Claude cleanup, worktree integrity, Markdown whitespace, and the
   application invariant suite.
10. Append the verified `TASK-047` record to [IMPLEMENTATION.md](IMPLEMENTATION.md)
    and restore the empty queue marker in [TODO.md](TODO.md).

## Proposed TODO.md task

```markdown
## TASK-047: Migrate repository agent tooling from Claude to Codex

**Ask:** Replace the repository's active Claude Code instructions, skills, settings, and command policies with Codex-native AGENTS.md, .agents/skills, .codex/config.toml, and .codex/rules conventions; preserve historical records; safely relocate the dirty registered Claude worktree without losing its branch or changes; update AI attribution and documentation; and verify Codex instruction, skill, configuration, and rule discovery.
```

## Files

| File | Change |
|---|---|
| [AGENTS.md](AGENTS.md) | Codex-native instructions, skills, Git policy, and attribution. |
| [AI-PLAN.md](AI-PLAN.md) | Replace the stale plan with this approved migration plan. |
| [`.agents/skills`](.agents/skills/) | Refine the three repository skills for Codex. |
| [`.codex/config.toml`](.codex/config.toml) | Add repository sandbox and approval defaults. |
| [`.codex/rules/default.rules`](.codex/rules/default.rules) | Add tested command policy. |
| [.gitignore](.gitignore) | Remove Claude-only local-state rules. |
| [README.md](README.md) | Record the accurate AI-tool timeline. |
| `CLAUDE.md`, `SKILL.md`, `.claude/**` | Remove active Claude surfaces after preserving the worktree. |
| [TODO.md](TODO.md), [IMPLEMENTATION.md](IMPLEMENTATION.md) | Queue and archive `TASK-047`. |

## Verification

- Compare the worktree branch, dirty status, and binary diff hash before and
  after relocation; confirm `git worktree list --porcelain` contains no
  `.claude` worktree.
- Run Codex with `--strict-config` and inspect `codex debug prompt-input` for
  `AGENTS.md` and all three `.agents/skills`, with no `.claude` skill paths.
- Run `codex execpolicy check` for an allowed `make test`, forbidden `git push`
  and `gh`, and unmatched `make setup`.
- Confirm the legacy paths are absent from the working tree; before a future
  commit, `git ls-files --deleted` should list the tracked removals, and after
  that commit `git ls-files .claude CLAUDE.md SKILL.md` should be empty. Active
  Claude terminology may remain only in this migration plan, the README
  history, and `IMPLEMENTATION.md`.
- Run `git diff --check` and `make verify` successfully.

## Risks / notes

- Codex command rules are experimental, so [AGENTS.md](AGENTS.md) remains the
  authoritative behavioral policy.
- `allow` rules are deliberately narrow because they authorize execution outside
  the sandbox. Dependency installation and Git writes continue to require
  approval.
- The relocated worktree remains dirty by design; its `Makefile` change is not
  part of this migration.
