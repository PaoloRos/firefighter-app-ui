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

### TASK-012 - Add the sample schedule

**Ask**: Store one small, version-controlled XLSX example in the application assets—not in an upload or runtime directory. Verify that it uses exactly the columns required by `calendar-conversion v0.2.0`.

**Answer:** Added a 4.8 KiB styled XLSX example at `assets/examples/calendar_schedule_example.xlsx` with the exact nine `calendar-conversion v0.2.0` columns and three valid German example events using native boolean, date, and time cells. Verified its values and formatting through spreadsheet inspection and rendering, confirmed all three events convert without skips, and confirmed the HTTP endpoint accepts the asset successfully.

**Automated test:**

1. From the repository root, run `backend/.venv/bin/python -m pytest backend/tests/test_sample_schedule.py -vv` and confirm that all four sample-asset tests pass.
2. Run `make test` and confirm that 56 backend tests and six frontend tests pass.
3. Run `backend/.venv/bin/python -m pip check` and confirm that it reports `No broken requirements found.`
4. Run `git diff --check` and confirm that it produces no output and exits successfully.

**Developer demo:**

1. Open `assets/examples/calendar_schedule_example.xlsx` and confirm that the `Beispiel` worksheet shows the nine required headers plus three readable example rows, including timed and all-day events.
2. From the repository root, run `backend/.venv/bin/python -c 'from importlib.metadata import version; from pathlib import Path; from firefighter_tools_backend.services.calendar_conversion import convert_calendar; path=Path("assets/examples/calendar_schedule_example.xlsx"); source=path.open("rb"); result=convert_calendar(source, filename=path.name); source.close(); print(version("calendar-conversion"), result.total_count, result.converted_count, result.skipped_count)'`.
3. Confirm that it prints `0.2.0 3 3 0`.

### TASK-013 - Test in layers

**Ask**: Add adapter tests for:

- Successful conversion.
- Partial conversion.
- All-invalid schedule.
- Stable fatal-error translation.

Add API tests for:

- Valid CSV and XLSX.
- Partial conversion with downloadable ICS content.
- All-invalid input with `calendar: null`.
- Unsupported extension.
- Exactly 10 MiB and over 10 MiB.
- Malformed CSV/XLSX.
- Dangerous filenames such as `../../schedule.csv`.
- Unicode filenames and event data.
- Unexpected converter failure returning a safe `500`.
- Uploaded data not retained after the request.

**Answer:** Expanded the adapter and API suites into explicit behavioral layers. Adapter tests now distinguish successful, partial, and all-invalid results while exhaustively checking stable fatal-code translation. API tests now cover valid CSV/XLSX, partial downloadable ICS, all-invalid output, both size boundaries, malformed formats, dangerous and Unicode filenames/data, safe unexpected failures, and closed multipart storage with no retained temporary file.

**Automated test:**

1. From the repository root, run `backend/.venv/bin/python -m pytest backend/tests/test_calendar_conversion_adapter.py backend/tests/test_calendar_converter_endpoint.py -vv` and confirm that all 25 layered adapter/API tests pass.
2. Run `make test` and confirm that 64 backend tests and six frontend tests pass.
3. Run `backend/.venv/bin/python -m pip check` and confirm that it reports `No broken requirements found.`
4. Run `git diff --check` and confirm that it produces no output and exits successfully.

**Developer demo:**

1. From the repository root, run `backend/.venv/bin/python -m firefighter_tools_backend` and confirm that Uvicorn reports `http://127.0.0.1:8000`.
2. In another terminal, run `curl -sS -F 'file=@assets/examples/calendar_schedule_example.xlsx;filename=../../Übungsplan_🔥.xlsx;type=application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' http://127.0.0.1:8000/api/v1/tools/calendar-converter/convert`.
3. Confirm that the JSON reports `status: "success"`, counts `3`, `3`, and `0`, a sanitized calendar filename `Übungsplan_🔥.ics`, and Unicode ICS event content; then stop the server with `Ctrl+C`.

### TASK-014 - Perform final boundary checks

**Ask**: Confirm that:

- The route never invokes the converter CLI.
- The backend depends on the tagged `v0.2.0` API.
- Only valid events appear in returned ICS text.
- No empty calendar is returned for all-invalid input.
- Responses contain no traceback or local filesystem path.
- Tests leave no uploaded or generated calendar files behind.

