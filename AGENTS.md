# Repository Guidelines

## Project Structure & Module Organization

`PLAN.md` is the architectural source of truth; update it when boundaries, APIs, or delivery phases change. Use `frontend/` for React and TypeScript, `backend/` for FastAPI, an assets directory for samples, and subsystem test directories. Separate UI, translations, and API clients; keep backend routes, models, adapters, and services distinct.

## Task History in TODO.md

The user launches project implementation tasks in `TODO.md` by writing the identifier, title, and `Ask`. Agents must not create tasks, rewrite asks, or infer work items. Keep identifiers sequential (`TASK-001`, `TASK-002`, and so on) without reuse or renumbering. Before implementation, confirm the entry exists. After verification, add its brief `Answer`.

Starting with `TASK-004`, every completed task must also include two sections immediately after the answer:

- `Automated test` gives the developer copy-pasteable commands and the expected successful result. Include all tests relevant to the task.
- `Developer demo` gives the local startup commands, URLs or interactions, and the visible behavior the developer should verify manually. For backend-only work, a browser-visible endpoint or API documentation walkthrough is an acceptable visual demo.

Use this format:

```markdown
## TASK-004: Short descriptive title

**Ask:** Brief user-written summary of what is requested.

**Answer:** Brief agent-written summary of what was implemented, including verification.

**Automated test:**

1. Run `command` from the documented directory.
2. Confirm the expected tests pass.

**Developer demo:**

1. Start the application locally with `command`.
2. Open the documented local URL and confirm the expected visible behavior.
```

Keep answers and test/demo instructions factual and synchronized with delivered work. Do not record commands that were not verified. If an implementation task is missing, ask the user to add it. User instructions may explicitly exempt agent-behavior or documentation maintenance from this process.

Finally, **when confirmed by the user**, insert a new task depending on the prompted instructions, by respecting the previous rules about the tasks, and then start to work on it, tracking progress with the TodoWrite tool. Use the `/todo-task` skill (`.claude/skills/todo-task/SKILL.md`) for this repetitive flow.
## Build, Test, and Development Commands

The shared command contract is introduced as the application is scaffolded:

- `make setup` installs Python and Node dependencies.
- `make dev` runs Vite and FastAPI for development.
- `make test` runs the backend, frontend, production-integration, Playwright end-to-end, and invariant verification suites.
- `make run` builds the frontend and serves the complete application through FastAPI on `127.0.0.1`.

## Coding Style & Testing Guidelines

Use four-space indentation, type annotations, `snake_case` functions/modules, and `PascalCase` classes in Python. Use two-space indentation, strict typing, `PascalCase` React components, and `camelCase` functions in TypeScript. Keep API routes under `/api/v1/`; place visible text in German and Italian translation dictionaries.

Use pytest for FastAPI, Vitest with React Testing Library for components, and Playwright end to end. Name tests after behavior, such as `test_rejects_oversized_upload`, and cover every changed behavior.

## Commits, Pull Requests & Security

Use short imperative commit subjects, for example `Add calendar upload validation`. Pull requests should explain behavior, include test evidence, link applicable issues, mention plan or API changes, and show screenshots for UI updates.

Do not pull from or publish to GitHub automatically. Never create or update remotes, pull or push branches or tags, modify pull requests, or create releases. Leave work local for review. If publication is necessary, pause before any GitHub mutation, explain why, and let the user publish manually. Read-only inspection is allowed.

Enforce the 10 MiB upload limit, sanitize filenames, bind locally to `127.0.0.1`, and retain no uploaded files. Never log schedule contents or commit secrets, generated calendars, or local environment files.
