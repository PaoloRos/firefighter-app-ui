# Implementation Task History

This file records completed implementation tasks. The user queues each task in
[`TODO.md`](TODO.md) with its identifier, title, and `Ask`. After the
implementing agent completes and verifies a task, it removes the entry from
`TODO.md` and appends the full record here: the verbatim `Ask`, a brief `Answer`
describing the work performed, and — starting with `TASK-004` — the
automated-test and developer-demo instructions. Identifiers stay sequential and
are never reused or renumbered; the highest identifier below is the running
counter. Agents do not create tasks or rewrite user-authored asks.

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

### TASK-018 - Build the converter upload workflow

**Ask**: Replace the converter placeholder with a functional upload interaction:

- Add a file picker accepting `.csv` and `.xlsx`.
- Support drag-and-drop through the same selection and validation path.
- Validate the filename extension in the browser for immediate feedback.
- Display the selected filename.
- Provide choose-another-file and reset actions.
- Disable submission when no valid file is selected.
- Prevent duplicate submissions while conversion is running.

The backend remains authoritative for file type, structure, and the 10 MiB limit.

**Answer:** Replaced the converter placeholder with a bilingual upload workflow that accepts CSV/XLSX selection through the picker or drag-and-drop, validates filename extensions immediately, displays the selected filename, and provides choose-another-file and reset controls. The form calls the existing typed conversion client, remains disabled without a valid file, and locks submission, file selection, and reset while a request is running. Detailed conversion results and calendar download remain deferred to the next workflow task; backend validation remains authoritative. Verified 15 focused route, translation, and workflow tests, 70 backend and 29 frontend tests, strict TypeScript checking, the production build, dependency consistency, clean diff checks, and the German/Italian page at desktop and narrow widths without overflow or browser errors.

**Automated test:**

1. From the repository root, run `cd frontend && ./node_modules/.bin/vitest run src/pages/CalendarConverterPage.test.tsx src/App.test.tsx src/i18n/translations.test.ts` and confirm that all 15 focused workflow, route, and translation tests pass.
2. From `frontend/`, run `./node_modules/.bin/tsc -b` and confirm that strict TypeScript checking completes successfully.
3. Still in `frontend/`, run `./node_modules/.bin/vite build` and confirm that the production build completes successfully.
4. Return to the repository root, run `make test`, and confirm that 70 backend tests and 29 frontend tests pass.
5. Run `backend/.venv/bin/python -m pip check` and confirm that it reports `No broken requirements found.`
6. Run `git diff --check` and confirm that it produces no output and exits successfully.

**Developer demo:**

1. From the repository root, run `make dev` and open `http://127.0.0.1:5173/tools/calendar-converter`.
2. Confirm that the German page shows a CSV/XLSX picker and drop zone, with `Konvertierung starten` and `Zurücksetzen` disabled initially.
3. Choose `assets/examples/calendar_schedule_example.xlsx` and confirm that its filename appears, `Andere Datei auswählen` is available, and conversion and reset become enabled.
4. Start the conversion and confirm that the action changes to `Wird konvertiert …` while submission, file replacement, and reset remain unavailable until the request finishes.
5. Reset the workflow, drag a CSV or XLSX file onto the drop zone, and confirm that the same filename and action state appear. Drop a file with another extension and confirm that immediate translated validation is shown while conversion remains disabled.
6. Select `Italiano` and confirm that the upload instructions, validation, buttons, and status text switch to Italian.
7. Resize the browser to a phone-sized width around 375 px and confirm that the controls stack without horizontal scrolling.
8. Stop both development servers with `Ctrl+C`.

### TASK-019 - Implement converter states and translated results

**Ask**: Implement a discriminated converter state machine with:

- `idle`, `selected`, `converting`, `result`, and `fatal` states.
- The selected file retained through conversion and result handling.
- Backend `success`, `partial`, and all-invalid `failure` results kept distinct from fatal API errors.
- Translated presentations for converted and skipped counts, all-invalid results, unsupported uploads, oversized uploads, malformed schedules, and safe unexpected server errors.
- Reset and choose-another-file behavior from completed outcomes.
- Returned calendar data retained in state for the later Blob-based ICS download task.

Do not display tracebacks, local paths, or untranslated technical identifiers. The polished partial-result presentation and actual calendar download remain part of PLAN step 5.

**Answer:** Replaced the converter's independent selection, conversion, and request-status flags with one discriminated `idle`/`selected`/`converting`/`result`/`fatal` state. Selected files now remain attached to converting, result, and backend-error states; successful, partial, and all-invalid responses preserve the typed backend result and returned calendar data. Added German/Italian result panels for converted and skipped counts, the prepared calendar filename, skipped-event source details, and translated issue descriptions. Fatal outcomes render only translations of stable API codes, including safe handling of unexpected client failures, without exposing backend messages, tracebacks, or paths. Reset and replacement selection clear completed outcomes, while all-invalid results remain normal results with no calendar filename or download action. Blob-based download remains deferred to PLAN step 5. Verified 23 focused workflow/route/translation tests, 70 backend and 37 frontend tests, strict TypeScript checking, the production build, dependency consistency, no generated ICS files, clean diff checks, real loopback partial/all-invalid payloads, and the bilingual idle page at desktop and phone widths without overflow or browser errors.

**Automated test:**

1. From the repository root, run `cd frontend && ./node_modules/.bin/vitest run src/pages/CalendarConverterPage.test.tsx src/App.test.tsx src/i18n/translations.test.ts` and confirm that all 23 focused state, result, route, and translation tests pass.
2. From `frontend/`, run `./node_modules/.bin/tsc -b` and confirm that strict TypeScript checking completes successfully.
3. Still in `frontend/`, run `./node_modules/.bin/vite build` and confirm that the production build completes successfully.
4. Return to the repository root, run `make test`, and confirm that 70 backend tests and 37 frontend tests pass.
5. Run `backend/.venv/bin/python -m pip check` and confirm that it reports `No broken requirements found.`
6. Run `find . -path './.git' -prune -o -path './backend/.venv' -prune -o -path './frontend/node_modules' -prune -o -path './frontend/dist' -prune -o -type f -name '*.ics' -print` and confirm that it produces no output.
7. Run `git diff --check` and confirm that it produces no output and exits successfully.

**Developer demo:**

1. From the repository root, run `make dev` and open `http://127.0.0.1:5173/tools/calendar-converter`.
2. Choose `assets/examples/calendar_schedule_example.xlsx`, start the conversion, and confirm that the German success result shows three converted events, zero skipped events, and `calendar_schedule_example.ics`.
3. Select `Italiano` while the result remains visible and confirm that its title, description, and count labels change to Italian while the filename is preserved.
4. Select `Reimposta`, choose `TODO.md`, and confirm that the translated unsupported-file message appears immediately while submission remains disabled and no backend message or technical code is shown.
5. Return to the sample XLSX, start conversion, and confirm that file replacement is unavailable only during `Conversione in corso …`; after the result, replacement and reset are available again.
6. Resize the browser to a phone-sized width around 375 px and confirm that the result counts and actions stack without horizontal scrolling.
7. Stop both development servers with `Ctrl+C`.

