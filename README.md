# Feuerwehr Tools

Feuerwehr Tools is a local React and FastAPI application for firefighter utilities. The current scaffold provides a German dashboard, a calendar-converter placeholder, a versioned health API, and a same-origin development proxy. The application binds only to `127.0.0.1`.

## Prerequisites

- Python 3.11 or newer
- Node.js with pnpm 11
- GNU Make

## Initial setup

From the repository root, install both backend and frontend dependencies:

```shell
make setup
```

The command creates `backend/.venv`, installs the backend with its test dependencies, and installs the exact frontend dependency versions from `frontend/pnpm-lock.yaml`. It is safe to run again after dependency changes.

## Development

Start FastAPI and Vite together:

```shell
make dev
```

Open [http://127.0.0.1:5173](http://127.0.0.1:5173). Browser requests to `/api` stay on that origin and Vite proxies them to FastAPI at `http://127.0.0.1:8000`; the backend therefore needs no development CORS policy. Confirm the bridge at [http://127.0.0.1:5173/api/v1/health](http://127.0.0.1:5173/api/v1/health).

Press `Ctrl+C` to stop both servers.

The proxy target defaults to `http://127.0.0.1:8000`. For a different loopback HTTP port, copy `frontend/.env.example` to `frontend/.env.local`, edit `FIREFIGHTER_TOOLS_API_TARGET`, and restart `make dev`. Local environment files are ignored by Git.

## Tests

Run all test suites currently present in the repository:

```shell
make test
```

This runs the FastAPI pytest suite and the React/Vitest suite. Integration and end-to-end suites will be added to the same command when those tests exist.

## Local production run

`make run` is forthcoming. Production frontend building and serving through FastAPI belong to step 6 of [PLAN.md](PLAN.md); until then, use `make dev`.

## Troubleshooting

- If setup reports that `pnpm` is missing, install pnpm 11 and rerun `make setup`.
- If `make dev` reports a missing backend interpreter or Vite binary, run `make setup` first.
- If port `5173` or `8000` is already in use, stop the existing local process before restarting development.
