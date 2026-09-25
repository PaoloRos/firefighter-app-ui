# Personal calendars: convert the active schedule per personnel number

## Context

[TODO.md](TODO.md) holds a free-form brief, not a `TASK-0NN` entry:

> Implement an algorithm that allows to convert a plan depending on `who are you`.
> 1. super-user loads the full calendar · 2. user start the convertion ·
> 3. conversion depending on the one who's requesting for the calendar · 4. user downloads the calendar ics
>
> the best way to differentiate different people is through an id number
> event1 <- id1, id2... / event2 <- everyone

**What exists today.** Steps 1, 2 and 4 already work (TASK-040/041). The super_user uploads the active schedule with `PUT /api/v1/tools/calendar-converter/schedule`. Every account converts it with `POST …/schedule/convert` in [routes/calendar_converter.py](backend/src/firefighter_tools_backend/routes/calendar_converter.py) and downloads the ICS. What is missing is step 3: everyone currently gets the same full calendar.

**Why the library must change either way.** `calendar-conversion` v0.2.0 (sibling checkout `../frameworks/calendar-conversion`) reads files through `csv.DictReader`. [xlsx_reader.py](../frameworks/calendar-conversion/src/calendar_conversion/xlsx_reader.py) normalises XLSX rows into that same CSV path. Unknown columns are dropped, and `Event` has no field for who an event is for. So a "who" column never reaches the backend unless the reader and `Event` change.

**No id exists on accounts today.** `UserRecord` in [db/models.py](backend/src/firefighter_tools_backend/db/models.py) has `username`, role and profile fields (`name`, `surname`, `rank`, `zug`, `gruppe`), but no personnel number.

**Conflicts with [PLAN.md](PLAN.md):**
- The "Schedule store" section lists "per-user filtering of commitments" as future work. This plan delivers it.
- PLAN.md says the MVP relies on `Base.metadata.create_all`, and that the next *`active_schedule`* change will bring in Alembic. This work changes `users` instead, which needs a migration just as much.
- The library pin moves from `v0.2.0` to `v0.3.0`.

PLAN.md must be updated in each of these places as part of the work.

## Decisions (confirmed with the user)

| Question | Answer |
|---|---|
| Where does the algorithm live? | **In the library.** It parses the new column and filters by participant. The app only maps the signed-in account to its id. |
| What is the "id number"? | A **new optional, unique `personnel_number`** on each account. |
| How does the file say who an event is for? | An optional **`participants`** column with ids separated by `;` (`,` is also accepted). An **empty cell, or a file without the column, means everyone**, so existing files keep working. |
| What does a super_user get? | **The full calendar with every diagnostic by default, plus a "Nur meine Termine" toggle** that downloads their personal calendar instead. |
| Schema migration? | **Introduce Alembic now.** A baseline revision covers today's schema, a second one adds `users.personnel_number`, and existing accounts are kept. |
| Account without a personnel number? | **Personal conversion is blocked** with `409 missing_personnel_number` and a translated message. |

Defaults I chose (flag any you disagree with):
- The API selects full vs. personal with `?scope=full|personal`, **defaulting to `personal`**. `full` requires a super_user; a plain user gets `403 forbidden`.
- Validation still runs over the **whole** file, so duplicate ids are caught across all events. The counts and skipped events in the response then cover only the events the caller receives.
- A personal calendar with zero matching events returns `failure` with `total_count: 0`. The UI shows it as "Im aktuellen Plan gibt es keine Termine für dich", not as an error.
- A personal download is named `<stem>-<personnel_number>.ics`. The personnel number is restricted to `[A-Za-z0-9._-]{1,50}`, so it cannot contain a separator or a path character.

## Scope / non-goals

- Out of scope: targeting by Zug or Gruppe, a web UI for managing personnel numbers (the CLI is enough), a warning for participant ids that match no account, `ATTENDEE` lines in the ICS, and schedule history.
- The stateless `POST …/convert` endpoint stays unfiltered.
- The upload flow, size and type limits, and the store's retention rules do not change.

## Implementation

### A. `calendar-conversion` v0.3.0 (sibling repo `../frameworks/calendar-conversion`)

1. **[event.py](../frameworks/calendar-conversion/src/calendar_conversion/event.py):** add `participants: tuple[str, ...] = ()`. An empty tuple means everyone.
2. **[csv_reader.py](../frameworks/calendar-conversion/src/calendar_conversion/csv_reader.py):** `participants` is an optional column, not added to `REQUIRED_COLUMNS`.
   - Add `_parse_participants(text) -> tuple[str, ...]`. It splits on `;` and `,`, strips each token, drops empty tokens and removes duplicates while keeping order.
