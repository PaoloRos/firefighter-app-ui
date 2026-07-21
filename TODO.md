# Implementation Task History

The user starts each implementation task by adding its identifier, title, and
`Ask`. After completing and verifying that task, the implementing agent adds a
brief `Answer` describing the work performed. Starting with `TASK-004`, the
agent also adds automated-test and developer-demo instructions. Agents do not
create tasks or rewrite user-authored asks.

### TASK-001: Add repository contributor guide

**Ask:** Create a concise root-level `AGENTS.md` describing the planned project structure, commands, coding and testing conventions, contribution expectations, security rules, and the required `TODO.md` task-history process.

**Answer:** Added `AGENTS.md` with repository structure, task-history, command, style, testing, contribution, and security guidance. Created this task-history file and verified the guide is 365 words with a clean `git diff --check` result.

### TASK-002: Add task identifiers

**Ask:** Add a unique identifier to every task recorded in `TODO.md`.

**Answer:** Assigned sequential identifiers to all task entries and updated `AGENTS.md` to require the `TASK-001` naming pattern without reuse or renumbering. Verified Markdown consistency and a clean `git diff --check` result.

## Step 1 of the implementation workflow

### TASK-003: Add structured API to calendar-conversion

**Ask:** I accept the plan, therefore implement the first step, about the API to calendar-coversion. Follow your plan in the [`PLAN.md`](PLAN.md): **Add the structured conversion service, typed results/errors, compatibility tests, documentation, and release tag to calendar-conversion.** I'll set the `/goal` mode and if there are any questio, let me know.

**Answer:** Added the public `convert_schedule` service to `calendar-conversion` with immutable typed results, stable validation and fatal-error codes, CSV/XLSX source locations, counts, invalid-event details, and in-memory ICS output. Refactored the CLI to use the service while preserving its reports and exit codes, expanded the compatibility tests and API documentation, and set the package version to `0.2.0` in commit `d92bee7`. Created the annotated `v0.2.0` tag locally; it has not been published to GitHub. Verified 53 tests, byte-compilation, editable package metadata, a warning-free Sphinx build, and clean diff checks.

## Step 2 of the implementation workflow

### TASK-004 - Backend foundation

**Ask**: Create `backend/` with:
- FastAPI application factory
- `/api/v1/health` endpoint
- Python dependency configuration
- pytest setup and one health-check test
- local binding configuration for 127.0.0.1

**Answer:** Added an installable FastAPI backend with an application factory, versioned health route and response model, project/test dependencies, pytest configuration, one health-check test, and a Uvicorn runner fixed to `127.0.0.1:8000`. Verified the editable installation, dependency consistency, independent factory instances, one passing pytest test, and a live loopback-only HTTP 200 health response.

**Automated test:**

1. From the repository root, run `cd backend`.
2. If the environment is not set up yet, run `python3 -m venv .venv` and `.venv/bin/python -m pip install -e '.[test]'`.
3. Run `.venv/bin/python -m pytest`.
4. Confirm that the health-check test passes.

**Developer demo:**

1. From `backend/`, run `.venv/bin/python -m firefighter_tools_backend`.
2. Open `http://127.0.0.1:8000/api/v1/health` in a browser and confirm that it displays `{"status":"ok"}`.
3. Open `http://127.0.0.1:8000/docs`, expand `GET /api/v1/health`, and confirm that the endpoint can be executed successfully from the API documentation.
4. Stop the server with `Ctrl+C`.

### TASK-005 - Frontend foundation

**Ask**: Create `frontend/` with:

- React, TypeScript, and Vite
- React Router
- strict TypeScript configuration
- Vitest and React Testing Library
- a minimal Feuerwehr Tools shell with placeholder route

**Answer:** Added a pnpm-managed React, TypeScript, and Vite frontend with React Router, strict compiler settings, Vitest and React Testing Library, a responsive German Feuerwehr Tools dashboard, and a calendar-converter placeholder route. Verified two passing route tests, the production build and type check, and HTTP 200 responses for both routes from a Vite server bound to `127.0.0.1`.

**Automated test:**

1. From the repository root, run `cd frontend`.
2. If dependencies are not installed yet, run `pnpm install --frozen-lockfile`.
3. Run `pnpm test` and confirm that both route tests pass.
4. Run `pnpm build` and confirm that the strict TypeScript check and Vite production build complete successfully.

**Developer demo:**

1. From `frontend/`, run `pnpm dev`.
2. Open `http://127.0.0.1:5173/` and confirm that the responsive German Feuerwehr Tools dashboard is visible.
3. Follow the calendar-converter link, or open `http://127.0.0.1:5173/tools/calendar-converter`, and confirm that the placeholder route is displayed.
4. Resize the browser window to confirm that the shell remains usable at narrow and wide widths, then stop the server with `Ctrl+C`.

### TASK-006 - Development integration

**Ask**: Configure:
- Vite proxying `/api` to FastAPI
- CORS-free same-origin development assumptions
- parallel frontend/backend startup
- environment configuration without committed local files

**Answer:** Added a loopback-only Vite `/api` proxy with a validated optional local target, a repository-level `make dev` command that starts and stops FastAPI and Vite together, and ignored local environment-file conventions with a committed example. Kept FastAPI free of CORS middleware because browser API calls use the Vite origin. Verified six frontend tests, the production build, one backend test, and a live proxied health response returning HTTP 200.

**Automated test:**

1. From the repository root, run `cd frontend && ./node_modules/.bin/vitest run` and confirm that all six frontend tests pass.
2. From `frontend/`, run `./node_modules/.bin/tsc -b && ./node_modules/.bin/vite build` and confirm that strict TypeScript checking and the production build complete successfully.
3. Return to the repository root, run `cd backend && .venv/bin/python -m pytest`, and confirm that the health-check test passes.

**Developer demo:**

1. From the repository root, run `make dev` and confirm that both loopback URLs are reported: FastAPI on `http://127.0.0.1:8000` and Vite on `http://127.0.0.1:5173`.
2. Open `http://127.0.0.1:5173/api/v1/health` and confirm that the Vite-origin URL displays `{"status":"ok"}` from FastAPI without a CORS error.
3. Optionally copy `frontend/.env.example` to the ignored `frontend/.env.local`, change `FIREFIGHTER_TOOLS_API_TARGET` to another loopback HTTP port, and restart `make dev` to use that local backend target.
4. Press `Ctrl+C` and confirm that both development servers stop.