### TASK-020 - Verify the responsive bilingual workflow

**Ask**: Complete the step-4 frontend verification for:

- German default behavior.
- Switching to Italian and back.
- Persistence only after an explicit language choice.
- Matching German/Italian translation keys.
- Dashboard navigation.
- Picker and drag-and-drop selection.
- Invalid client-side extensions.
- `idle`, `selected`, `converting`, `result`, and `fatal` states.
- Duplicate-submit prevention.
- Success, partial, all-invalid, and API-error rendering.
- Reset and replacement-file behavior.
- Functional rendering at phone and desktop widths without horizontal overflow.

Mock the API client in component tests and do not reproduce backend conversion logic in frontend tests. Fix any functional responsive or bilingual workflow defects discovered, while leaving the polished design system, advanced accessibility review, calendar download, and detailed inline help to PLAN step 5.

**Answer:** Completed the step-4 workflow verification without adding browser-download or backend logic. Extended the frontend integration tests to navigate from the dashboard into the converter, switch explicitly from German to Italian and back while verifying `localStorage` and the document language, preserve completed result/file/calendar state through both language changes, and render the functional partial-result structure at 320 px and 1280 px with the API client mocked. The full frontend suite now covers the complete requested picker, drag-and-drop, state, result, error, reset, replacement, translation, persistence, and navigation matrix. Live browser measurement found and fixed one functional defect: the body's 320 px minimum width caused 15 px of horizontal overflow when a vertical scrollbar was present at the narrow boundary. The body can now shrink to the available width. Verified clean German/Italian dashboard-to-converter navigation and persistence, no horizontal overflow at 320 px or 1200 px, responsive action sizing, and no browser errors. The PLAN step-5 design, accessibility, help, and download scope remains unchanged.

**Automated test:**

1. From the repository root, run `cd frontend && ./node_modules/.bin/vitest run src/pages/CalendarConverterPage.test.tsx src/App.test.tsx src/pages/DashboardPage.test.tsx src/i18n/translations.test.ts` and confirm that all 29 focused bilingual workflow tests pass.
2. From `frontend/`, run `./node_modules/.bin/tsc -b` and confirm that strict TypeScript checking completes successfully.
3. Still in `frontend/`, run `./node_modules/.bin/vite build` and confirm that the production build completes successfully.
4. Return to the repository root, run `make test`, and confirm that 70 backend tests and 41 frontend tests pass.
5. Run `backend/.venv/bin/python -m pip check` and confirm that it reports `No broken requirements found.`
6. Run `find . -path './.git' -prune -o -path './backend/.venv' -prune -o -path './frontend/node_modules' -prune -o -path './frontend/dist' -prune -o -type f -name '*.ics' -print` and confirm that it produces no output.
7. Run `git diff --check` and confirm that it produces no output and exits successfully.

**Developer demo:**

1. From the repository root, run `make dev` if the development servers are not already running, then open `http://127.0.0.1:5173/`.
2. Confirm that the dashboard starts in German when no language was previously chosen. Select `Italiano`, open the calendar tool, and confirm that the converter remains Italian.
3. Select `Deutsch`, reload `http://127.0.0.1:5173/tools/calendar-converter`, and confirm that the explicit German choice persists.
4. Choose `assets/examples/calendar_schedule_example.xlsx`, start conversion, switch to Italian and back after the result appears, and confirm that the selected filename, prepared calendar filename, and counts remain unchanged while every visible label is translated.
5. Resize the browser to approximately 320 px and then 1200 px wide. Confirm that the page has no horizontal scrolling, the phone controls and count cards use the available width, and the desktop actions return to their compact inline layout.
6. Stop the development servers with `Ctrl+C` only if you started them in step 1.

## Step 5 of the implementation workflow

### TASK-021 - Apply the design system

**Ask**: Introduce reusable CSS custom properties for:

- Warm off-white backgrounds.
- Charcoal text.
- Restrained fire-red actions.
- Green success and amber partial-result states.
- Spacing, typography, borders, radii, and shadows.
- Narrow and wide layout breakpoints.

Apply them consistently to the header, dashboard cards, converter form, result panels, and actions.

Confirm that:

- There is no horizontal overflow at 320 px.
- The desktop layout remains comfortable.
- The interface uses system fonts.
- Interactive targets are at least 44 × 44 px.
- Color is not the only indication of state.

**Answer:** Replaced one-off frontend styling values with a reusable civic design system covering the warm canvas and surfaces, charcoal text, restrained fire-red brand actions, green success, amber partial, red failure, typography, spacing, radii, shadows, focus, target sizes, content widths, and narrow/wide breakpoints. Applied the tokens consistently across the shell, dashboard card, converter form, buttons, selected-file notice, result counts, and invalid-event panels. State panels retain translated headings and use distinct left borders in addition to color. Capped the single dashboard card at a comfortable 544 px on desktop while preserving the future multi-card grid. Added four stylesheet contract tests and verified 44–45 px interactive targets, system fonts, no horizontal overflow at 320 px, contained partial results, and a clean browser console without changing application behavior.

**Automated test:**

1. From the repository root, run `cd frontend && ./node_modules/.bin/vitest run src/styles.test.ts src/App.test.tsx src/pages/DashboardPage.test.tsx src/pages/CalendarConverterPage.test.tsx` and confirm that all 29 focused design and component tests pass.
2. From `frontend/`, run `./node_modules/.bin/tsc -b && ./node_modules/.bin/vite build` and confirm that strict TypeScript checking and the production build complete successfully.
3. Return to the repository root, run `make test`, and confirm that 70 backend tests and 45 frontend tests pass.
4. Run `backend/.venv/bin/python -m pip check` and confirm that it reports `No broken requirements found.`
5. Run `git diff --check` and confirm that it produces no output and exits successfully.

**Developer demo:**

1. From the repository root, run `make dev` if the development servers are not already running, then open `http://127.0.0.1:5173/`.
2. Confirm that the warm off-white canvas, charcoal text, fire-red brand and primary action, surface card, format badges, consistent rounded corners, and restrained shadows are visible.
3. Resize the page to approximately 320 px and confirm that the header stacks, the dashboard card and action use the available width, every interactive target remains at least 44 px high, and there is no horizontal scrolling.
4. Resize to approximately 1200 px and confirm that the header returns to one row and the single tool card remains a comfortable 544 px rather than stretching across the page.
5. Open `http://127.0.0.1:5173/tools/calendar-converter`, select a supported schedule, and confirm that the drop zone, selected-file notice, primary and secondary actions, and result panel use the same design tokens.
6. Convert a partially valid schedule and confirm that the amber panel also has a prominent heading and left border, while success and failure panels use their own headings and structural borders. Stop both development servers with `Ctrl+C` only if you started them in step 1.

### TASK-022 - Implement accessibility behavior

**Ask**: Refine semantics and interaction:

