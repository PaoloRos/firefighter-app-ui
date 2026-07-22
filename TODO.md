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

### TASK-007 - Shared commands and verifications

**Ask**: Add the initial:
- `make setup`
- `make dev`
- `make test`
- baseline `.gitignore`
- setup documentation
`make run` can initially be documented as forthcoming, because production frontend serving belongs to PLAN step 6.

**Answer:** Added repeatable `make setup` and aggregate `make test` targets alongside the existing parallel `make dev` workflow, expanded the baseline ignore rules for local environments and generated artifacts, removed tracked TypeScript build metadata, and documented prerequisites, setup, development, testing, proxy configuration, troubleshooting, and the deferred `make run`. Verified a complete setup, one passing backend test, six passing frontend tests, ignore-rule coverage, and a live proxied health response through Vite.

**Automated test:**

1. From the repository root, run `make setup` and confirm that the editable backend and lockfile-pinned frontend dependencies install successfully.
2. Run `make test` and confirm that one backend test and six frontend tests pass.
3. Run `git diff --check` and confirm that it produces no output and exits successfully.

**Developer demo:**

1. From the repository root, run `make dev` and confirm that FastAPI starts on `http://127.0.0.1:8000` and Vite starts on `http://127.0.0.1:5173`.
2. Open `http://127.0.0.1:5173` and confirm that the Feuerwehr Tools dashboard is visible.
3. Open `http://127.0.0.1:5173/api/v1/health` and confirm that it displays `{"status":"ok"}` through the development proxy.
4. Press `Ctrl+C` and confirm that both servers stop.

## Step 3 of implementation workflow

### TASK-008 - Define the API contract

**Ask**: Create Pydantic response models before writing the route:
- `status`: `success`, `partial`, or `failure`
- total, converted, and skipped counts
- invalid-event details and stable issue codes
- nullable calendar containing filename, MIME type, and ICS text
- stable fatal-error response containing a code and safe message

Important distinction:
- All semantically invalid events: normal response with `status: "failure"` and no calendar.
- Structurally malformed input: HTTP `422`.
- Unsupported extension: HTTP `415`.
- Oversized upload: HTTP `413`.
- Unexpected internal problem: safe HTTP `500`.

**Answer:** Added strict Pydantic models for conversion statuses, counts, source-located invalid events, converter-aligned issue codes, nullable in-memory calendars, and safe fatal errors. Enforced consistent count/status/calendar combinations, including a normal all-invalid `failure` response without a calendar, and verified the contract without adding the conversion route.

**Automated test:**

1. From the repository root, run `make test`.
2. Confirm that 19 backend tests and six frontend tests pass.
3. Run `git diff --check` and confirm that it produces no output and exits successfully.

**Developer demo:**

1. From the repository root, run `backend/.venv/bin/python -c 'from firefighter_tools_backend.models import FatalErrorResponse; print(FatalErrorResponse(code="unsupported_file_type", message="Only CSV and XLSX files are supported.").model_dump_json(indent=2))'`.
2. Confirm that the visible JSON contains only the stable code `unsupported_file_type` and the safe message. The HTTP route and its API-documentation demo remain intentionally deferred to the route task.

### TASK-009 - Add the converter adapter

Keep calendar-conversion outside the FastAPI route:
```
HTTP route → backend service → converter adapter → calendar-conversion
```
The adapter should:
  - Call `convert_schedule(...)`.
  - Accept an in-memory binary stream.
  - Translate `ConversionResult` into backend-domain data.
  - Translate `ConversionErrorCode` without parsing CLI output.
  - Contain no FastAPI-specific response handling.

**Answer:** Added a FastAPI-free calendar-conversion adapter that accepts binary streams, calls the public `convert_schedule` service, and explicitly translates results, semantic issue codes, fatal codes, and source locations into immutable backend-domain types. Pinned the runtime dependency to the `v0.2.0` Git tag and verified its installed commit, without adding route or HTTP behavior.

**Automated test:**

1. From the repository root, run `make setup` and confirm that the backend installs `calendar-conversion` from Git revision `v0.2.0` and the frontend dependencies remain current.
2. Run `make test` and confirm that 26 backend tests and six frontend tests pass.
3. Run `backend/.venv/bin/python -m pip check` and confirm that it reports `No broken requirements found.`
4. Run `git diff --check` and confirm that it produces no output and exits successfully.

**Developer demo:**

