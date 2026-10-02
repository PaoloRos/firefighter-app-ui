# Repository Guidelines

Explicit user instructions take precedence over workflow-skill guidance when
they conflict.

## Project structure and sources of truth

`PLAN.md` is the architectural source of truth. Update it when system
boundaries, public APIs, or delivery phases change. Use `frontend/` for React
and TypeScript, `backend/` for FastAPI, `assets/` for samples, and subsystem
test directories. Keep frontend UI, translations, and API clients separate;
keep backend routes, models, adapters, and services distinct.

## Task queue and repository skills

`TODO.md` is the queue of pending or in-progress implementation tasks;
`IMPLEMENTATION.md` is the permanent history. The user supplies each task's
identifier, title, and verbatim `Ask`. Identifiers are sequential and are never
reused or renumbered; the highest identifier in `IMPLEMENTATION.md` is the
running counter. Before implementation, confirm the entry exists in `TODO.md`.
After verification, append the full record to `IMPLEMENTATION.md` and remove it
from `TODO.md`.

Starting with `TASK-004`, every completed record must place these sections
after `Answer`: `Automated test` with commands actually run and their expected
successful result, and `Developer demo` with local commands, URLs or
interactions, and visible behavior. Backend-only work may use an API endpoint
or API documentation walkthrough.

Use the repository skills when their descriptions match:

- `$ai-plan` (`.agents/skills/ai-plan/SKILL.md`) plans a brief from `TODO.md`
  without starting implementation.
- `$todo-task` (`.agents/skills/todo-task/SKILL.md`) queues a confirmed task,
  implements it end to end, verifies it, and archives its record.
- `$event-plan` (`.agents/skills/event-plan/SKILL.md`) creates or updates the
  event-plan workbook from `event-guideline.md` and its named sources.

For non-trivial implementation, keep a concise progress plan using the planning
facility available in the current Codex host. Agents must not invent tasks or
rewrite asks. User instructions may explicitly exempt agent-behavior or
documentation maintenance from this process.

Use this completed-task format:

```markdown
## TASK-0NN: Short descriptive title

**Ask:** Verbatim user-written request.

**Answer:** Factual implementation and verification summary.

**Automated test:**

1. Run `command` from the documented directory.
2. Confirm the expected tests pass.

**Developer demo:**

1. Start the application locally with `command`.
2. Open the documented URL and confirm the expected behavior.
```

## Build, test, and development commands

- `make setup` installs Python and Node dependencies.
- `make dev` runs Vite and FastAPI for development.
- `make test` runs backend, frontend, production-integration, Playwright
  end-to-end, and invariant verification suites.
- `make run` builds the frontend and serves the application on `127.0.0.1`.

Use pytest for FastAPI, Vitest with React Testing Library for components, and
Playwright end to end. Name tests after behavior and cover every changed
behavior.

## Coding style

Use four-space indentation, type annotations, `snake_case` functions/modules,
and `PascalCase` classes in Python. Use two-space indentation, strict typing,
`PascalCase` React components, and `camelCase` functions in TypeScript. Keep API
routes under `/api/v1/`; place visible text in German and Italian translation
dictionaries.

## Git, publication, and attribution

Use short imperative commit subjects. Before creating a local commit, ask
whether the user wants Codex to create it or will do it personally. Do not pull
from or publish to GitHub automatically: never create or update remotes, pull or
push branches or tags, modify pull requests, or create releases. Read-only
inspection is allowed. Pull requests prepared for the user should explain the
behavior, include test evidence, link applicable issues, mention plan or API
changes, and show screenshots for UI updates.

Every commit actually created with Codex assistance must end with a blank line
and this trailer when the active host exposes the exact session model:

```text
AI-Assisted-By: OpenAI Codex (<exact session model>)
```

Otherwise use `AI-Assisted-By: OpenAI Codex`. Never infer the model from
`~/.codex/config.toml`, add the trailer to a user-created commit, or rewrite
existing history merely to change attribution.

## Security

Enforce the 10 MiB upload limit, sanitize filenames, and bind locally to
`127.0.0.1`. The only retained upload is the single active schedule in the
configured store (`data/schedules/` by default, overridable with
`FIREFIGHTER_TOOLS_SCHEDULE_STORE`), which is git-ignored and outside the served
tree. Stored files use opaque `<uuid>.<csv|xlsx>` names. Never retain generated
calendars, write an `.ics` to disk, log schedule contents, or commit secrets,
stored schedules, local databases, or environment files.

Store passwords only as `hashlib.scrypt` hashes. Read the session secret from
`FIREFIGHTER_TOOLS_SECRET_KEY`; the built-in default is for local development
only. `data/`, `*.db`, and `.env` files remain git-ignored.