3. **[xlsx_reader.py](../frameworks/calendar-conversion/src/calendar_conversion/xlsx_reader.py):** in `_normalized_value`, turn an integral float/int cell in `participants` into `"101"`, not `"101.0"`.
4. **[service.py](../frameworks/calendar-conversion/src/calendar_conversion/service.py):**
   - New signature: `convert_schedule(source, *, filename, calendar_name, participant: str | None = None)`.
   - Validate every event first, as today. Then keep an event when `participant is None`, or when `not event.participants`, or when `participant in event.participants`.
   - Filter valid and invalid events the same way, and compute the counts from the kept events.
   - Add a public helper, `is_for_participant(event, participant) -> bool`.
5. **[application.py](../frameworks/calendar-conversion/src/calendar_conversion/application.py):** add a `--participant ID` CLI flag. The report format and exit codes stay the same.
6. **Tests and docs:**
   - Tests in `tests/test_csv_reader.py`, `test_xlsx_reader.py`, `test_service.py` and `test_application.py`: column absent or empty, `;`/`,` splitting, numeric XLSX cells, filtering, invalid events filtered too, duplicate ids detected across participants.
   - Update the README and docs, bump `pyproject.toml` to `0.3.0`, and create a local tag `v0.3.0`.
   - **You push the tag yourself** (AGENTS.md: no remote changes).

### B. Alembic and `personnel_number` (backend)

1. **Alembic setup:**
   - Add `alembic>=1.13,<2` to [backend/pyproject.toml](backend/pyproject.toml).
   - Create the package `backend/src/firefighter_tools_backend/db/migrations/`, containing `env.py`, `script.py.mako` and `versions/`. It is configured in code (script location from the package path, URL from `settings.database_url`), so no `alembic.ini` is needed.
   - `0001_baseline` creates `users` and `active_schedule` exactly as they are today.
   - `0002_personnel_number` runs `add_column("users", String(50), nullable=True)` and adds the unique index `ix_users_personnel_number`. SQLite cannot add a column with UNIQUE, and a unique index allows several NULLs.
