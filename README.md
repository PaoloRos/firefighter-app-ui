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

## User accounts

The application requires a local account to sign in. Accounts live in a SQLite
database at `data/firefighter.db` by default (override with the
`FIREFIGHTER_TOOLS_DATABASE_URL` environment variable). The `data/` directory
and every `*.db` file are git-ignored and must never be committed. The session
cookie is signed with `FIREFIGHTER_TOOLS_SECRET_KEY`, which falls back to an
insecure development-only value when unset.

The uploaded schedule itself is stored in `data/schedules/` by default
(override with `FIREFIGHTER_TOOLS_SCHEDULE_STORE`). That directory is covered
by the same git-ignored `data/` rule and must never be committed.

Two roles exist:

- `super_user` — may upload a schedule to the server, replacing the single
  active schedule every account converts, may download the example schedule
  that shows the required columns, and may do everything a `user` can.
- `user` — may sign in, see which schedule is loaded, start its conversion,
  and download the resulting calendar. The example XLSX is not offered,
  because a plain account never supplies a source file.

All account management happens through the `firefighter_tools_backend` module.
Run the commands from the repository root after `make setup`; the database file
is created on first use and its schema is migrated to the latest version
automatically, and a running server picks up new or changed accounts without a
restart.

A database created before schema migrations were introduced is upgraded in
place on the first start, keeping every account. Back up `data/firefighter.db`
before that first start, for example with
`cp data/firefighter.db data/firefighter.db.bak`.

### Add a user

```shell
backend/.venv/bin/python -m firefighter_tools_backend create-user --username chief --role super_user
```

The command prompts for the password twice. It is never echoed back or written
to logs and is stored only as a `hashlib.scrypt` hash:

```text
Password:
Confirm password:
Created super_user account 'chief'.
```

- `--role` accepts `super_user` or `user` and defaults to `user`. Create at
  least one `super_user` before the first sign-in.
- Optional firefighter-profile flags: `--name`, `--surname`, `--rank`, `--zug`,
  `--gruppe`.
- Optional `--personnel-number`: the id a schedule's `participants` column uses
  for this person, 1–50 letters, digits, `.`, `_` or `-`. It must be unique;
  a malformed number is rejected before the password prompt, and one that
  already belongs to another account fails without creating anything.
- Re-running `create-user` with an existing `--username` fails without changing
  the account.

Add a plain member the same way:

```shell
backend/.venv/bin/python -m firefighter_tools_backend create-user \
  --username m.rossi --role user --name Mario --surname Rossi --zug 1 --gruppe 2 \
  --personnel-number 204
```

### Inspect and maintain accounts

```shell
# List every account (username, role, profile — never a password hash)
backend/.venv/bin/python -m firefighter_tools_backend list-users

# Replace one account's password (prompts twice)
backend/.venv/bin/python -m firefighter_tools_backend set-password --username chief

# Assign or replace one account's personnel number, or remove it
backend/.venv/bin/python -m firefighter_tools_backend set-personnel-number --username chief --personnel-number 101
backend/.venv/bin/python -m firefighter_tools_backend set-personnel-number --username chief --clear

# Delete one account
backend/.venv/bin/python -m firefighter_tools_backend delete-user --username m.rossi
```

Scripts can pass `--password-stdin` to `create-user` or `set-password` to read
the password from the first line of standard input instead of prompting.

`set-password`, `set-personnel-number`, and `delete-user` exit non-zero and
change nothing when the named account does not exist.
`set-personnel-number` also refuses a malformed number or one held by another
account.

### Use a different database file

Point every command (and the server) at the same path through the environment
variable, for example a throwaway database for experiments:

```shell
export FIREFIGHTER_TOOLS_DATABASE_URL="sqlite:///$(pwd)/data/scratch.db"
backend/.venv/bin/python -m firefighter_tools_backend create-user --username test --role super_user
# ... run make dev / make run in the same shell ...
unset FIREFIGHTER_TOOLS_DATABASE_URL
```

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

The command builds the production frontend where required, starts and stops the end-to-end server automatically, verifies `calendar-conversion v0.2.0`, checks Python dependencies, confirms the loopback binding, rejects retained `.ics` files, and checks that the schedule store stays under `data/` and holds only opaque `<uuid>.<csv|xlsx>` files.

Individual suites are also available:

```shell
make test-backend
make test-frontend
make test-integration
make test-e2e
make verify
```

Playwright downloads are written to its ignored temporary test-output directory. The application writes no generated calendar to disk; the only file it retains is the active schedule inside the git-ignored store.

## Local production run

Build the Vite frontend and serve the complete application from FastAPI:

```shell
make run
```

Open [http://127.0.0.1:8000](http://127.0.0.1:8000). The UI, static assets, example schedule, and `/api/v1/` routes share this origin; Vite and the development proxy are not used. Press `Ctrl+C` to stop the server cleanly.

After `make setup` has installed dependencies and the Playwright browser, `make run`, production conversion, and downloaded-calendar creation require no internet connection.

## Calendar-converter workflow

As a `super_user`:

1. Open the calendar converter from the dashboard.
2. Select or drop a CSV/XLSX schedule up to 10 MiB, or download the example XLSX schedule. Uploading replaces the active schedule for every account.
3. Start conversion and review converted and skipped-event counts, including each skipped event and its problems.
4. For a complete or partial result, download the generated ICS calendar. Partial calendars contain only valid events. All-invalid schedules show their problems without offering an empty download.

As a `user`:

1. Open the calendar converter and confirm which schedule is currently loaded.
2. Start the conversion and download the generated ICS calendar. Uploading, the example XLSX download, and the skipped-event diagnostics are reserved for `super_user` accounts.

In both cases, switch between German and Italian at any time; an explicit choice is retained locally.

The active schedule is stored on the server until a `super_user` replaces it. Generated calendars are produced in memory per request and are never written to disk.

## Troubleshooting

- If setup reports that `pnpm` is missing, install pnpm 11 and rerun `make setup`.
- If Playwright reports that Chromium is missing, run `frontend/node_modules/.bin/playwright install chromium` while online.
- If `make dev`, `make run`, or `make test` reports a missing backend interpreter or frontend binary, run `make setup` first.
- If the production frontend build is missing, run `make build` or start through `make run`, which builds automatically.
- If port `5173` or `8000` is already in use, stop the existing local process before restarting. Development uses both ports; production uses only `8000`.
- If the development proxy fails, confirm that FastAPI is running on `127.0.0.1:8000` and that `FIREFIGHTER_TOOLS_API_TARGET` contains only a loopback HTTP URL.
- If an end-to-end test fails, inspect `frontend/test-results/` or run `cd frontend && ./node_modules/.bin/playwright show-report`; these ignored diagnostic artifacts can be removed after review.
- If the converter reports that no schedule is available, sign in as a `super_user` and upload one; the store starts empty on a fresh checkout.
- To reset the server-held schedule, stop the application and delete `data/schedules/`. The next read detects the missing file, clears the stale record, and reports an empty store.
- If setup fails while offline, reconnect for the initial dependency/browser installation. Normal `make run` operation is offline after setup completes.

## Credits

Author: [Paolo Rossi](https://github.com/PaoloRos).

This project was developed with AI assistance: initially with [OpenAI Codex](https://openai.com/codex/) (GPT-5.6), and from September 2026 with [Claude Code](https://claude.com/claude-code) (Claude Sonnet 5).
