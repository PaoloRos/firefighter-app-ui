---
name: todo-task
description: >-
  Use when the user has confirmed a new implementation task to add to TODO.md and
  wants work to start on it. Appends a sequentially numbered TASK entry with the
  user's verbatim Ask, then implements it end to end per AGENTS.md, finishing with
  the Answer, Automated test, and Developer demo sections. Triggers: "add a task",
  "new TODO task", "create TASK-0NN and start", "log this in TODO.md and do it".
---

# Add a TODO.md task and run it

This skill covers the repetitive flow of registering a new implementation task in
`TODO.md` and carrying it out. Only run it once the user has explicitly confirmed
the task should be added.

## 1. Append the task entry

- Open `TODO.md` and find the highest existing `TASK-0NN` identifier.
- Add the new entry with the next sequential identifier. Never reuse, renumber, or
  reorder existing identifiers.
- Use this structure:

  ```markdown
  ## TASK-0NN: Short descriptive title

  **Ask:** Verbatim user-written summary of what is requested.
  ```

- The Ask text comes from the user's prompt as written. Do not invent tasks,
  rewrite the Ask, split it, or infer additional work items.
- Save, then re-read `TODO.md` to confirm the entry is present and well formed.

## 2. Implement the task

- Follow `AGENTS.md` for structure, coding style, testing, commit, and security
  rules.
- Track progress with the TodoWrite tool: draft the steps, keep one
  `in_progress`, tick items off as they land.
- Keep working the task through to verification — do not stop at a partial
  implementation.

## 3. Record the outcome in TODO.md

Immediately after the `**Ask:**` line, once work is verified, add:

```markdown
**Answer:** Brief agent-written summary of what was implemented, including verification.

**Automated test:**

1. Run `command` from the documented directory.
2. Confirm the expected tests pass.

**Developer demo:**

1. Start the application locally with `command`.
2. Open the documented local URL and confirm the expected visible behavior.
```

- Only record commands you actually ran and verified.
- Keep the Answer, Automated test, and Developer demo synchronized with the
  delivered work.
- For backend-only work, a browser-visible endpoint or API docs walkthrough is an
  acceptable Developer demo.
