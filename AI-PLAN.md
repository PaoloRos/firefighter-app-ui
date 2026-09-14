# Server-held active schedule with a role-split converter

## Context

[TODO.md](TODO.md) holds a free-form brief, not a `TASK-0NN` entry:

> a `super-user` can upload source files to the server, and then start the conversion for him-self.
> While `user` can only start the conversion. […] Change also the interface for `user`. Must be
> shown only what regards the downloading process.

Today the converter is **stateless**. [routes/calendar_converter.py](backend/src/firefighter_tools_backend/routes/calendar_converter.py)
exposes `POST /convert` (multipart, `Depends(require_super_user)`) which converts in memory and
returns ICS text as JSON, and `GET /example` (`Depends(get_current_user)`) which serves the
version-controlled sample. Nothing is written to disk. A plain `user` therefore has **no usable
tool** — [CalendarConverterPage.tsx:176-183](frontend/src/pages/CalendarConverterPage.tsx#L176-L183)
wraps the upload form in `<RequireSuperUser fallback={…}>` and shows a "Upload ist eingeschränkt"
note instead.

The brief makes the server hold state: a stored source schedule that a plain `user` converts
without ever uploading. That gives plain users a real feature for the first time.

**This contradicts the documented no-retention posture in five places**, all of which must be
updated as part of the work:

| Where | Exact wording today |
|---|---|
| [PLAN.md:14](PLAN.md#L14) | "Retain neither uploads nor generated calendars after the request." |
| [PLAN.md:91](PLAN.md#L91) | "Do not persist or log uploaded content." |
| [PLAN.md:174](PLAN.md#L174) | "…no analytics, background jobs, or server-side history of uploaded or generated files." |
| [AGENTS.md:60](AGENTS.md#L60) | "…bind locally to `127.0.0.1`, and retain no uploaded files." |
| [README.md](README.md) L125/L137/L159 | "The application does not write uploaded schedules or generated calendars to the repository." |

And [scripts/verify.py](scripts/verify.py) enforces it mechanically: it fails if a repo-root
`uploads/` or `generated/` directory **exists at all**, and if any `.ics` survives outside
`IGNORED_DIRECTORIES = {".git", ".venv", "data", "dist", "node_modules", "playwright-report", "test-results"}`.
`data/` being on that skip list makes it the only pre-blessed writable location — and also means a
store placed there is currently **invisible** to the verifier, a hole this work must close.

## Decisions (confirmed with the user)

| Question | Decision |
|---|---|
| What does the server hold? | **One current/active schedule**, not a library. A super-user uploads to replace it; everyone converts that one. This matches the brief's future note ("depending on the user, are converted just specific commitments" — one shared roster, filtered per person later). |
| Does `POST /convert` survive? | **Yes, unchanged**, alongside the new endpoints. Keeps ad-hoc stateless conversion and avoids churning the 99 backend tests. |
| What does a plain `user` see? | Which schedule is loaded, a convert button, **total/converted counts**, and the download button. **No** upload control, **no** skipped-event diagnostics. |
| How is it queued? | **Two tasks: `TASK-040` (backend + docs), `TASK-041` (frontend + e2e).** Highest recorded id is `TASK-039`. |

Judgement call inside decision 3: a plain user does not see the **skipped count** either — showing a
number they cannot act on invites questions they cannot answer. They still get the partial/failure
guidance sentence, so a short calendar is never silent. This is one `variant` prop, trivially
flipped if it reads wrong in the demo.

## Scope / non-goals

- No `DELETE /schedule` endpoint. Replacement is the only super-user mutation the brief describes.
- No per-user filtering of commitments — that is the brief's explicitly future item.
- No Alembic. `init_db()` is `Base.metadata.create_all(engine)`, which is per-table idempotent, so
  an existing `data/firefighter.db` gains an empty table on next start.
- No history or versioning: exactly one active schedule, no previous versions retained.
- No change to `POST /convert`, `GET /example`, auth, or the CLI.
- Generated calendars stay **fully in memory**. No `.ics` is ever written to disk.

## Implementation

### TASK-040 — backend

**1. Settings** — [config.py](backend/src/firefighter_tools_backend/config.py)

```python
_DEFAULT_SCHEDULE_STORE_PATH = _REPOSITORY_ROOT / "data" / "schedules"
SCHEDULE_STORE_ENV_VAR = "FIREFIGHTER_TOOLS_SCHEDULE_STORE"
```

Add `schedule_store_dir: Path` to `Settings` **immediately after `secret_key`** — dataclass ordering
requires non-defaulted fields before `session_cookie_name`/`session_max_age`, which have defaults.
`load_settings()` resolves the env var with `Path(raw).expanduser().resolve()`, else the default.

`settings = load_settings()` is evaluated **once at import** (config.py:42), so the store service
must read the path through a `store_directory()` function, never capture it at import — that is what
makes `monkeypatch` work per test.

**2. Table** — [db/models.py](backend/src/firefighter_tools_backend/db/models.py), re-export from [db/__init__.py](backend/src/firefighter_tools_backend/db/__init__.py)

```python
SINGLETON_SCHEDULE_ID = 1

class ActiveScheduleRecord(Base):
    __tablename__ = "active_schedule"
    __table_args__ = (CheckConstraint("id = 1", name="ck_active_schedule_singleton"),)

    id: Mapped[int] = mapped_column(primary_key=True)          # always 1
    stored_filename: Mapped[str] = mapped_column(String(80))    # "<uuid4hex>.xlsx"
    original_filename: Mapped[str] = mapped_column(String(255))
    size_bytes: Mapped[int] = mapped_column(Integer)
    uploaded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)
    uploaded_by_user_id: Mapped[int | None] = mapped_column(Integer, default=None)
    uploaded_by_username: Mapped[str] = mapped_column(String(150))
```

**No ForeignKey to `users.id`** — deliberate. [conftest.py](backend/tests/conftest.py) authenticates
by overriding `get_current_user` with a `User` dataclass, so `SUPER_USER` has **no row in `users`**.
An FK is inert today (SQLite needs `PRAGMA foreign_keys=ON`, which [db/engine.py](backend/src/firefighter_tools_backend/db/engine.py)
never sets) but would detonate every endpoint test the day anyone enables it. The denormalized
`uploaded_by_username` is what the UI renders anyway, and it survives account deletion.

**3. Domain** — `backend/src/firefighter_tools_backend/domain/schedule_store.py` (new), mirroring
[domain/upload.py](backend/src/firefighter_tools_backend/domain/upload.py):

```python
class ScheduleStoreErrorCode(StrEnum):
    NO_ACTIVE_SCHEDULE = "no_active_schedule"
    STORE_WRITE_ERROR = "store_write_error"

class ScheduleStoreError(Exception): ...          # .code, like UploadValidationError

@dataclass(frozen=True, slots=True)
class StoredSchedule:
    original_filename: str
    path: Path
    size_bytes: int
    uploaded_at: datetime
    uploaded_by: str
```

Named `StoredSchedule` to avoid colliding with the Pydantic `ActiveSchedule`.

**4. Store service** — `backend/src/firefighter_tools_backend/services/schedule_store.py` (new)

```python
def store_directory() -> Path
def save_active_schedule(session, upload: ValidatedUpload, *, uploaded_by: User) -> StoredSchedule
def find_active_schedule(session) -> StoredSchedule | None      # GET; self-heals
def load_active_schedule(session) -> StoredSchedule             # raises ScheduleStoreError
def open_active_schedule(schedule: StoredSchedule) -> BinaryIO
```

*File on disk, metadata row in SQLite* — not a BLOB. `convert_calendar(source: BinaryIO, …)` in
[services/calendar_conversion.py](backend/src/firefighter_tools_backend/services/calendar_conversion.py)
takes any binary stream, so `path.open("rb")` drops in unchanged and the library keeps real `seek`;
and `data/firefighter.db` stays an auth store a developer can `.dump`.

On-disk name is `f"{uuid4().hex}{suffix}"` with the lowercased suffix from the already-sanitized
filename. **The user-supplied name never reaches the filesystem** — traversal is structurally
impossible and duplicate names are harmless. The sanitized original lives only in the DB and is
passed to `_conversion_response(result, source_filename=…)`, so `Dienstplan 2026.xlsx` still
downloads as `Dienstplan 2026.ics` with zero change to that helper.

`save_active_schedule` ordering, which is what makes crashes harmless:

1. `mkdir(parents=True, exist_ok=True)` — **lazily on first write, never at import**.
2. Write to `NamedTemporaryFile(dir=directory, suffix=".tmp", delete=False)`, `flush()`, `os.fsync()`,
   close, then `os.replace(tmp, target)` — atomic within one filesystem; a reader never sees a
   partial file.
3. Upsert the singleton row, `session.commit()`.
4. **After** the commit, purge every file the row does not name (previous file, stale `.tmp`, orphans).
5. On commit failure: `rollback()`, unlink the new file, raise `ScheduleStoreError(STORE_WRITE_ERROR)`.

Contract: **the DB row is the source of truth; anything on disk it does not name is garbage.** The
store never holds more than two files, so the purge is one `iterdir()`. The inverse failure (row
present, file deleted by an operator) is handled on read — `find_active_schedule`/`load_active_schedule`
check `path.is_file()` and, if missing, **delete the row, commit, and report absence**, so `GET` and
`POST …/convert` can never disagree.

**5. Contract models** — [models/calendar_conversion.py](backend/src/firefighter_tools_backend/models/calendar_conversion.py)

```python
class ActiveSchedule(ContractModel):
    filename: str = Field(min_length=1)     # sanitized ORIGINAL name, never the uuid
    size_bytes: int = Field(ge=0)
    uploaded_at: datetime
    uploaded_by: str = Field(min_length=1)

class ActiveScheduleResponse(ContractModel):
    schedule: ActiveSchedule | None
```

`FatalErrorCode` gains `NO_ACTIVE_SCHEDULE = "no_active_schedule"`. `ContractModel` is
`extra="forbid"`, so `stored_filename` cannot leak by accident.

**6. Endpoints** — added to the existing router in [routes/calendar_converter.py](backend/src/firefighter_tools_backend/routes/calendar_converter.py)
(`prefix="/tools/calendar-converter"`, mounted at `/api/v1`). `POST /convert` and `GET /example` are
**not touched**.

| Endpoint | Auth | Success | Errors |
|---|---|---|---|
| `PUT /schedule` | `require_super_user` | 200 `ActiveScheduleResponse` | 401/403, 413/415/422 via `_UPLOAD_ERRORS`, 500 |
| `GET /schedule` | `get_current_user` | **always 200**, `schedule: null` when empty | 401 |
| `POST /schedule/convert` | `get_current_user` | 200 `ConversionResponse` | 401, **409 `no_active_schedule`**, 415/422, 500 |

- `PUT` because it replaces the one addressable resource and is idempotent in effect. 200 not 201:
  the endpoint always exists, and one response model for `PUT`+`GET` means one frontend guard.
- `GET` returning 200-with-null is deliberate: "nothing uploaded yet" is a normal UI state, not an
  error, and 404 would force a normal state through the client's error path.
- Upload reuses `await validate_upload(file)` verbatim — extension allow-list, the 10 MiB ceiling,
  filename sanitization, guaranteed close. **No conversion happens on upload.**
- Convert reuses `convert_calendar` and `_conversion_response` unchanged, so success/partial/failure,
  the count invariants and the `Calendar` payload are bit-identical to `/convert` and the frontend's
  existing `isConversionResponse` guard works as-is.

New third mapping dict alongside `_UPLOAD_ERRORS` / `_CONVERSION_ERRORS`:

```python
_STORE_ERRORS = {
    ScheduleStoreErrorCode.NO_ACTIVE_SCHEDULE: (409, FatalErrorCode.NO_ACTIVE_SCHEDULE,
                                                "No schedule has been uploaded yet."),
    ScheduleStoreErrorCode.STORE_WRITE_ERROR:  (500, FatalErrorCode.INTERNAL_ERROR,
                                                "The request could not be processed."),
}
```

**7. `scripts/verify.py` — new invariants.** The existing `.ics` sweep skips `data/`, so the store
would be invisible to it. Close the hole:

1. When `SCHEDULE_STORE_ENV_VAR` is unset, assert `settings.schedule_store_dir.is_relative_to(ROOT / "data")`
   (conditional, so a deliberate deployment override does not fail `make verify`).
2. If the store exists, assert it contains **no `*.ics`** — the general sweep cannot see inside it.
3. Every entry in the store matches `^[0-9a-f]{32}\.(csv|xlsx)$` — one check that catches leftover
   `.tmp` files, an accidental write of a user-supplied name, and any stray artifact.
4. Extend the forbidden repo-root directory list from `{uploads, generated}` to
   `{uploads, generated, schedules}` — the store must never be created outside `data/`.

Add a success line: `schedule store: data/schedules (N files)`.

**[.gitignore](.gitignore) needs no change** — `data/` at line 45 already covers `data/schedules/`.
State this in the task so nobody adds a redundant rule.

**8. Backend tests**

New `backend/tests/test_schedule_store_service.py` — saves inside the configured directory; stored
name is opaque and keeps the extension; row records the sanitized original + uploader; replacement
deletes the previous file and keeps exactly one row; no `.tmp` survives; a failed commit removes the
new file; orphans are purged; loading with no row raises `NO_ACTIVE_SCHEDULE`; a row whose file is
missing is dropped and reported absent; `../../evil.csv` lands in the store under a uuid.

New `backend/tests/test_active_schedule_endpoint.py` — `GET` reports null before any upload for both
roles; `GET` 401 anonymous; super-user upload then `GET` reports it; response never exposes the uuid
or a local path; plain user `PUT` → 403; anonymous `PUT` → 401; missing/oversized/unsupported upload
map to 422/413/415; a second upload replaces the first for every account; **plain user converts the
active schedule successfully**; super-user converts the same one; convert with no schedule → 409
`no_active_schedule`; partial and failure shapes; malformed CSV → safe 422; unexpected error → generic
500 with no traceback or `/Users/`; repeated conversion does not mutate the stored file; **conversion
writes no `.ics` anywhere**, using an `rglob` sweep that does *not* exclude `data/`; the default store
lives under `data/`; OpenAPI declares the new responses.

Existing files that change — exactly three:

- [conftest.py](backend/tests/conftest.py): `os.environ.setdefault("FIREFIGHTER_TOOLS_SCHEDULE_STORE", tempfile.mkdtemp(...))`
  in the same **pre-import** block as the DB URL; a new autouse `clean_schedule_store` fixture; a
  `stored_schedule(client)` fixture that PUTs a known-good CSV.
- [test_calendar_converter_endpoint.py](backend/tests/test_calendar_converter_endpoint.py) —
  `test_every_expected_domain_error_has_an_http_mapping` extends to
  `set(route._STORE_ERRORS) == set(ScheduleStoreErrorCode)`, its status set `{409, 500}`, and a new
  totality assertion that every `FatalErrorCode` is reachable from some mapping.
- [test_calendar_conversion_models.py](backend/tests/test_calendar_conversion_models.py) — cases for
  the two new models (`extra="forbid"`, `size_bytes >= 0`, `schedule: None` accepted).

**Anything else failing means churn leaked into `/convert` and should be backed out.** Expect roughly
99 → ~130 backend tests.

**9. Docs** — [PLAN.md](PLAN.md): rewrite lines 14/91/174 and the test-plan bullet at 164; add a
"Schedule store" subsection (directory, opaque uuid names, singleton table, atomic `os.replace`,
commit-then-purge, row-is-truth self-healing, `FIREFIGHTER_TOOLS_SCHEDULE_STORE`, "delete is a future
task"); add the three endpoints and the 409 code to the Web API section; note explicitly that
`POST …/convert` is **retained unchanged as a stateless super-user API with no UI caller** so it does
not read as an oversight; add the store to the mermaid diagram; describe the two role experiences
under User Experience. [AGENTS.md:60](AGENTS.md#L60): "retain no uploaded files" → retain only the
single active schedule in the configured store under `data/`, never in the served or version-controlled
tree; still never retain a generated calendar, never log schedule contents. [README.md](README.md):
rewrite L125/L137/L159, document the new env var, split the converter workflow into "As a super-user"
and "As a user", and add troubleshooting for "no schedule loaded" and how to reset the store.

### TASK-041 — frontend

**1. API client** — [api/calendarConverter.ts](frontend/src/api/calendarConverter.ts)

```ts
export const ACTIVE_SCHEDULE_ENDPOINT = "/api/v1/tools/calendar-converter/schedule";
export const ACTIVE_SCHEDULE_CONVERT_ENDPOINT = "/api/v1/tools/calendar-converter/schedule/convert";

export type ActiveSchedule = { filename: string; size_bytes: number; uploaded_at: string; uploaded_by: string };
export type ActiveScheduleResponse = { schedule: ActiveSchedule | null };

export async function fetchActiveSchedule(options?): Promise<ActiveScheduleResult>;
export async function uploadActiveSchedule(file: File, options?): Promise<ActiveScheduleResult>;  // PUT + FormData
export async function convertActiveSchedule(options?): Promise<CalendarConverterResult>;          // POST, no body
```

Add guards `isActiveSchedule` / `isActiveScheduleResponse` in the existing `isRecord` /
`isNonNegativeInteger` style. **Add `"no_active_schedule"` to the `ApiErrorCode` union *and* to the
`apiErrorCodes` Set at [calendarConverter.ts:83](frontend/src/api/calendarConverter.ts#L83)** —
forgetting the Set silently turns a 409 into a thrown contract error. Make that a named test.

**2. Component split** — [CalendarConverterPage.tsx](frontend/src/pages/CalendarConverterPage.tsx)
stays the route module and shrinks to orchestration:

```
CalendarConverterPage                        (owns all state)
├── intro + <aside className="converter-help">        everyone
├── .converter-workspace
│   ├── <ActiveScheduleCard />                        everyone
│   ├── .convert-actions (button + live region)       everyone
│   ├── <ConversionResultPanel variant={…} />         everyone, role-shaped
│   └── <RequireSuperUser fallback={null}>
│         <ScheduleUploadForm onUploaded={…} />       super_user only
└── back link
```

New: `frontend/src/components/ActiveScheduleCard.tsx` (plus an exported `formatScheduleSize`),
`frontend/src/components/ConversionResultPanel.tsx` (moves `ConversionResultPanel`, `InvalidEventItem`
and `downloadCalendar` out of the page; props `{ result, variant: "full" | "download", headingRef }`),
`frontend/src/components/ScheduleUploadForm.tsx` (drop zone, picker, selected-file line, submit/reset).

Extracting `ConversionResultPanel` is a real fix: today it is **redefined inside the page's render
function** ([CalendarConverterPage.tsx:295](frontend/src/pages/CalendarConverterPage.tsx#L295)), so
React remounts the whole subtree on every state change.

Keep [RequireSuperUser](frontend/src/components/RequireSuperUser.tsx) and pass `fallback={null}` — its
`fallback === undefined ? <Navigate/> : fallback` branch renders nothing for a plain user, which is
exactly the required behavior. The page separately reads `useAuth()` for the result `variant`; safe,
since the route already sits behind `RequireAuth`.

**3. State** — three independent unions replacing today's single one:

```ts
type ScheduleState   = {status:"loading"} | {status:"empty"} | {status:"loaded"; schedule: ActiveSchedule}
                     | {status:"unavailable"; errorCode: ApiErrorCode};
type ConversionState = {status:"idle"} | {status:"converting"} | {status:"result"; result: ConversionResponse}
                     | {status:"fatal"; errorCode: ApiErrorCode};
type UploadState     = {status:"idle"} | {status:"selected"; file: File} | {status:"uploading"; file: File}
                     | {status:"fatal"; file?: File; errorCode: ApiErrorCode};   // ScheduleUploadForm only
```

Mount fetches the schedule with an `AbortController` cleanup. A successful upload sets `schedule` and
resets `conversion` to `idle`. A `no_active_schedule` fatal **also** sets `schedule` to `empty`, matching
the backend's self-heal. Preserve the existing `outcomeHeadingRef` focus effect, now keyed on
`conversion`. Keep `hasSupportedExtension` and `downloadCalendar` as-is. The page stops calling
`convertCalendar`; that function stays exported and covered by its own API test.

**4. Role split**

| Element | super_user | user |
|---|---|---|
| Schedule card (filename, uploaded at/by, size) | yes | yes |
| Convert button, total + converted counts, download | yes | yes |
| Skipped count | yes | **no** |
| `.invalid-events` list + issue codes | yes | **no** |
| Partial/failure guidance sentence | yes | yes |
| Upload form / drop zone / file input | yes | **no** |
| Help aside | 3 steps (upload, convert, download) | 2 steps (convert, download) |

**5. Translations** — [i18n/translations.ts](frontend/src/i18n/translations.ts). `germanTranslations`
is `as const` and **defines** `TranslationKey`, so a missing Italian key is a compile error — that is
the safety net. Add `calendarActiveSchedule*` (title, loading, none, noneHint, unavailable, retry,
filename, uploadedAt, uploadedBy, size), `calendarConvertActive`, `calendarUpload*` (title, submit,
uploading, replaceNotice, success), `calendarHelpStepUpload`, and `errorNoActiveSchedule`.

Rewrite `calendarHelpPrivacy` — it is now factually wrong. Suggested de: *"Der hochgeladene Dienstplan
bleibt lokal auf diesem Server; erzeugte Kalender werden nicht gespeichert."*

Remove `converterUploadRestrictedTitle` / `converterUploadRestricted` from both dictionaries — a plain
user now gets a real experience. **This also requires editing
[translations.test.ts:68-82](frontend/src/i18n/translations.test.ts#L68-L82)**, which spot-checks
`converterUploadRestricted` for "Super-User"/"super-utente"; the key-parity test alone does not cover it.

Add `no_active_schedule: "errorNoActiveSchedule"` to `apiErrorTranslationKeys` — the
`satisfies Record<ApiErrorCode, TranslationKey>` makes this a compile error until done.

No interpolation mechanism exists; every string is a standalone label or sentence. Format the
timestamp at render with `new Intl.DateTimeFormat(language, { dateStyle: "medium", timeStyle: "short" })`
using `language` from `useI18n()`.

**6. Styles** — [styles.css](frontend/src/styles.css), existing tokens only: `.active-schedule` (card,
`border-left` in `--color-brand`), `.active-schedule-empty` (`--color-warning`), `.active-schedule-meta`
(`display: grid` dl, mirroring `.result-counts`), `.convert-actions` (`flex-wrap: wrap`),
`.upload-panel` + `.upload-replace-notice`, `.schedule-upload-status` (live region). Remove the three
`.upload-restricted` blocks at lines 884/895/900 — verified unreferenced by
[styles.test.ts](frontend/src/styles.test.ts), so nothing breaks. Extend `styles.test.ts` in its
existing text-regex style for the new classes, keeping `min-height: var(--target-size)` on anything
interactive.

**7. Frontend + e2e tests** — rewrite
[CalendarConverterPage.test.tsx](frontend/src/pages/CalendarConverterPage.test.tsx) (the partial
`vi.mock` now stubs `fetchActiveSchedule`/`uploadActiveSchedule`/`convertActiveSchedule`; the existing
role test becomes "shows a plain user only the schedule, conversion, and download"); new
`ActiveScheduleCard.test.tsx`, `ConversionResultPanel.test.tsx` (both variants against one partial
fixture), `ScheduleUploadForm.test.tsx`; extend
[calendarConverter.test.ts](frontend/src/api/calendarConverter.test.ts) for the three new functions and
the 409 body.

E2E: [database.ts](frontend/e2e/database.ts) gains `E2E_SCHEDULE_STORE` (`data/e2e-schedules`);
[playwright.config.ts](frontend/playwright.config.ts) clears it and sets
`FIREFIGHTER_TOOLS_SCHEDULE_STORE` in both `process.env` and `webServer.env` in the same pre-`webServer`
block that clears the DB; `global-teardown.ts` removes it. Replace the "Upload ist eingeschränkt"
assertion in [access-control.spec.ts](frontend/e2e/access-control.spec.ts) with: a plain user sees the
schedule card and convert button, and still no file input and no diagnostics heading. Reshape
[calendar-converter.spec.ts](frontend/e2e/calendar-converter.spec.ts) around upload-then-convert and
extend its `afterAll` to assert `data/schedules` holds no `.ics`. New `active-schedule.spec.ts` for the
cross-role journey: super-user uploads `partial.csv` and signs out → plain user signs in, sees the
filename, converts, downloads, sees no diagnostics → super-user replaces with `valid.csv` → plain user
sees the new filename. Keep `fullyParallel: false` and have each spec upload what it needs in
`beforeEach` rather than relying on cross-file ordering.

## Proposed TODO.md tasks

Records in [IMPLEMENTATION.md](IMPLEMENTATION.md) use `### TASK-0NN - Title` (H3, space-hyphen-space)
— note this differs from the `## TASK-0NN:` template in AGENTS.md; **follow the file**. New records
belong under the existing `## Post-MVP feature work` heading.

**TASK-040 — Store one active schedule on the server**

> **Ask:** Let a super-user upload a source schedule to the server so it becomes the single active
> schedule, and let every signed-in account start the conversion of that stored schedule and get the
> calendar back. Add the storage, endpoints, and tests for this, and update PLAN.md.

**TASK-041 — Split the converter interface by role**

> **Ask:** Rework the calendar-converter page so a super-user sees the stored schedule, the upload
> control, and the full skipped-event diagnostics, while a plain user sees only which schedule is
> loaded, a convert button, the counts, and the download button. Cover both experiences with component
> and end-to-end tests.

## Files

| File | Change | Task |
|---|---|---|
| [config.py](backend/src/firefighter_tools_backend/config.py) | `schedule_store_dir` + env var | 040 |
| [db/models.py](backend/src/firefighter_tools_backend/db/models.py) | `ActiveScheduleRecord` singleton table | 040 |
| [db/__init__.py](backend/src/firefighter_tools_backend/db/__init__.py) | re-export the new names | 040 |
| `domain/schedule_store.py` | **new** — error codes, `StoredSchedule` | 040 |
| `services/schedule_store.py` | **new** — save/find/load/open + purge | 040 |
| [models/calendar_conversion.py](backend/src/firefighter_tools_backend/models/calendar_conversion.py) | `ActiveSchedule`, `ActiveScheduleResponse`, `NO_ACTIVE_SCHEDULE` | 040 |
| [routes/calendar_converter.py](backend/src/firefighter_tools_backend/routes/calendar_converter.py) | three endpoints + `_STORE_ERRORS` | 040 |
| [scripts/verify.py](scripts/verify.py) | four store invariants | 040 |
| [conftest.py](backend/tests/conftest.py) | store env var, clean fixture, `stored_schedule` | 040 |
| `tests/test_schedule_store_service.py` | **new** | 040 |
| `tests/test_active_schedule_endpoint.py` | **new** | 040 |
| [test_calendar_converter_endpoint.py](backend/tests/test_calendar_converter_endpoint.py) | extend the mapping-parity test | 040 |
| [test_calendar_conversion_models.py](backend/tests/test_calendar_conversion_models.py) | new model cases | 040 |
| [PLAN.md](PLAN.md) / [AGENTS.md](AGENTS.md) / [README.md](README.md) | retention posture, endpoints, workflows | 040 |
| [api/calendarConverter.ts](frontend/src/api/calendarConverter.ts) | 3 functions, 2 guards, new error code | 041 |
| `components/ActiveScheduleCard.tsx` / `ConversionResultPanel.tsx` / `ScheduleUploadForm.tsx` | **new** (+ tests) | 041 |
| [pages/CalendarConverterPage.tsx](frontend/src/pages/CalendarConverterPage.tsx) | orchestration only, 3 state unions | 041 |
| [i18n/translations.ts](frontend/src/i18n/translations.ts) | ~18 keys × 2, rewrite privacy, drop restricted | 041 |
| [i18n/translations.test.ts](frontend/src/i18n/translations.test.ts) | drop the restricted spot-check, add the new code | 041 |
| [styles.css](frontend/src/styles.css) / [styles.test.ts](frontend/src/styles.test.ts) | new classes, remove `.upload-restricted` | 041 |
| [e2e/](frontend/e2e/) + [playwright.config.ts](frontend/playwright.config.ts) | store env, reshaped specs, new cross-role spec | 041 |

## Verification

**Automated**

```shell
# TASK-040
backend/.venv/bin/python -m pytest backend/tests -q         # ~130 passed (from 99)
make verify                                                  # new store invariants report

# TASK-041
cd frontend && ./node_modules/.bin/tsc -b                    # catches a missing it key or unmapped error code
make test-frontend
make test-e2e

# both
make test          # backend, frontend, integration, e2e, verify
git diff --check   # no output
```

**Developer demo**

1. `make run`, open `http://127.0.0.1:8000`, sign in as the super-user.
2. Open the calendar converter — it reports no schedule is loaded. Upload
   `assets/examples/calendar_schedule_example.xlsx`; the card shows the filename, uploader, and time.
3. Press convert → counts, the skipped-event list (if any), and a working ICS download.
4. Sign out, sign in as a plain `user`. The page shows the same schedule card, a convert button, and
   **no** file input and **no** diagnostics. Convert and download successfully.
5. Sign back in as the super-user, upload a different file, and confirm the plain user's page shows
   the new filename.
6. `ls data/schedules` → exactly one opaque `<uuid>.xlsx`; no `.ics` anywhere in the repo.

## Risks / notes

1. **Import-time `settings`.** `settings = load_settings()` runs once at import, so `conftest.py` must
   set the store env var **before** its imports, and the service must read via `store_directory()`.
   Getting this wrong makes tests write into the developer's real `data/schedules/`.
2. **The privacy posture genuinely changes.** A firefighter's roster now sits on disk between
   sessions. The doc rewrites and the new `verify.py` invariants are part of TASK-040's definition of
   done, not cleanup.
3. **Expired session on a page that now fetches on mount.** A 401 body is `AuthErrorResponse`, whose
   `code` is not in `apiErrorCodes`, so the guard fails and the client throws a contract error that the
   page maps to a generic `internal_error`. This pre-exists in `convertCalendar` but the mount-time GET
   makes it far more reachable. Document it; a dedicated session-expiry message is a follow-up.
4. **Replace-during-convert race.** POSIX keeps an open handle valid after unlink and the window is
   microseconds on a single-user loopback app. Document it; do not add locking.
5. **No migration path.** `create_all` handles the new table, but a later column change to
   `active_schedule` has no upgrade story. Record in PLAN.md that this is the trigger for the Alembic
   conversation.
6. **Scope leak into `/convert`.** The 99 existing backend tests are the tripwire — only
   `test_every_expected_domain_error_has_an_http_mapping` should need changing.
7. **Untracked [assets/examples/calendar-cesare.xlsx](assets/examples/calendar-cesare.xlsx)** is staged
   but committed nowhere and referenced by nothing. Unrelated to this work; confirm whether it should
   be committed or dropped.

## Next step

Nothing is queued yet. Once the two asks above are confirmed, use the `/todo-task` skill to append
`TASK-040` to [TODO.md](TODO.md) with its ask verbatim, implement and verify it, record it in
[IMPLEMENTATION.md](IMPLEMENTATION.md), then repeat for `TASK-041`.