- Add a skip link and confirm the main landmark.
- Maintain logical heading levels.
- Ensure every input has a programmatic label.
- Associate validation and file-requirement text with the file input.
- Keep drag-and-drop supplementary to the keyboard-accessible picker.
- Announce conversion progress and completed results appropriately.
- Move focus to the result or fatal-error heading after completion.
- Restore sensible focus after reset.
- Preserve visible `:focus-visible` styling.
- Respect reduced-motion preferences.
- Verify keyboard-only operation and 200% zoom.

Do not turn the entire drop zone into a custom button when the labelled native file input already provides the correct accessible interaction.

**Answer:** Added a bilingual skip link targeting a programmatically focusable main landmark, preserved the logical page/result heading hierarchy, and kept the drop zone non-interactive so the labelled native file input remains the sole keyboard upload control. The input now references its file requirements and, when applicable, translated validation text; keyboard focus on the visually hidden input produces a visible ring on its label. Added a polite conversion-progress announcement and named result regions, with focus moving to the success/partial/failure or fatal heading after completion and returning to the native picker after reset. Extended reduced-motion coverage to skip navigation and improved the focus-ring contrast from 2.28:1 to 6.28:1. Verified the rendered accessibility tree, partial-result and reset focus, no horizontal overflow at the effective 200% reflow width, 44–45 px visible controls, and a clean browser console.

**Automated test:**

1. From the repository root, run `cd frontend && ./node_modules/.bin/vitest run src/styles.test.ts src/i18n/translations.test.ts src/App.test.tsx src/pages/DashboardPage.test.tsx src/pages/CalendarConverterPage.test.tsx` and confirm that all 35 focused accessibility, design, translation, and component tests pass.
2. From `frontend/`, run `./node_modules/.bin/tsc -b && ./node_modules/.bin/vite build` and confirm that strict TypeScript checking and the production build complete successfully.
3. Return to the repository root, run `make test`, and confirm that 70 backend tests and 47 frontend tests pass.
4. Run `backend/.venv/bin/python -m pip check` and confirm that it reports `No broken requirements found.`
5. Run `git diff --check` and confirm that it produces no output and exits successfully.

**Developer demo:**

1. From the repository root, run `make dev` if the development servers are not already running, then open `http://127.0.0.1:5173/`.
2. Press `Tab` and confirm that `Zum Hauptinhalt springen` appears with a strong focus ring. Press `Enter` and confirm that focus moves past the repeated header navigation to the main content.
3. Open `http://127.0.0.1:5173/tools/calendar-converter` and use only `Tab` and `Shift+Tab` to move through the header, native file picker, conversion action, reset action, and back link. Confirm that every focused visible control has a clear focus ring and the drop zone itself is not a separate tab stop.
4. Select a partially valid schedule and start conversion. Confirm with a screen reader or accessibility inspector that conversion progress is announced, then confirm that focus moves to the `Teilweise konvertiert` result heading and that its skipped-event details follow in reading order.
5. Activate `Zurücksetzen` and confirm that focus returns to the native file picker. Select an unsupported file and confirm that the picker description includes both the accepted formats and the translated validation message while focus moves to the fatal heading.
6. Set browser zoom to 200% and confirm that the page reflows without horizontal scrolling, clipped text, or overlapping controls. Switch to Italian and confirm that the skip link, labels, announcements, and errors remain translated.
7. Stop both development servers with `Ctrl+C` only if you started them in step 1.

### TASK-023 - Refine partial-result presentation

**Ask**: Make partial conversion unmistakable without treating it as fatal:

- Show a prominent amber partial-result heading.
- Show total, converted, and skipped counts.
- Clearly explain that the prepared calendar contains only valid events.
- Preserve the prepared calendar filename and payload for the later download task.
- Show one structured entry per skipped event.
- Show the event summary or a safe fallback label.
- Show the CSV row or XLSX worksheet and row.
- Show translated issue descriptions.

For an all-invalid result:

- Show the skipped-event problems.
- Explain that no event was converted and no calendar file was created.
- Do not render a calendar-download action.

Do not implement the Blob-based download in this task; it remains `TASK-024`.

**Answer:** Refined the bilingual conversion outcome so partial results have a visible amber status label and heading, total/converted/skipped counts, an explicit valid-events-only notice, and the prepared calendar filename. Each skipped event now has a structured card with its event summary or safe fallback, skipped label, CSV row or XLSX worksheet and row, and translated issue descriptions. All-invalid results retain the skipped-event problems and explicitly state that no calendar file was created. The calendar filename and payload remain in the conversion result for `TASK-024`; no download action or Blob handling was added. Verified the rendered partial result in German and Italian at 1200 px and 320 px, including result-heading focus, no horizontal overflow, and the absence of a download action.

**Automated test:**

1. From the repository root, run `cd frontend && ./node_modules/.bin/vitest run src/styles.test.ts src/i18n/translations.test.ts src/App.test.tsx src/pages/DashboardPage.test.tsx src/pages/CalendarConverterPage.test.tsx` and confirm that all 37 focused result-presentation, translation, design, accessibility, and component tests pass.
2. From `frontend/`, run `./node_modules/.bin/tsc -b && ./node_modules/.bin/vite build` and confirm that strict TypeScript checking and the production build complete successfully.
3. Return to the repository root, run `make test`, and confirm that 70 backend tests and 49 frontend tests pass.
4. Run `backend/.venv/bin/python -m pip check` and confirm that it reports `No broken requirements found.`
5. Run `find . -path './.git' -prune -o -name '*.ics' -print` and confirm that it produces no output.
6. Run `git diff --check` and confirm that it produces no output and exits successfully.

**Developer demo:**

1. From the repository root, run `make dev` if the development servers are not already running, then open `http://127.0.0.1:5173/tools/calendar-converter`.
2. Select a partially valid CSV or XLSX schedule and start conversion. Confirm that the amber result shows `Teilergebnis`, total/converted/skipped counts, the valid-events-only notice, and the prepared `.ics` filename.
3. Confirm that every skipped event has its own entry with a summary or fallback label, `Übersprungen`, its CSV row or XLSX worksheet and row, and a translated list of problems.
4. Confirm that focus moves to the result heading and that no calendar-download action is shown.
5. Switch to Italian and confirm that the result status, count labels, valid-only notice, skipped label, locations, and issue descriptions are translated.
6. Convert an all-invalid schedule and confirm that its skipped-event problems remain visible, the result says that no calendar file was created, and no download action appears.
7. Resize the browser to approximately 320 px and confirm that the three count cards and skipped-event details stack without horizontal scrolling or clipped text. Stop both development servers with `Ctrl+C` only if you started them in step 1.

### TASK-024 - Implement local calendar download

**Ask**: Add the calendar-download action defined in PLAN step 5:

- Create a `text/calendar;charset=utf-8` Blob from the returned ICS text.
- Initiate the download locally with the backend-provided sanitized filename.
- Show the action for successful and partial conversions.
- Keep the partial-result explanation that the calendar contains only valid events.
- Do not offer a download when all events are invalid and `calendar` is `null`.
- Revoke temporary object URLs and retain no generated calendar files.
- Translate the download action in German and Italian.
- Cover success, partial, all-invalid, repeated-download, and reset behavior in frontend tests.

