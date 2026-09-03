# Skills for repetitive work

The recurring "add a task to `TODO.md` and run it" procedure now lives as an
invocable Claude Code skill at
[`.claude/skills/todo-task/SKILL.md`](.claude/skills/todo-task/SKILL.md).

Invoke it with `/todo-task`, or Claude will load it automatically when the user
confirms a new implementation task for `TODO.md`. The skill queues the task in
`TODO.md`, implements it, then records the finished task in `IMPLEMENTATION.md`
and removes it from the queue.
