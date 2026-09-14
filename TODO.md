# Implementation Task Queue

This file holds implementation tasks that are pending or in progress. The user
adds a task by writing its identifier, title, and `Ask`. The implementing agent
does not create tasks, rewrite asks, or infer work items.

- Identifiers are sequential (`TASK-036`, `TASK-037`, and so on) and are never
  reused or renumbered. Look up the highest existing identifier in
  [`IMPLEMENTATION.md`](IMPLEMENTATION.md), which is the running counter.
- Before implementation, confirm the entry exists here.
- After a task is completed and verified, the agent moves it out of this file:
  the full record (`Ask`, `Answer`, and — from `TASK-004` onward — `Automated
  test` and `Developer demo`) is appended to [`IMPLEMENTATION.md`](IMPLEMENTATION.md)
  and the entry is removed from this queue.

Queue a task with:

```markdown
## TASK-0NN: Short descriptive title

**Ask:** Brief user-written summary of what is requested.
```

## Pending tasks

_None queued._