**Answer:** Added six dedicated final-boundary checks proving that the HTTP-to-adapter import path uses the typed converter service without CLI or subprocess access, the backend declares and runs `calendar-conversion v0.2.0`, partial ICS includes only valid events, all-invalid input returns no calendar, expected and unexpected responses redact tracebacks and local paths, and disk-spooled uploads plus generated calendars leave no files behind.

**Automated test:**

1. From the repository root, run `backend/.venv/bin/python -m pytest backend/tests/test_calendar_converter_boundaries.py -vv` and confirm that all six final-boundary checks pass.
2. Run `make test` and confirm that 70 backend tests and six frontend tests pass.
3. Run `backend/.venv/bin/python -m pip check` and confirm that it reports `No broken requirements found.`
4. Run `find . -path './.git' -prune -o -path './backend/.venv' -prune -o -path './frontend/node_modules' -prune -o -path './frontend/dist' -prune -o -type f -name '*.ics' -print` and confirm that it produces no output.
5. Run `git diff --check` and confirm that it produces no output and exits successfully.

**Developer demo:**

1. From the repository root, run `backend/.venv/bin/python -c 'from importlib.metadata import version; from firefighter_tools_backend.adapters.calendar_conversion import library_convert_schedule; print(version("calendar-conversion"), library_convert_schedule.__module__)'`.
2. Confirm that it prints `0.2.0 calendar_conversion.service`, demonstrating the tagged typed-service boundary rather than the converter CLI.
3. Run `backend/.venv/bin/python -m pytest backend/tests/test_calendar_converter_boundaries.py -vv` and confirm that the six named checks visibly cover valid-only ICS, no all-invalid calendar, redaction, and no retained files.

## Step 4 of the implementation workflow

### TASK-015 - Add German and Italian translation infrastructure

**Ask**: Add the translation foundation:

- Create German and Italian dictionaries with identical keys.
- Use German as the default language.
- Add a German/Italian language switch to the header.
- Persist a language in `localStorage` only after the user explicitly selects it.
- Add translation helpers for visible text, API error codes, and converter issue codes.
- Add a test that fails if the dictionary keys differ.
- Move the existing hard-coded German shell text into the dictionaries.
- Keep `Feuerwehr Tools` unchanged in both languages.

**Answer:** Added a project-owned, type-checked German/Italian translation layer, moved all existing shell and page text into matching dictionaries, and added frontend helpers for stable API error and converter issue codes. The app now defaults to German without writing an implicit preference, offers a responsive header language switch, persists only an explicit selection, restores it on reload, updates the document language, and keeps `Feuerwehr Tools` unchanged. Verified nine focused translation/UI tests, 70 backend and 13 frontend tests, the production build, dependency consistency, clean diff checks, and the bilingual workflow in the live local app without browser errors.

**Automated test:**

1. From the repository root, run `cd frontend && ./node_modules/.bin/vitest run src/App.test.tsx src/i18n/translations.test.ts` and confirm that all nine focused translation and UI tests pass.
2. From `frontend/`, run `./node_modules/.bin/tsc -b && ./node_modules/.bin/vite build` and confirm that strict TypeScript checking and the production build complete successfully.
3. Return to the repository root, run `make test`, and confirm that 70 backend tests and 13 frontend tests pass.
4. Run `backend/.venv/bin/python -m pip check` and confirm that it reports `No broken requirements found.`
5. Run `git diff --check` and confirm that it produces no output and exits successfully.

**Developer demo:**

1. From the repository root, run `make dev` and open `http://127.0.0.1:5173/`.
2. Confirm that the dashboard initially appears in German, `Deutsch` is selected, and the brand reads `Feuerwehr Tools`.
3. Select `Italiano` and confirm that the header, dashboard, tool card, and footer change to Italian while the brand remains `Feuerwehr Tools`.
4. Reload the page and confirm that Italian remains selected.
5. Open `http://127.0.0.1:5173/tools/calendar-converter` and confirm that the placeholder page and navigation are in Italian.
6. Stop both development servers with `Ctrl+C`.

### TASK-016 - Add the typed calendar-converter API client

**Ask**: Add a typed API client that:

- Defines TypeScript types matching the existing Pydantic conversion contract.
- Submits one `FormData` field named `file`.
- Calls `POST /api/v1/tools/calendar-converter/convert`.
- Distinguishes successful conversion responses from structured API errors.
- Avoids interpreting human-readable backend messages.
- Exposes stable error and converter issue codes for frontend translation.
- Contains no rendering or browser-download logic.