**Answer:** Added a translated calendar-download button to successful and partial conversion results. Each activation creates a `text/calendar;charset=utf-8` Blob from the backend-returned ICS text, uses the backend-provided sanitized `.ics` filename, triggers a local browser download, removes its temporary anchor, and immediately revokes the object URL. Repeated downloads create and revoke independent URLs. All-invalid results still render their problems without a download action, while replacement selection and reset remove completed download controls. Added German `Kalender herunterladen` and Italian `Scarica il calendario` labels plus responsive result-action styling. Verified real Italian success and German partial downloads: the example XLSX produced a 775-byte `text/calendar` file with three events, and the partial CSV produced a calendar containing exactly its one valid event.

**Automated test:**

1. From the repository root, run `cd frontend && ./node_modules/.bin/vitest run src/styles.test.ts src/i18n/translations.test.ts src/App.test.tsx src/pages/DashboardPage.test.tsx src/pages/CalendarConverterPage.test.tsx` and confirm that all 40 focused download, result-presentation, translation, design, accessibility, and component tests pass.
2. From `frontend/`, run `./node_modules/.bin/tsc -b && ./node_modules/.bin/vite build` and confirm that strict TypeScript checking and the production build complete successfully.
3. Return to the repository root, run `make test`, and confirm that 70 backend tests and 52 frontend tests pass.
4. Run `backend/.venv/bin/python -m pip check` and confirm that it reports `No broken requirements found.`
5. Run `find . -path './.git' -prune -o -name '*.ics' -print` and confirm that it produces no output, proving that the application retained no generated calendar in the repository.
6. Run `git diff --check` and confirm that it produces no output and exits successfully.

**Developer demo:**

1. From the repository root, run `make dev` if the development servers are not already running, then open `http://127.0.0.1:5173/tools/calendar-converter`.
2. Select `assets/examples/calendar_schedule_example.xlsx`, start conversion, and confirm that the successful result shows `calendar_schedule_example.ics` and `Kalender herunterladen`.
3. Activate the download and confirm that the browser saves `calendar_schedule_example.ics`; open it in a text editor or calendar application and confirm that it contains the three example events.
4. Select a partially valid CSV or XLSX schedule, start conversion, and confirm that the amber result retains the download action and explains that the prepared calendar contains only valid events.
5. Download the partial calendar and confirm that it contains the valid events but none of the skipped events shown in the result.
6. Activate the download again and confirm that another valid `.ics` download is initiated. Switch to Italian and confirm that the action reads `Scarica il calendario`.
7. Convert an all-invalid schedule and confirm that no download action appears. Activate `Reimposta` or choose another file and confirm that the previous result and its download action disappear.
8. Resize the browser to approximately 320 px and confirm that the download action fits the result panel without horizontal scrolling. Stop both development servers with `Ctrl+C` only if you started them in step 1.

### TASK-025 - Add inline help and sample access

**Ask**: Add concise German and Italian guidance covering:

1. Select or drop a CSV/XLSX schedule.
2. Start conversion and review skipped events.
3. Download and import the generated ICS calendar.

Also provide:

- Accepted formats.
- The 10 MiB limit.
- A link to the example XLSX schedule.
- A short explanation of partial conversion.
- A reminder that uploads are not retained.

Before implementation, verify how the existing sample asset is delivered. The frontend should link to one stable application URL rather than duplicate the XLSX file in multiple directories.

**Answer:** Added a bilingual inline-help panel beside the upload workflow with the three numbered conversion steps, accepted CSV/XLSX formats, 10 MiB limit, partial-result behavior, and local non-retention reminder. Added German and Italian sample-download labels and one stable `/api/v1/tools/calendar-converter/example` URL. The FastAPI route streams the existing version-controlled `assets/examples/calendar_schedule_example.xlsx` with its XLSX MIME type and attachment filename; no frontend or runtime copy was created. Applied responsive help-panel styling so it sits beside the form on desktop and stacks before it on narrow layouts. Verified that the real browser download is byte-for-byte identical to the source asset.

**Automated test:**

1. From the repository root, run `backend/.venv/bin/python -m pytest backend/tests/test_sample_schedule.py -vv` and confirm that all five sample storage, structure, conversion, stable-download, and upload tests pass.
2. Run `cd frontend && ./node_modules/.bin/vitest run src/styles.test.ts src/i18n/translations.test.ts src/App.test.tsx src/pages/DashboardPage.test.tsx src/pages/CalendarConverterPage.test.tsx` and confirm that all 42 focused help, result, translation, design, accessibility, and component tests pass.
3. From `frontend/`, run `./node_modules/.bin/tsc -b && ./node_modules/.bin/vite build` and confirm that strict TypeScript checking and the production build complete successfully.
4. Return to the repository root, run `make test`, and confirm that 71 backend tests and 54 frontend tests pass.
5. Run `find . -type f -name 'calendar_schedule_example.xlsx' -print` and confirm that only `./assets/examples/calendar_schedule_example.xlsx` is reported.
6. Run `backend/.venv/bin/python -m pip check` and confirm that it reports `No broken requirements found.`, then run `git diff --check` and confirm that it produces no output.

**Developer demo:**

1. From the repository root, run `make dev` if the development servers are not already running, then open `http://127.0.0.1:5173/tools/calendar-converter`.
2. Confirm that `So funktioniert die Konvertierung` shows the three numbered steps plus formats, the 10 MiB limit, partial-conversion guidance, and the non-retention reminder.
3. Activate `XLSX-Beispieldienstplan herunterladen` and confirm that the browser downloads `calendar_schedule_example.xlsx`.
4. Select `Italiano` and confirm that the full help panel and `Scarica il piano dei turni XLSX di esempio` are translated while the sample URL remains unchanged.
5. Resize to approximately 320 px and confirm that help and upload sections stack without clipped text or horizontal scrolling. Resize to desktop width and confirm that they appear side by side.
6. Stop both development servers with `Ctrl+C` only if you started them in step 1.

### TASK-026 - Verify step 5 end to end

**Ask**: Complete a focused UI-quality pass covering:

- German and Italian content.
- Keyboard-only upload and conversion.
- Focus movement after success, partial result, all-invalid result, and fatal error.
- Screen-reader announcements.
- Visible focus indicators.
- Success, warning, and error contrast.
- 44 px touch targets.
- 320 px phone layout.
- Desktop layout.
- 200% zoom.
- Reduced motion.
- Successful ICS download.
- Partial-result ICS download.
- No download for all-invalid input.
- Example-schedule access.
- No generated `.ics` files left in the repository.

Use component tests for deterministic state and accessibility behavior, followed by a real browser walkthrough through `make dev`.

