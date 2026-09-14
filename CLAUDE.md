# Project instructions

See @AGENTS.md for repository structure, the task process (`TODO.md` queue,
`IMPLEMENTATION.md` history), build/test commands, coding style, and
commit/security rules.

See @PLAN.md for the architectural source of truth.

For the recurring "add a task to `TODO.md` and run it" flow, use the `/todo-task`
skill (`.claude/skills/todo-task/SKILL.md`). Completed tasks are recorded in
`IMPLEMENTATION.md` and removed from `TODO.md`.

When asked to plan the work described in `TODO.md`, use the `/ai-plan` skill
(`.claude/skills/ai-plan/SKILL.md`). It writes the plan to `AI-PLAN.md`,
replacing the previous contents, and stops there — planning never edits code or
queues a task.

## Commits

Every commit you create must end with a blank line followed by exactly:

```
Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
```

This is the last line of the message, after any body text. Do not add it to
commits the user makes without your involvement. Follow the `AGENTS.md` rule that
GitHub pushes and other remote mutations stay manual — never push, amend published
history, or touch remotes on your own.
