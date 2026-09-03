---
name: todo-task
description: >-
  Use when the user has confirmed a new implementation task to add to TODO.md and
  wants work to start on it. Appends a sequentially numbered TASK entry with the
  user's verbatim Ask to the TODO.md queue, implements it end to end per
  AGENTS.md, then records the finished task (Ask, Answer, Automated test,
  Developer demo) in IMPLEMENTATION.md and removes it from TODO.md. Triggers:
  "add a task", "new TODO task", "create TASK-0NN and start", "log this and do it".
---

# Add a TODO.md task and run it

This skill covers the repetitive flow of queuing a new implementation task in
`TODO.md`, carrying it out, and moving the finished record into
`IMPLEMENTATION.md`. Only run it once the user has explicitly confirmed the task
should be added.

`TODO.md` is the queue of pending or in-progress tasks. `IMPLEMENTATION.md` is
the permanent history of completed tasks and holds the running task counter.

## 1. Append the task entry to TODO.md

- Find the highest existing `TASK-0NN` identifier in `IMPLEMENTATION.md` (the
  running counter); also check `TODO.md` for any already-queued entries.
- Add the new entry to `TODO.md` with the next sequential identifier. Never
  reuse, renumber, or reorder existing identifiers.
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

## 3. Record the outcome in IMPLEMENTATION.md

Once work is verified, append the full record to the end of `IMPLEMENTATION.md`,
keeping the same `## TASK-0NN` heading and the verbatim `**Ask:**` line, followed
by:

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

## 4. Remove the task from TODO.md

- Delete the completed entry from `TODO.md` so the queue only lists pending or
  in-progress work.
- If no tasks remain queued, leave the placeholder line (`_None queued._`) under
  the pending-tasks heading.
