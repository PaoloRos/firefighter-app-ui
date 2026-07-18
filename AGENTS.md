# Repository Guidelines

## Project Structure & Module Organization

`PLAN.md` is the architectural source of truth; update it when boundaries, APIs, or delivery phases change. Use `frontend/` for React and TypeScript, `backend/` for FastAPI, an assets directory for samples, and subsystem test directories. Separate UI, translations, and API clients; keep backend routes, models, adapters, and services distinct.

## Task History in TODO.md

The user launches each implementation task in `TODO.md`. The user owns the identifier, title, and `Ask`; agents must not create tasks, rewrite asks, or infer new work items. Treat the file as an append-only implementation history, not a general backlog. Identifiers are sequential (`TASK-001`, `TASK-002`, and so on) and must never be reused or renumbered.

Before implementing, confirm that the requested task already exists with its user-written `Ask`. After implementation and verification, the agent adds or completes only the brief `Answer`:

```markdown
## TASK-001: Short descriptive title

**Ask:** Brief user-written summary of what is requested.

**Answer:** Brief agent-written summary of what was implemented, including verification.
```

Keep the answer factual and synchronized with delivered work. If the user has not added the task to `TODO.md`, ask them to do so before implementation rather than creating the entry on their behalf.

## Build, Test, and Development Commands

The planned command contract becomes available as the application is scaffolded:

- `make setup` installs Python and Node dependencies.
- `make dev` runs Vite and FastAPI for development.
- `make test` runs backend, frontend, and integration tests.
- `make run` builds and serves the app on `127.0.0.1`.

## Coding Style & Testing Guidelines

Use four-space indentation, type annotations, `snake_case` functions/modules, and `PascalCase` classes in Python. Use two-space indentation, strict typing, `PascalCase` React components, and `camelCase` functions in TypeScript. Keep API routes under `/api/v1/`; place visible text in German and Italian translation dictionaries.

Use pytest for FastAPI, Vitest with React Testing Library for components, and Playwright end to end. Name tests after behavior, such as `test_rejects_oversized_upload`, and cover every changed behavior.

## Commits, Pull Requests & Security

Use short imperative commit subjects, for example `Add calendar upload validation`. Pull requests should explain behavior, include test evidence, link applicable issues, mention plan or API changes, and show screenshots for UI updates.

Enforce the 10 MiB upload limit, sanitize filenames, bind locally to `127.0.0.1`, and retain no uploaded files. Never log schedule contents or commit secrets, generated calendars, or local environment files.
