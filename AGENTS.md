# Repository Guidelines

## Project Structure & Module Organization

`PLAN.md` is the architectural source of truth. Keep it synchronized with changes to system boundaries, public APIs, or delivery phases. The planned application uses `frontend/` for React and TypeScript, `backend/` for FastAPI, version-controlled sample files under an assets directory, and tests beside their subsystem or in dedicated test directories. Separate UI components, translation dictionaries, and API clients on the frontend; keep routes, request models, converter adapters, and services distinct on the backend.

## Task History in TODO.md

Every implementation task must begin with an entry in root-level `TODO.md`. If it is absent, create it before changing implementation files. Treat it as a concise, append-only history, not a general backlog. Assign identifiers sequentially as `TASK-001`, `TASK-002`, and so on. Never reuse or renumber an existing identifier. Write the request before implementation and complete the answer after testing:

```markdown
## TASK-001: Short descriptive title

**Ask:** Brief summary of what was requested.

**Answer:** Brief summary of what was implemented, including verification.
```

Keep both fields factual, brief, and synchronized with delivered work.

## Build, Test, and Development Commands

The planned command contract becomes available as the application is scaffolded:

- `make setup` installs Python and Node dependencies.
- `make dev` runs Vite and FastAPI for development.
- `make test` runs backend, frontend, and integration tests.
- `make run` builds and serves the app on `127.0.0.1`.

## Coding Style & Testing Guidelines

Use four-space indentation, type annotations, `snake_case` functions/modules, and `PascalCase` classes in Python. Use two-space indentation, strict typing, `PascalCase` React components, and `camelCase` functions in TypeScript. Keep API routes under `/api/v1/`; place visible text in German and Italian translation dictionaries.

Use pytest for FastAPI, Vitest with React Testing Library for components, and Playwright for end-to-end tests. Name tests after behavior, such as `test_rejects_oversized_upload`. Cover every changed behavior; no arbitrary coverage percentage is required.

## Commits, Pull Requests & Security

Use short imperative commit subjects, for example `Add calendar upload validation`. Pull requests should explain behavior, include test evidence, link issues when applicable, mention `PLAN.md` or API contract changes, and include screenshots for visible UI updates.

Enforce the 10 MiB upload limit, sanitize filenames, bind locally to `127.0.0.1`, and retain no uploaded files. Never log schedule contents or commit secrets, generated calendars, or local environment files.