**Answer:** Completed the focused step-5 quality pass across deterministic component coverage and the live application. Confirmed complete German/Italian content, native file-input and button semantics, polite progress/result announcements, alert semantics, and focus movement to success, partial, all-invalid, and fatal headings. The audit found and fixed a stale direct-child CSS selector so every nested result heading now receives the intended visible focus ring. Measured success, warning, and error text contrast at 7.15:1, 7.58:1, and 8.86:1; visible controls resolve to the shared 44 px target within browser subpixel rounding. Verified desktop, phone, and effective-200%-zoom reflow without horizontal overflow, reduced-motion CSS, successful and valid-only partial download behavior, no all-invalid download, byte-identical example access, and no generated `.ics` files in the repository. The browser-control surface could not synthesize keyboard activation of the operating system file picker, so the final physical-keyboard picker activation remains listed in the developer demo; the accessibility tree and tests confirm that the labelled native input is the sole keyboard upload control.

**Automated test:**

1. From the repository root, run `cd frontend && ./node_modules/.bin/vitest run src/styles.test.ts src/i18n/translations.test.ts src/App.test.tsx src/pages/DashboardPage.test.tsx src/pages/CalendarConverterPage.test.tsx` and confirm that all 42 focused state, focus, announcement, translation, responsive-style, download, and help tests pass.
2. From `frontend/`, run `./node_modules/.bin/tsc -b && ./node_modules/.bin/vite build` and confirm that strict TypeScript checking and the production build complete successfully.
3. Return to the repository root, run `make test`, and confirm that 71 backend tests and 54 frontend tests pass.
4. Run `backend/.venv/bin/python -m pip check` and confirm that it reports `No broken requirements found.`
5. Run `find . -path './.git' -prune -o -name '*.ics' -print` and confirm that it produces no output.
6. Run `find . -type f -name 'calendar_schedule_example.xlsx' -print` and confirm that exactly one repository sample is reported.
7. Run `git diff --check` and confirm that it produces no output and exits successfully.

**Developer demo:**

1. From the repository root, run `make dev`, then open `http://127.0.0.1:5173/tools/calendar-converter` in a browser at desktop width.
2. Using only `Tab`, `Shift+Tab`, `Enter`, and `Space`, follow the skip link, switch languages, download the example, open the native file picker, select a supported schedule, and start conversion. Confirm that focus is always visible and the drop zone itself is not an extra tab stop.
3. With a screen reader or accessibility inspector, confirm that conversion progress is announced and that completed results use a named status region; confirm that fatal errors use an alert.
4. Convert successful, partially valid, all-invalid, and unsupported or malformed schedules. Confirm focus moves to each outcome heading, partial results retain valid-only download guidance, and all-invalid results have no download action.
5. Download successful and partial calendars. Confirm the successful file contains all valid events and the partial file contains only its valid events. Download and open the example XLSX from the help panel.
6. Switch between German and Italian after a result and confirm that all visible help, result, issue, and action text changes without losing the result.
7. Check 320 px phone width, desktop width, and 200% browser zoom. Confirm there is no horizontal scrolling, clipping, or overlap and that controls remain at least 44 px.
8. Enable reduced-motion preference and confirm that hover/focus layout remains stable without visible movement. Stop both development servers with `Ctrl+C`.

## Step 6 of the implementation workflow

### TASK-027 - Serve the production frontend through FastAPI

**Ask**: Build the Vite frontend into production assets and serve them through FastAPI on the same origin. Preserve `/api/v1/` routes, support React Router SPA fallbacks, serve static assets with their correct content types, and keep production serving separate from the Vite development proxy. Add tests for the root page, nested frontend routes, static assets, API precedence, and missing-build behavior.

**Answer:** Added opt-in production frontend serving to the FastAPI application factory. It serves built Vite files with their detected content types, falls back to `index.html` for React routes, leaves API and documentation routes ahead of the SPA fallback, rejects unknown `/api/` paths as JSON 404s, and reports a clear error when the build is missing. Development remains API-only behind the existing Vite proxy. Verified five focused production-serving tests and the real built root, nested route, asset, and API responses.

**Automated test:**

1. From the repository root, run `make build` and confirm that strict TypeScript checking and the Vite production build complete successfully.
2. Run `backend/.venv/bin/python -m pytest backend/tests/test_production_frontend.py -vv` and confirm that all five production-serving tests pass.
3. Run `git diff --check` and confirm that it produces no output and exits successfully.

**Developer demo:**

1. From the repository root, run `make run`.
2. Open `http://127.0.0.1:8000/` and confirm that the production dashboard loads without a Vite server.
3. Open `http://127.0.0.1:8000/tools/calendar-converter` directly and confirm that the React route loads rather than returning a server 404.
4. Open `http://127.0.0.1:8000/api/v1/health` and confirm that it displays `{"status":"ok"}`, proving API precedence over the SPA fallback.
5. Stop the server with `Ctrl+C`.

### TASK-028 - Add the localhost production launch workflow

**Ask**: Implement `make run` so it builds the frontend and starts the complete production-like application on `127.0.0.1`. Report the local URL, avoid binding to external interfaces, shut down cleanly on interruption, work without network access after setup, and provide actionable errors when prerequisites are missing.

**Answer:** Added `make build` and `make run`. The production workflow validates local frontend and backend prerequisites, builds with the already-installed TypeScript and Vite binaries without network access, reports `http://127.0.0.1:8000`, and starts FastAPI with the explicit frontend build path. Verified the actual IPv4 listener was only `127.0.0.1:8000`, UI and API responses shared that origin, and `Ctrl+C` completed Uvicorn shutdown with no remaining port listener.

**Automated test:**

1. From the repository root, run `make build` and confirm that `frontend/dist/index.html` and hashed CSS/JavaScript assets are produced.
2. Run `make verify` and confirm that it reports the production frontend, server host `127.0.0.1`, `calendar-conversion v0.2.0`, and no retained calendar files.
3. Run `git diff --check` and confirm that it produces no output and exits successfully.

**Developer demo:**

1. From the repository root, run `make run` and confirm that it reports `Starting Feuerwehr Tools at http://127.0.0.1:8000`.
2. Open that URL and exercise the dashboard and converter; confirm the browser remains on port `8000` for UI, assets, example download, and API calls.
3. In another terminal, run `lsof -nP -iTCP:8000 -sTCP:LISTEN` and confirm the listener is `127.0.0.1:8000`, not `0.0.0.0` or an external address.
4. Press `Ctrl+C`, rerun the `lsof` command, and confirm that no listener remains.

### TASK-029 - Add Playwright end-to-end coverage

**Ask**: Add Playwright end-to-end infrastructure and tests against the production-like application. Cover the dashboard-to-converter workflow for valid, partial, malformed, and all-invalid schedules, German and Italian switching, example-schedule access, calendar downloading, responsive phone and desktop layouts, and confirmation that the application retains no uploaded or generated files.

**Answer:** Added lockfile-pinned Playwright with managed Chromium, a production-server configuration, deterministic CSV fixtures, and six browser tests. They cover dashboard navigation, a valid example XLSX, an Italian choice retained across reload, valid-only partial CSV download, all-invalid download suppression, safe malformed-input handling, stable example access, 320/1280 px overflow checks, temporary browser downloads, and absence of application upload/generated directories or repository ICS files.