**Answer:** Added a standalone typed calendar-converter API client with TypeScript models matching the Pydantic success, partial, all-invalid, source-location, calendar, and fatal-error contracts. It posts exactly one `file` field to the versioned endpoint, returns a discriminated success/error result, exposes stable API and issue-code types to the translation layer, supports cancellation, and validates untrusted JSON and contract invariants at runtime without interpreting backend message text. Added no rendering or download behavior. Verified eight focused client tests, 70 backend and 21 frontend tests, the production build, dependency consistency, clean diff checks, and a live successful XLSX conversion through the Vite proxy.

**Automated test:**

1. From the repository root, run `cd frontend && ./node_modules/.bin/vitest run src/api/calendarConverter.test.ts` and confirm that all eight API-client tests pass.
2. From `frontend/`, run `./node_modules/.bin/tsc -b && ./node_modules/.bin/vite build` and confirm that strict TypeScript checking and the production build complete successfully.
3. Return to the repository root, run `make test`, and confirm that 70 backend tests and 21 frontend tests pass.
4. Run `backend/.venv/bin/python -m pip check` and confirm that it reports `No broken requirements found.`
5. Run `git diff --check` and confirm that it produces no output and exits successfully.

**Developer demo:**

1. From the repository root, run `make dev`.
2. In another terminal, run `curl -sS -o /tmp/firefighter-task016-response.json -w 'HTTP %{http_code}\n' -F 'file=@assets/examples/calendar_schedule_example.xlsx;type=application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' http://127.0.0.1:5173/api/v1/tools/calendar-converter/convert`.
3. Confirm that it prints `HTTP 200`.
4. Run `backend/.venv/bin/python -c 'import json; p=json.load(open("/tmp/firefighter-task016-response.json", encoding="utf-8")); print({"status": p["status"], "counts": [p["total_count"], p["converted_count"], p["skipped_count"]], "filename": p["calendar"]["filename"], "mime_type": p["calendar"]["mime_type"], "has_ics": "BEGIN:VCALENDAR" in p["calendar"]["ics_text"]})'`.
5. Confirm that it prints a successful result with counts `[3, 3, 0]`, filename `calendar_schedule_example.ics`, MIME type `text/calendar;charset=utf-8`, and `has_ics: True`.
6. Run `rm /tmp/firefighter-task016-response.json`, then stop both development servers with `Ctrl+C`.

### TASK-017 - Complete the translated tool dashboard

**Ask**: Complete the dashboard with:

- A reusable tool-card structure.
- One calendar-converter card.
- Translated title, description, accepted formats, and action label.
- Navigation to `/tools/calendar-converter`.
- A layout that can accept additional tool cards later.
- Basic narrow- and wide-screen behavior.

Detailed colors, spacing refinement, focus styling, and WCAG review remain in step 5.

**Answer:** Added a reusable typed `ToolCard` component and changed the dashboard to render its tool collection through a responsive grid that can accept additional cards. The calendar-converter card now exposes translated category, title, description, accepted-format label, CSV/XLSX format badges, and action text while preserving navigation to the converter route. Kept detailed design and accessibility refinement for step 5. Verified six focused dashboard/dictionary tests, 70 backend and 23 frontend tests, the production build, dependency consistency, clean diff checks, and the German/Italian dashboard at 1200×800 and 375×812 without overflow or browser errors.

**Automated test:**

1. From the repository root, run `cd frontend && ./node_modules/.bin/vitest run src/pages/DashboardPage.test.tsx src/i18n/translations.test.ts` and confirm that all six focused dashboard and dictionary tests pass.
2. From `frontend/`, run `./node_modules/.bin/tsc -b && ./node_modules/.bin/vite build` and confirm that strict TypeScript checking and the production build complete successfully.
3. Return to the repository root, run `make test`, and confirm that 70 backend tests and 23 frontend tests pass.
4. Run `backend/.venv/bin/python -m pip check` and confirm that it reports `No broken requirements found.`
5. Run `git diff --check` and confirm that it produces no output and exits successfully.

**Developer demo:**

1. From the repository root, run `make dev` and open `http://127.0.0.1:5173/`.
2. Confirm that the German dashboard contains one calendar-converter card with its description, `Akzeptierte Formate`, CSV/XLSX badges, and `Werkzeug öffnen` action.
3. Select `Italiano` and confirm that the same card displays `Formati accettati` and `Apri lo strumento`.
4. Resize the browser between a phone-sized width around 375 px and a desktop width around 1200 px; confirm that the header and card remain within the page without horizontal scrolling.
5. Select the card action and confirm that it opens `http://127.0.0.1:5173/tools/calendar-converter`.
6. Stop both development servers with `Ctrl+C`.