1. From the repository root, run `backend/.venv/bin/python -c 'from io import BytesIO; from firefighter_tools_backend.adapters import convert_schedule; data=b"id,summary,all_date,start_date,start_time,end_date,end_time,location,description\nexercise,Exercise,true,2026-07-22,,2026-07-22,,,\n"; result=convert_schedule(BytesIO(data), filename="schedule.csv", calendar_name="Feuerwehr"); print(result.total_count, result.converted_count, result.skipped_count, type(result).__module__)'`.
2. Confirm that it prints `1 1 0 firefighter_tools_backend.domain.calendar_conversion`, demonstrating in-memory conversion into backend-owned data without an HTTP route.

### TASK-010 - Implement upload validation

Validate in this order:
  - Ensure a filename is present.
  - Sanitize it by removing directory components.
  - Accept only `.csv` and `.xlsx`.
  - Read in chunks while enforcing the 10 MiB limit.
  - Stop immediately if the limit is exceeded.
  - Close the uploaded file in a `finally` block.

The file may exist temporarily inside the request machinery, but the application must never save it to a permanent path. Schedule contents and generated ICS text must not be logged.

**Answer:** Added an asynchronous upload-validation service with typed backend-domain results and errors. It checks and sanitizes filenames before extension validation, accepts case-insensitive CSV/XLSX names, reads into memory in bounded chunks, accepts exactly 10 MiB, stops after the first excess byte, translates read failures, and always closes the request upload. Added a stable `missing_filename` API error code without adding a route, filesystem persistence, or content logging.

**Automated test:**

1. From the repository root, run `backend/.venv/bin/python -m pytest backend/tests/test_upload_validation.py -vv` and confirm that all 15 focused upload-validation tests pass.
2. Run `make test` and confirm that 42 backend tests and six frontend tests pass.
3. Run `backend/.venv/bin/python -m pip check` and confirm that it reports `No broken requirements found.`
4. Run `git diff --check` and confirm that it produces no output and exits successfully.

**Developer demo:**

1. From the repository root, run `backend/.venv/bin/python -c 'import asyncio; from io import BytesIO; from starlette.datastructures import UploadFile; from firefighter_tools_backend.services import validate_upload; upload=UploadFile(filename="../../schedule.CSV", file=BytesIO(b"schedule")); result=asyncio.run(validate_upload(upload)); print(result.filename, result.size, result.source.read(), upload.file.closed)'`.
2. Confirm that it prints `schedule.CSV 8 b'schedule' True`, demonstrating directory removal, in-memory data, and closure of the request upload.

### TASK-011 - Implement the endpoint

Add:
```
POST /api/v1/tools/calendar-converter/convert
```
  - The route should be thin:
  - Validate and read the upload.
  - Call the backend conversion service.
  - Map the result to the declared response model.
  - Map expected errors to `413`, `415`, or `422`.
  - Map unexpected errors to a generic `500`.

**Answer:** Added the versioned multipart conversion endpoint, a backend conversion service over the existing adapter, and the required multipart dependency. The thin route validates and closes uploads through the upload service, converts only in-memory data, maps complete/partial/all-invalid results to the declared models, returns stable safe `413`/`415`/`422` errors, and hides unexpected details behind a generic `500`. No schedule or ICS content is logged or persisted.

**Automated test:**

1. From the repository root, run `backend/.venv/bin/python -m pytest backend/tests/test_calendar_converter_endpoint.py -vv` and confirm that all ten endpoint contract tests pass.
2. Run `make test` and confirm that 52 backend tests and six frontend tests pass.
3. Run `backend/.venv/bin/python -m pip check` and confirm that it reports `No broken requirements found.`
4. Run `git diff --check` and confirm that it produces no output and exits successfully.

**Developer demo:**

1. From the repository root, run `backend/.venv/bin/python -m firefighter_tools_backend` and confirm that Uvicorn reports `http://127.0.0.1:8000`.
2. In another terminal, run `printf '%s\n' 'id,summary,all_date,start_date,start_time,end_date,end_time,location,description' 'event-1,Exercise,true,2026-07-22,,2026-07-22,,,' | curl -sS -F 'file=@-;filename=schedule.csv;type=text/csv' http://127.0.0.1:8000/api/v1/tools/calendar-converter/convert`.
3. Confirm that the JSON has `status` set to `success`, counts `1`, `1`, and `0`, calendar filename `schedule.ics`, and ICS text containing `UID:event-1`; then stop the server with `Ctrl+C`.