**Automated test:**

1. After `make setup`, run `make test-e2e` from the repository root.
2. Confirm that the production frontend builds and all six Playwright tests pass against the automatically managed `127.0.0.1:8000` server.
3. Confirm that Playwright stops the server after the suite and that `frontend/test-results/` and `frontend/playwright-report/` remain ignored diagnostics.

**Developer demo:**

1. From the repository root, run `make run` and open `http://127.0.0.1:8000/`.
2. Switch to Italian, open the converter, upload `assets/examples/calendar_schedule_example.xlsx`, convert it, download the ICS, and reload; confirm Italian remains selected and the calendar contains the three example events.
3. Repeat with `frontend/e2e/fixtures/partial.csv`; confirm the partial result lists `invalid-1` and its downloaded calendar contains `UID:valid-1` but not `UID:invalid-1`.
4. Convert `all-invalid.csv` and `malformed.csv`; confirm the former has no download and the latter shows a safe translated error.
5. Check the converter at approximately 320 px and 1280 px widths and confirm there is no horizontal scrolling, then stop the server.

### TASK-030 - Consolidate the automated verification workflow

**Ask**: Extend the shared test commands to run backend, frontend, integration, and end-to-end verification in a documented and repeatable order. Verify the pinned `calendar-conversion v0.2.0` dependency, production frontend build, localhost-only binding, dependency consistency, and absence of retained uploads or generated calendars.

**Answer:** Added `test-backend`, `test-frontend`, `test-integration`, `test-e2e`, and `verify` targets and made `make test` run them sequentially. Scoped Vitest away from Playwright specifications and added a release-invariant verifier for the installed `v0.2.0` revision, built frontend, `127.0.0.1` host, runtime-directory absence, and retained ICS absence. Verified the aggregate workflow with 76 backend tests, 54 frontend tests, 10 focused production/sample checks, six Playwright tests, repeated production builds, and a clean dependency check.

**Automated test:**

1. From the repository root, run `make test`.
2. Confirm that 76 backend tests, 54 frontend tests, 10 focused integration checks, and six Playwright tests pass in order.
3. Confirm that the final verifier reports `calendar-conversion: 0.2.0`, revision `v0.2.0`, `frontend/dist/index.html`, host `127.0.0.1`, and no retained calendar files.

**Developer demo:**

1. Run each focused command—`make test-backend`, `make test-frontend`, `make test-integration`, `make test-e2e`, and `make verify`—from the repository root.
2. Confirm that each command identifies its subsystem clearly and can be rerun independently.
3. Run `make test` and confirm that it reproduces the same complete sequence and leaves no server listening on port `8000`.

### TASK-031 - Complete setup, run, and troubleshooting documentation

**Ask**: Update the project documentation for the completed application. Document prerequisites, first-time setup, development mode, production-like `make run`, all test commands, local URLs, browser workflow, example schedule, offline operation after dependency installation, and common setup, proxy, build, port, and Playwright failures.

**Answer:** Rewrote the README around the completed bilingual converter rather than the original placeholder. Documented Python/Node/pnpm/Make prerequisites, one-time dependency and Chromium setup, Vite/FastAPI development, single-origin production use, the complete conversion workflow, aggregate and focused test commands, offline operation after setup, local-only URLs, non-retention, and actionable setup, proxy, build, port, and Playwright troubleshooting. Synchronized the contributor command contract with the available `make run` and complete `make test` workflows.

**Automated test:**

1. From the repository root, run `make setup` and confirm the editable backend, frozen frontend lockfile, and Playwright Chromium setup complete successfully.
2. Run `make test` and confirm the complete documented test workflow passes.
3. Run `git diff --check` and confirm that it produces no output and exits successfully.

**Developer demo:**

1. Follow README `Initial setup`, `Development`, and `Local production run` sections from the repository root.
2. Confirm `make dev` serves the Vite application at `http://127.0.0.1:5173` with the proxied health endpoint.
3. Stop development, run `make run`, and confirm the built application and API share `http://127.0.0.1:8000` without Vite.
4. Follow the documented converter workflow and one troubleshooting entry, then stop the server with `Ctrl+C`.

### TASK-032 - Verify local production acceptance

**Ask**: Perform the final technical acceptance pass for PLAN step 6. Start the built application using `make run`; verify loopback-only access, German and Italian dashboard-to-download workflows, valid, partial, malformed, and all-invalid schedules, phone and desktop layouts, calendar import, clean shutdown, offline startup after setup, and absence of retained uploads or generated calendars. Record the exact automated commands and manual demo.

**Answer:** Completed the final production acceptance pass. The built application served the UI, nested React route, static assets, health endpoint, example download, and conversion API from `127.0.0.1:8000`; no external-interface listener was present. Automated browser coverage verified German and persistent Italian workflows, valid, partial, malformed, and all-invalid schedules, ICS downloads, and 320 px/1280 px layouts. The generated three-event example calendar was imported successfully into a temporary macOS Calendar calendar, where all three events were verified; the temporary calendar and its events were then permanently deleted with user confirmation. The production build also succeeded without network access after setup, `Ctrl+C` left no listener, and no uploaded or generated calendar files remained in the repository.

**Automated test:**

1. From the repository root, run `make test` and confirm that 76 backend tests, 54 frontend tests, 10 focused integration checks, and six Playwright tests pass.
2. Run `make verify` and confirm `calendar-conversion` version `0.2.0` at revision `v0.2.0`, the production frontend build, host `127.0.0.1`, dependency consistency, and no retained calendar files.
3. Run `git diff --check` and confirm that it produces no output and exits successfully.

**Developer demo:**

1. From the repository root, run `make run` and open `http://127.0.0.1:8000/`; confirm the dashboard, direct converter route, example download, and API all use the same origin.
2. Switch between German and Italian and exercise the valid example XLSX plus `frontend/e2e/fixtures/partial.csv`, `all-invalid.csv`, and `malformed.csv`; confirm successful, partial, no-calendar, and safe-error behavior respectively.
3. Download the valid ICS and import it into a temporary calendar application calendar; confirm the three valid events and remove the temporary calendar after inspection.
4. Inspect the UI at approximately 320 px and 1280 px and confirm that controls remain usable with no horizontal page overflow.
5. In another terminal, run `lsof -nP -iTCP:8000 -sTCP:LISTEN` and confirm only `127.0.0.1:8000` is listening. Press `Ctrl+C`, rerun the command, and confirm no listener remains.
6. Confirm that the repository contains no retained `*.ics` files and no `uploads/` or `generated/` runtime directories.

### TASK-033 - Add developer UI architecture documentation

**Ask:** add the appropriate documentation about the architecture of the application. The documentation must be accessible by github pages, ie a index.html must be contained in the ./docs folder. This documentation regards the ui, and not the specific functionalities. About them, just give a concise introduction inserting the link to the reference repository of the specific framework. Be in general concise and whenever is a good idea, use a graphic documentation (ie. use functional maps and so on). This documentation is destinated for developers. Update the readme too, which has to give a brief introduction destinated for developers. INsert in the readme at the end that Ive use the AI tools Codex (gpt 5.6 as model) with the link to openai; moreover add that @PaoloRos is the author (me).

