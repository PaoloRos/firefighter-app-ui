# Feuerwehr Tools

Feuerwehr Tools is a local, bilingual web application for firefighter utilities. The developer stack is React, TypeScript, and Vite for the UI, with a versioned FastAPI boundary for tool services. The application binds only to `127.0.0.1` (`localhost`), so other devices cannot reach it.

The UI is organized as a shared application shell, a dashboard of tool cards, route-owned pages, translation dictionaries, feature API clients, and a project-owned responsive design system. See the [developer UI architecture documentation](docs/index.html) for functional maps, module responsibilities, runtime topology, and the extension path for new tools.

The first tool converts CSV/XLSX schedules into ICS calendars and reports invalid events. Its parsing and calendar-generation internals are provided by the separately versioned [calendar-conversion framework](https://github.com/PaoloRos/calendar-conversion).

## Prerequisites

- Python 3.11 or newer
- Node.js 20 or newer with pnpm 11
- GNU Make

## Initial setup

From the repository root, install both backend and frontend dependencies:

```shell
make setup
```

The command creates `backend/.venv`, installs the backend with its test dependencies, installs the exact frontend dependency versions from `frontend/pnpm-lock.yaml`, and installs Playwright's managed Chromium runtime. Initial setup requires internet access for missing dependencies and browser binaries. It is safe to run again after dependency changes.

## Development

Start FastAPI and Vite together:

```shell
make dev
```

Open [http://127.0.0.1:5173](http://127.0.0.1:5173). Browser requests to `/api` stay on that origin and Vite proxies them to FastAPI at `http://127.0.0.1:8000`; the backend therefore needs no development CORS policy. Confirm the bridge at [http://127.0.0.1:5173/api/v1/health](http://127.0.0.1:5173/api/v1/health).

Press `Ctrl+C` to stop both servers.

The proxy target defaults to `http://127.0.0.1:8000`. For a different loopback HTTP port, copy `frontend/.env.example` to `frontend/.env.local`, edit `FIREFIGHTER_TOOLS_API_TARGET`, and restart `make dev`. Local environment files are ignored by Git.

## Tests

Run the complete backend, frontend, production-integration, browser end-to-end, and invariant verification sequence:

```shell
make test
```

The command builds the production frontend where required, starts and stops the end-to-end server automatically, verifies `calendar-conversion v0.2.0`, checks Python dependencies, confirms the loopback binding, and rejects retained `.ics` files.

Individual suites are also available:

```shell
make test-backend
make test-frontend
make test-integration
make test-e2e
make verify
```

Playwright downloads are written to its ignored temporary test-output directory. The application does not write uploaded schedules or generated calendars to the repository.

## Local production run

Build the Vite frontend and serve the complete application from FastAPI:

```shell
make run
```

Open [http://127.0.0.1:8000](http://127.0.0.1:8000). The UI, static assets, example schedule, and `/api/v1/` routes share this origin; Vite and the development proxy are not used. Press `Ctrl+C` to stop the server cleanly.

After `make setup` has installed dependencies and the Playwright browser, `make run`, production conversion, and downloaded-calendar creation require no internet connection.

## Calendar-converter workflow

1. Open the calendar converter from the dashboard.
2. Select or drop a CSV/XLSX schedule up to 10 MiB, or download the example XLSX schedule.
3. Start conversion and review converted and skipped-event counts.
4. For a complete or partial result, download the generated ICS calendar. Partial calendars contain only valid events. All-invalid schedules show their problems without offering an empty download.
5. Switch between German and Italian at any time; an explicit choice is retained locally.

Uploads and generated calendars are processed in memory and are not retained by the application.

## Troubleshooting

- If setup reports that `pnpm` is missing, install pnpm 11 and rerun `make setup`.
- If Playwright reports that Chromium is missing, run `frontend/node_modules/.bin/playwright install chromium` while online.
- If `make dev`, `make run`, or `make test` reports a missing backend interpreter or frontend binary, run `make setup` first.
- If the production frontend build is missing, run `make build` or start through `make run`, which builds automatically.
- If port `5173` or `8000` is already in use, stop the existing local process before restarting. Development uses both ports; production uses only `8000`.
- If the development proxy fails, confirm that FastAPI is running on `127.0.0.1:8000` and that `FIREFIGHTER_TOOLS_API_TARGET` contains only a loopback HTTP URL.
- If an end-to-end test fails, inspect `frontend/test-results/` or run `cd frontend && ./node_modules/.bin/playwright show-report`; these ignored diagnostic artifacts can be removed after review.
- If setup fails while offline, reconnect for the initial dependency/browser installation. Normal `make run` operation is offline after setup completes.

## Credits

Author: [Paolo Rossi](https://github.com/PaoloRos).

This project was developed with assistance from [OpenAI Codex](https://openai.com/codex/), using GPT-5.6 as the model.