2. **Replace `init_db()`** in [db/__init__.py](backend/src/firefighter_tools_backend/db/__init__.py) with an upgrade to `head`.
   - If `users` exists but `alembic_version` does not (a database created by `create_all`), stamp it at `0001` before upgrading.
   - Every existing caller keeps working: [main.py:34](backend/src/firefighter_tools_backend/main.py#L34) and the four CLI calls in [__main__.py](backend/src/firefighter_tools_backend/__main__.py).
3. **Carry the field through every layer:**
   - `UserRecord.personnel_number: Mapped[str | None]`.
   - Domain `User.personnel_number` in [domain/user.py](backend/src/firefighter_tools_backend/domain/user.py).
   - `_to_user` and `_PROFILE_FIELDS` in [adapters/user_repository.py](backend/src/firefighter_tools_backend/adapters/user_repository.py).
   - `SessionUser.personnel_number` in [models/auth.py](backend/src/firefighter_tools_backend/models/auth.py). An account may see its own number.
4. **CLI:**
   - Add `create-user --personnel-number` and a new `set-personnel-number --username U (--personnel-number N | --clear)`.
   - `list-users` shows the number.
   - The number must match `[A-Za-z0-9._-]{1,50}`. An invalid or duplicate number exits non-zero with a clear message.
5. **Tests:**
   - The migration upgrades a legacy database created by `create_all`, and existing rows survive.
   - The migrated schema matches `Base.metadata` (Alembic `compare_metadata` finds no difference).
   - Uniqueness, the CLI paths, and `/auth/me` exposing the number.

### C. Per-person conversion (backend and frontend)

1. **Backend:**
   - Pass `participant: str | None` through [services/calendar_conversion.py](backend/src/firefighter_tools_backend/services/calendar_conversion.py) `convert_calendar` and [adapters/calendar_conversion.py](backend/src/firefighter_tools_backend/adapters/calendar_conversion.py) `convert_schedule`.
   - In [routes/calendar_converter.py](backend/src/firefighter_tools_backend/routes/calendar_converter.py), `convert_active_schedule` gets `scope: ConversionScope = Query(ConversionScope.PERSONAL)` (`StrEnum`: `full`/`personal`):
     - `full` from a plain user → `403` `forbidden`.
     - `personal` without a number → `409` `missing_personnel_number`, a new `FatalErrorCode` in [models/calendar_conversion.py](backend/src/firefighter_tools_backend/models/calendar_conversion.py).
     - `personal` → `participant=user.personnel_number`, and the filename comes from `_conversion_response(..., filename_suffix=personnel_number)`.
   - Tests in `test_active_schedule_endpoint.py`: personal filtering, everyone-events included, `full` forbidden for a user, `409` missing number, empty personal result, and the filename.
2. **API client ([api/calendarConverter.ts](frontend/src/api/calendarConverter.ts), [api/auth.ts](frontend/src/api/auth.ts)):**
   - `convertActiveSchedule(scope: "full" | "personal" = "personal")` sends `?scope=`.
   - Add `missing_personnel_number` to both `ApiErrorCode` and `apiErrorCodes`.
   - Add `personnel_number: string | null` to `SessionUser` and to its runtime guard.
3. **[CalendarConverterPage.tsx](frontend/src/pages/CalendarConverterPage.tsx):**
   - A super_user gets a "Nur meine Termine" checkbox. It is disabled, with a hint, when their account has no number.
   - With the box off, the page calls `scope=full` and uses the `variant="full"` panel. With it on, it calls `personal` and uses `variant="download"`.
   - A plain user without a number sees a notice and a disabled convert button. The server still enforces the `409`.
4. **[ConversionResultPanel.tsx](frontend/src/components/ConversionResultPanel.tsx):** when `total_count === 0` in the `download` variant, show `calendarNoPersonalEvents` instead of the failure copy.
5. **[IdentityPanel.tsx](frontend/src/components/IdentityPanel.tsx):** show the personnel number when it is set.
6. **i18n, de and it in lockstep ([translations.ts](frontend/src/i18n/translations.ts)):**
   - `converterScopePersonal`, `converterScopePersonalHint`, `converterMissingPersonnelNumber`, `calendarNoPersonalEvents`, `identityPersonnelNumber`, `calendarHelpParticipants` (super_user help: how the column works).
   - The translated `missing_personnel_number` error.
7. **Example schedule [calendar_schedule_example.xlsx](assets/examples/calendar_schedule_example.xlsx):** add a `participants` column where some rows are empty (everyone) and some list ids. Update [test_sample_schedule.py](backend/tests/test_sample_schedule.py).
8. **Pin and checks:** pin `calendar-conversion @ …@v0.3.0`, and update the version checks in [scripts/verify.py](scripts/verify.py), `test_sample_schedule.py:67` and `test_calendar_converter_boundaries.py:83-85`.
9. **End-to-end:** give the accounts in `frontend/e2e/database.ts` and `global-setup.ts` personnel numbers, and add a user without one. Add specs for:
   - a plain user downloading only their events,
   - a user without a number being blocked,
   - the super_user toggle.
10. **Docs:** update PLAN.md (Schedule store, Users, Web API, library pin, Alembic) and the README (`participants` column, `set-personnel-number`).

## Proposed TODO.md tasks

The highest id in [IMPLEMENTATION.md](IMPLEMENTATION.md) is `TASK-043`.

```markdown
## TASK-044: Add participant filtering to calendar-conversion v0.3.0

**Ask:** In the calendar-conversion library, read an optional `participants` column (ids separated by `;` or `,`; empty or missing means everyone), add an optional `participant` argument to `convert_schedule` and a `--participant` CLI flag that keep only that person's events plus the everyone-events, keep CLI exit codes unchanged, and tag `v0.3.0` locally for me to push.
```

```markdown
## TASK-045: Introduce Alembic and a personnel number on accounts

**Ask:** Introduce Alembic with a baseline revision for the current schema, add an optional unique `personnel_number` to accounts through a migration that keeps existing accounts, expose it in `/api/v1/auth/me`, and manage it with `create-user --personnel-number` and a new `set-personnel-number` CLI command.
```

```markdown
## TASK-046: Convert the active schedule per personnel number

**Ask:** Pin calendar-conversion `v0.3.0` and make `POST /api/v1/tools/calendar-converter/schedule/convert` return only the caller's events by personnel number, with a super_user-only `scope=full`; block personal conversion with `409 missing_personnel_number` when the account has no number; give the super_user a "Nur meine Termine" toggle, show a clear message when a user has no events, add the `participants` column to the example schedule, and update German/Italian texts, tests and PLAN.md.
```

TASK-045 and TASK-046 depend on TASK-044's tag being installable. Either you push `v0.3.0` first, or development temporarily uses the editable sibling checkout, as [PLAN.md](PLAN.md) allows.

## Files

| File | Change |
|---|---|
| `../frameworks/calendar-conversion/src/calendar_conversion/{event,csv_reader,xlsx_reader,service,application,__init__}.py` | Add the `participants` field, parsing, filtering and the CLI flag |
| `../frameworks/calendar-conversion/tests/*`, `README.md`, `pyproject.toml` | Tests, docs, version `0.3.0` |
| [backend/pyproject.toml](backend/pyproject.toml) | Add `alembic`, pin `v0.3.0` |
| `backend/src/firefighter_tools_backend/db/migrations/**` (new) | Alembic env and revisions `0001`, `0002` |
| [db/__init__.py](backend/src/firefighter_tools_backend/db/__init__.py), [db/models.py](backend/src/firefighter_tools_backend/db/models.py) | `init_db` runs the upgrade, add `personnel_number` |
| [domain/user.py](backend/src/firefighter_tools_backend/domain/user.py), [adapters/user_repository.py](backend/src/firefighter_tools_backend/adapters/user_repository.py), [services/auth.py](backend/src/firefighter_tools_backend/services/auth.py), [models/auth.py](backend/src/firefighter_tools_backend/models/auth.py) | Add the field through every layer |
| [__main__.py](backend/src/firefighter_tools_backend/__main__.py) | `--personnel-number`, `set-personnel-number`, `list-users` |
| [adapters/calendar_conversion.py](backend/src/firefighter_tools_backend/adapters/calendar_conversion.py), [services/calendar_conversion.py](backend/src/firefighter_tools_backend/services/calendar_conversion.py) | Pass `participant` through |
| [routes/calendar_converter.py](backend/src/firefighter_tools_backend/routes/calendar_converter.py), [models/calendar_conversion.py](backend/src/firefighter_tools_backend/models/calendar_conversion.py) | `scope` query parameter, `missing_personnel_number` |
| `backend/tests/test_{auth,user_cli,active_schedule_endpoint,sample_schedule,calendar_converter_boundaries}.py`, new `test_migrations.py` | Tests |
| [api/calendarConverter.ts](frontend/src/api/calendarConverter.ts), [api/auth.ts](frontend/src/api/auth.ts) | `scope`, error code, `personnel_number` |
| [CalendarConverterPage.tsx](frontend/src/pages/CalendarConverterPage.tsx), [ConversionResultPanel.tsx](frontend/src/components/ConversionResultPanel.tsx), [IdentityPanel.tsx](frontend/src/components/IdentityPanel.tsx) and their tests | Toggle, blocked state, empty-personal message |
| [translations.ts](frontend/src/i18n/translations.ts) | New de/it keys |
| `frontend/e2e/*` | Personnel numbers in the fixtures, new specs |
| [assets/examples/calendar_schedule_example.xlsx](assets/examples/calendar_schedule_example.xlsx) | Add the `participants` column |
| [scripts/verify.py](scripts/verify.py), [PLAN.md](PLAN.md), [README.md](README.md) | `v0.3.0`, architecture and docs updates |

## Verification

**Automated:**
- Library: `PYTHONDONTWRITEBYTECODE=1 PYTHONPATH=src python3 -m unittest discover -s tests -v` in `../frameworks/calendar-conversion`, with every test passing.
- App: `make test-backend`, `make test-frontend` and `make test-e2e`, then `make test`. The full run covers backend, frontend, integration, e2e and verify, and `verify` must report `calendar-conversion revision: v0.3.0`.

**Developer demo:**
1. Set up the accounts:
   - `backend/.venv/bin/python -m firefighter_tools_backend set-personnel-number --username developer --personnel-number 101`
   - Create a second user with `create-user --username max --personnel-number 204`, and a third user with no number.
2. Start the app with `make run` and open http://127.0.0.1:8000.
3. As `developer`, upload a schedule whose `participants` column holds `101`, `204`, `101;204` and empty cells. Convert and confirm the full calendar and its diagnostics. Tick "Nur meine Termine" and confirm the download holds only the 101 events plus the everyone-events, named `…-101.ics`.
4. Sign in as `max` and confirm the download holds only the 204 events plus the everyone-events.
5. Sign in as the user with no number and confirm the translated blocking message and the disabled button. Switch to Italian and check the same.

## Risks / notes

- **Publishing is manual.** The backend pins a GitHub tag, and pushing `v0.3.0` must be done by you. Until it is pushed, `make setup` cannot install it from GitHub.
- **Alembic replaces `create_all`.** Test fixtures in [conftest.py](backend/tests/conftest.py) and the e2e database setup must build the schema through the same `init_db()`, so the tests exercise the migrations. Stamping a legacy database is the riskiest step: back up `data/firefighter.db` before the first run.
- **Privacy.** Personnel numbers show up in the schedule file and in the personal ICS filename. That is acceptable for a loopback-only app, but worth noting before any internet publication.
- **Typos fail silently.** A mistyped id in `participants` means that person misses the event, with no warning; a check for unknown ids is out of scope. A future improvement could list ids that match no account in the super_user diagnostics.
- **Count semantics change** for personal conversions: the counts cover only the caller's events. The existing `ConversionResponse` invariants still hold.