**Answer:** Added a self-contained GitHub Pages entry point at `docs/index.html` with concise developer documentation for the UI shell, routing, page state, API boundary, i18n, design system, runtime modes, test layers, and extension path. Added responsive functional and state maps, a short calendar-tool introduction linked to its reference framework, and source links to the implementation. Updated the README with a developer-oriented introduction, architecture and framework links, author attribution, and the requested OpenAI Codex/GPT-5.6 disclosure. Verified direct static serving, valid internal navigation and unique IDs, script-free rendering without console errors, desktop and 320 px layouts without horizontal overflow, and all 54 frontend tests.

**Automated test:**

1. From the repository root, run `test -f docs/index.html && rg -q '<h1>UI architecture</h1>' docs/index.html && rg -q 'https://github.com/PaoloRos/calendar-conversion' docs/index.html && rg -q 'OpenAI Codex.*GPT-5.6' README.md`; confirm that it produces no output and exits successfully.
2. Run `python3 -m http.server 4173 --bind 127.0.0.1 --directory docs`, then run `curl -fsS http://127.0.0.1:4173/ | cmp - docs/index.html` in another terminal; confirm that the comparison produces no output and exits successfully.
3. Run `make test-frontend` and confirm that seven test files and 54 tests pass.
4. Run `git diff --check` and confirm that it produces no output and exits successfully.

**Developer demo:**

1. From the repository root, run `python3 -m http.server 4173 --bind 127.0.0.1 --directory docs` and open `http://127.0.0.1:4173/`.
2. Follow the page contents links and confirm that the UI request map, module map, converter state map, development/production topology, extension checklist, functionality boundary, and source index are present and readable.
3. Resize the browser to approximately 320 px and desktop width; confirm that cards and map nodes reflow without horizontal page scrolling and that internal navigation remains usable.
4. Confirm that the functionality section opens the `calendar-conversion` GitHub repository and that the README ends with @PaoloRos attribution plus the OpenAI Codex/GPT-5.6 disclosure.
5. Stop the documentation server with `Ctrl+C`.

### TASK-034 - Update main page wording

**Ask:** Shorten the main-page introductory sentence in both languages and replace the footer’s local-device message with the English text “Developed by Paolo Rossi,” linking Paolo Rossi to https://github.com/PaoloRos.

**Answer:** Shortened the dashboard introduction to “Praktische Werkzeuge für alltägliche Aufgaben.” in German and “Strumenti pratici per le attività ordinarie.” in Italian. Replaced the translated local-device footer with the English link “Developed by Paolo Rossi.” pointing to `https://github.com/PaoloRos`. Added focused coverage for both descriptions and the footer link in both language states. Verified all 56 frontend tests, the TypeScript/Vite production build, and the rendered local application in German and Italian with no console errors or horizontal page overflow.

**Automated test:**

1. From the repository root, run `make test-frontend`; confirm that seven test files and 56 tests pass.
2. Run `make build`; confirm that TypeScript compilation and the Vite production build complete successfully.
3. Run `git diff --check`; confirm that it produces no output and exits successfully.

**Developer demo:**

1. From the repository root, run `make run` if the local application is not already running, then open `http://127.0.0.1:8000/`.
2. In German, confirm that the dashboard introduction reads “Praktische Werkzeuge für alltägliche Aufgaben.” and the footer reads “Developed by Paolo Rossi.”
3. Select `Italiano` and confirm that the introduction reads “Strumenti pratici per le attività ordinarie.” while the footer remains in English.
4. Follow the footer link and confirm that it opens `https://github.com/PaoloRos`.
5. If you started the application in step 1, stop it with `Ctrl+C`.

### TASK-035 - Add localized GitHub footer credit

**Ask:** Replace the footer signature with a GitHub symbol and a localized developer credit linked to `https://github.com/PaoloRos`: “Entwickelt von PaoloRos.” in German and “Sviluppato da PaoloRos.” in Italian.

**Answer:** Replaced the English footer signature with a localized developer credit: “Entwickelt von PaoloRos.” in German and “Sviluppato da PaoloRos.” in Italian. Added an inline GitHub mark beside the text and kept the complete credit linked to `https://github.com/PaoloRos`. The icon inherits the footer color, remains aligned with the text, and is hidden from assistive technology so the localized link text provides the accessible name. Added focused translation, component, icon, and shared-target styling coverage. Verified all 56 frontend tests, the TypeScript/Vite production build, live German and Italian rendering, the icon and link attributes, a narrow viewport without horizontal overflow, and a clean browser console.

**Automated test:**

1. From the repository root, run `make test-frontend`; confirm that seven test files and 56 tests pass.
2. Run `make build`; confirm that TypeScript compilation and the Vite production build complete successfully.
3. Run `git diff --check`; confirm that it produces no output and exits successfully.

**Developer demo:**

1. From the repository root, run `make run` and open `http://127.0.0.1:8000/`.
2. In German, confirm that the footer shows the GitHub symbol followed by “Entwickelt von PaoloRos.” and that the complete credit links to `https://github.com/PaoloRos`.
3. Select `Italiano` and confirm that the footer changes to “Sviluppato da PaoloRos.” while retaining the same GitHub symbol and profile link.
4. Resize the browser to approximately 320 px and confirm that the icon and text remain aligned without horizontal page scrolling.
5. Stop the application with `Ctrl+C`.

## Post-MVP feature work

### TASK-036 - User database, authentication, and role-based upload access

**Ask:** Add a SQLite user database with `super-user` and `user` roles, username/password authentication with a session cookie, and gate the calendar-converter upload endpoint to `super-user`. Update `PLAN.md` to reflect the new user/role architecture.

**Answer:** Added a local SQLite user store through SQLAlchemy (`db/` package with `UserRecord`; default `data/firefighter.db`, overridable via `FIREFIGHTER_TOOLS_DATABASE_URL`) plus a framework-free `domain/user.py` (`User`, `Role`, `AuthError`). Authentication uses a `services/auth.py` layer with stdlib `hashlib.scrypt` password hashing (self-describing `scrypt$n$r$p$salt$hash` strings, constant-time verification) and a `user_repository` adapter. New `POST /api/v1/auth/login`, `POST /api/v1/auth/logout`, and `GET /api/v1/auth/me` routes run on a Starlette signed session cookie (secret from `FIREFIGHTER_TOOLS_SECRET_KEY`, development-only fallback with a runtime warning). `dependencies.py` adds `get_db`, `get_current_user` (`401 not_authenticated`), and `require_super_user` (`403 forbidden`), rendered by a typed, traceback-free `AuthError` handler. `POST .../calendar-converter/convert` now requires a `super_user` session and `GET .../example` requires any signed-in account; `/api/v1/health` and SPA serving stay public. Added a `python -m firefighter_tools_backend create-user` management subcommand (password via `getpass`, never echoed or logged). Updated `PLAN.md` (architecture, "Users and access control", assumptions, test plan), `AGENTS.md` (account-security rules), `.gitignore` (`data/`, `*.db`, `*.sqlite3`), and `scripts/verify.py` (ignore `data/`). Shared `backend/tests/conftest.py` fixtures provide an isolated database and authenticated clients. Verified 92 backend tests, `make test-backend`, `make test-integration`, `make test-frontend` (56, unchanged), `make verify`, `pip check`, a clean `git diff --check`, and a live loopback HTTP walkthrough of login, `me`, super-user conversion, `403` for a plain user, example download for a plain user, and `401` on an anonymous conversion.

**Automated test:**

1. From the repository root, run `make test-backend`; confirm that 92 tests pass, including `backend/tests/test_auth.py` and `backend/tests/test_user_cli.py`.
2. Run `make test-integration`; confirm that the 10 production-frontend and sample-schedule tests pass.
3. Run `make test-frontend`; confirm that seven test files and 56 tests pass (unchanged by this task).
4. Run `make verify`; confirm that the build succeeds, `pip check` reports no broken requirements, and the invariant verifier prints `server host: 127.0.0.1` and `retained calendar files: none`.
5. Run `git diff --check`; confirm that it produces no output.

**Developer demo:**

1. From the repository root, create the first account: `backend/.venv/bin/python -m firefighter_tools_backend create-user --username chief --role super_user --name Anna` and enter a password twice at the prompts. Repeat with `--username member --role user` for a normal account.
2. Start the application with `make run` and note the printed `http://127.0.0.1:8000`.
3. In a second terminal, confirm an anonymous upload is refused: `curl -s -o /dev/null -w '%{http_code}\n' -X POST 127.0.0.1:8000/api/v1/tools/calendar-converter/convert -F 'file=@assets/examples/calendar_schedule_example.xlsx'` prints `401`.
4. Sign in as the super-user: `curl -s -c jar -X POST 127.0.0.1:8000/api/v1/auth/login -H 'content-type: application/json' -d '{"username":"chief","password":"<password>"}'` returns the profile JSON, and `curl -s -b jar 127.0.0.1:8000/api/v1/auth/me` returns the same account.
5. With `-b jar`, confirm the same conversion `curl` now prints `200`; sign in as `member` into a second cookie jar and confirm the conversion prints `403` (`{"code":"forbidden"}`) while `GET /api/v1/tools/calendar-converter/example` prints `200`.
6. Stop the application with `Ctrl+C`.

### TASK-037 - Frontend identity and role-gated UI

**Ask:** Add a bilingual login screen, an auth context, route guards, a header user menu with sign-out, and hide the calendar-converter upload form from non-`super-user` accounts.

**Answer:** Added a bilingual identity layer to the React frontend. `src/api/auth.ts` is a typed client (`login`, `logout`, `fetchCurrentUser`) mirroring the `SessionUser`/`AuthErrorResponse` contract with runtime type-guards and an `AuthContractError`; it relies on same-origin cookies and never interprets backend message text. `src/auth/AuthProvider.tsx` exposes `useAuth()` with `loading`/`authenticated`/`anonymous` status and re-fetches `GET /api/v1/auth/me` on mount, with an optional synchronous `initialAuth` seam that keeps component tests deterministic. `RequireAuth` guards `/` and `/tools/calendar-converter`, redirecting anonymous visitors to `/login` with the intended route in history state; `RequireSuperUser` gates content by role and doubles as a route guard. `LoginPage` is an accessible German/Italian form with a `role="alert"` error region, stable-code translation (`invalid_credentials` → localized text), and redirect back to the intended route. `UserMenu`, placed in `.header-actions`, shows the signed-in name, a `super_user`/`user` role badge, and a sign-out button that returns to `/login`. The calendar-converter upload `<form>` is wrapped in `RequireSuperUser` with a translated "upload is restricted" panel for plain users, while the inline help and example-schedule download stay visible to every signed-in account. Added `auth*`/`role*`/`converterUploadRestricted*` keys to both dictionaries (the parity test enforces lockstep) and design-system CSS for the login form, user menu, and role badge (44 px targets, visible `:focus-visible`, no 320 px overflow). A shared `renderApp` test helper seeds auth for the existing behavior suites; new suites cover the auth client, the provider, the login page, and the plain-user converter restriction. Playwright gains a deterministic throwaway `data/e2e.db` that `playwright.config.ts` starts clean, `globalSetup` seeds with a super-user and a plain user via the `create-user` CLI, and `globalTeardown` removes; a `signIn` helper authenticates the existing specs and a new `e2e/access-control.spec.ts` covers the login redirect, invalid credentials, the hidden upload form for a plain user, and sign-out. Verified 78 frontend tests, strict `tsc`, the production build, 92 backend tests (unchanged), 10 production-integration tests, 10 Playwright end-to-end tests, `make verify`, and a clean `git diff --check`.

**Automated test:**

1. From `frontend/`, run `./node_modules/.bin/vitest run` and confirm that 10 test files and 78 tests pass.
2. From `frontend/`, run `./node_modules/.bin/tsc -b && ./node_modules/.bin/vite build` and confirm that strict type-checking and the production build succeed.
3. From the repository root, run `make test-backend` and confirm that 92 backend tests pass.
4. Run `make test-integration` and confirm that the 10 production-frontend and sample-schedule tests pass.
5. Run `make test-e2e` and confirm that all 10 Playwright tests pass across `e2e/calendar-converter.spec.ts` and `e2e/access-control.spec.ts`.
6. Run `make verify` and confirm the build succeeds, `pip check` reports `No broken requirements found.`, and the invariant verifier prints `server host: 127.0.0.1` and `retained calendar files: none`.
7. Run `git diff --check` and confirm that it produces no output.

**Developer demo:**

1. From the repository root, create two accounts in the default `data/firefighter.db`: `backend/.venv/bin/python -m firefighter_tools_backend create-user --username chief --role super_user --name Anna` and `backend/.venv/bin/python -m firefighter_tools_backend create-user --username member --role user --name Ben`, entering a password twice at each prompt.
2. Run `make run` and open `http://127.0.0.1:8000`; confirm you are redirected to `/login`.
3. Sign in as `chief`; confirm the dashboard loads, the header shows `Angemeldet als Anna` with a `Super-User` badge and an `Abmelden` button, and the calendar converter shows the CSV/XLSX upload form.
4. Select `Abmelden`, then sign in as `member`; open the calendar converter and confirm the `Upload ist eingeschränkt` panel replaces the upload form while the workflow help and `XLSX-Beispieldienstplan herunterladen` link still work.
5. Switch the language to `Italiano` and confirm the login screen, account menu, role badge, and restriction panel are translated. Stop the server with `Ctrl+C`.

### TASK-038 - User administration

**Ask:** Provide commands to create, list, update the password of, and delete users, plus first-run documentation for creating the initial super-user.

**Status:** NOT COMPLETED — queued for implementation. Answer, automated test, and developer demo will be filled in once the work is delivered and verified.
