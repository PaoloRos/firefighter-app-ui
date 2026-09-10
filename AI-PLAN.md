# "Who are you" identity panel on the home page

## Context

`TODO.md` now holds a free-form feature note (the queue template was overwritten): after
login the user wants the **home/dashboard page** to show who is signed in — the username,
the full name in capitals, and `rank` / `zug` / `gruppe` as circled soft-background tags,
with the rank tag colour-coded by seniority.

Today the app already authenticates and exposes every field this needs, but nothing renders
`surname`, `rank`, `zug`, or `gruppe` anywhere — the header `UserMenu` only shows
`name` (or `username`) plus a role badge. This task adds a read-only profile panel to the
dashboard. It is **frontend-only**: `GET /api/v1/auth/me` already returns
`username, role, name, surname, rank, zug, gruppe` (`backend/.../models/auth.py` `SessionUser`),
and `useAuth().user` already carries all of them (`frontend/src/api/auth.ts` `SessionUser`).

## Decisions (confirmed with the user)

1. **Placement** — a panel on the existing home page (`DashboardPage`, route `/`), inserted
   between the `.hero` intro and the tools grid. No new route.
2. **Rank storage** — ranks are stored as the **abbreviations themselves** (`KDT`, `ZKDT`,
   `GKDT`, `FWM`, `KDT-STV`, `GKDT-STV`, …) via `create-user --rank`. A recognised rank is
   displayed in its canonical abbreviation (with a hyphenated `...-STV` for deputies); the
   panel does **not** map full German names → abbreviations. Unknown values render as a
   neutral tag showing the raw text upper-cased.
3. **Deputy colour rule** — a deputy inherits its base rank's colour.
4. **Zug / Gruppe tags** — labelled, e.g. `Zug 1`, `Gruppe 2` (translated prefix + value).

### Rank → colour + canonical label

The stored value is matched **tolerantly** — upper-cased, a spelled-out `STELLVERTRETER`
expanded to `STV`, then every non-alphanumeric char stripped — so `"KDT-STV"`, `"kdt stv"`,
`"Kdt–Stv"`, and `"KDT-Stellvertreter"` all resolve to the same rank. A matched rank is then
**always displayed in its canonical abbreviation**, and a deputy is **always shown with the
`...-STV` suffix** (never a run-together `KDTSTV`).

| Canonical label (displayed) | Colour  | Token trio used |
|-----------------------------|---------|-----------------|
| `KDT`, `KDT-STV`            | red     | `--color-danger` / `-border` / `-surface` |
| `ZKDT`, `ZKDT-STV`, `GKDT`, `GKDT-STV` | yellow | `--color-warning` / `-border` / `-surface` |
| `FWM`                      | neutral | `--color-canvas-accent` + `--color-border-strong` + `--color-text` (the existing pill look) |
| any unrecognised value     | neutral | same neutral pill; label = the raw trimmed value upper-cased, except a value ending in `STV` is rendered `<BASE>-STV` |

`ZKDT-STV` is not in the user's written list but follows from the confirmed deputy rule.

## Scope / non-goals

- No backend, DB, CLI, or API-contract change.
- No change to the header `UserMenu` (the small header identity and the fuller home panel
  intentionally overlap).
- No rank validation added to `create-user` (out of scope; free-form stays free-form).
- Capitalisation of the name is done with CSS `text-transform`, not by transforming the
  string — screen readers and copy/paste keep the real casing.
- Colour is never the only signal: the rank abbreviation text differs (`KDT` vs `FWM`) and a
  visually-hidden "Dienstgrad:" label precedes it.

## Implementation

### 1. Queue the task as `TASK-039`

Restore the `TODO.md` queue structure (header + `## TASK-039: Add the "Who are you" home
identity panel` + `**Ask:**` set to the user's current note **verbatim**). Highest recorded
id is `TASK-038` in `IMPLEMENTATION.md`, so this is `TASK-039`. Use the `/todo-task` skill
for the queue/history bookkeeping.

### 2. Rank presentation helper — `frontend/src/components/rankPresentation.ts` (new)

Pure, dependency-free, mirrors the existing stable-code pattern
(`translateApiErrorCode` in `frontend/src/i18n/translations.ts`).

```ts
export type RankColor = "red" | "yellow" | "neutral";
export type RankPresentation = { label: string; color: RankColor };

// Keyed by the tolerant match key (see below). Labels are the canonical
// abbreviations; deputies always carry the hyphenated "-STV" suffix.
const KNOWN_RANKS: Record<string, RankPresentation> = {
  KDT:     { label: "KDT",      color: "red" },
  KDTSTV:  { label: "KDT-STV",  color: "red" },
  ZKDT:    { label: "ZKDT",     color: "yellow" },
  ZKDTSTV: { label: "ZKDT-STV", color: "yellow" },
  GKDT:    { label: "GKDT",     color: "yellow" },
  GKDTSTV: { label: "GKDT-STV", color: "yellow" },
  FWM:     { label: "FWM",      color: "neutral" },
};

export function presentRank(rawRank: string): RankPresentation | null {
  const trimmed = rawRank.trim();
  if (trimmed === "") return null;

  const key = trimmed
    .toUpperCase()
    .replace(/STELLVERTRETER/g, "STV") // spelled-out deputy → STV
    .replace(/[^A-Z0-9]/g, "");        // drop hyphens/spaces/punctuation

  const known = KNOWN_RANKS[key];
  if (known) return known;

  // Unknown rank stays neutral, but a deputy still reads "<BASE>-STV".
  if (key.length > 3 && key.endsWith("STV")) {
    return { label: `${key.slice(0, -3)}-STV`, color: "neutral" };
  }
  return { label: trimmed.toUpperCase(), color: "neutral" };
}
```

### 3. `frontend/src/components/IdentityPanel.tsx` (new)

Follows `UserMenu.tsx` conventions (2-space indent, `useAuth()` + `useI18n()`, early
`return null` when `user === null`).

Rendered markup:

```tsx
<section className="panel identity-panel" aria-labelledby="identity-heading">
  <h2 id="identity-heading" className="identity-heading">{t("identityHeading")}</h2>

  <p className="identity-account">
    <span className="identity-account-label">{t("authSignedInAs")}</span>
    <span className="identity-username">{user.username}</span>
  </p>

  {fullName && <p className="identity-fullname">{fullName}</p>}

  {tags.length > 0 && (
    <ul className="identity-tags" aria-label={t("identityProfileLabel")}>
      {rank && (
        <li className={`identity-tag${rank.color !== "neutral" ? ` identity-tag-rank-${rank.color}` : ""}`}>
          <span className="visually-hidden">{t("identityRankLabel")}: </span>{rank.label}
        </li>
      )}
      {zug && <li className="identity-tag">{t("identityZugLabel")} {zug}</li>}
      {gruppe && <li className="identity-tag">{t("identityGruppeLabel")} {gruppe}</li>}
    </ul>
  )}
</section>
```

Data handling:
- `fullName = [user.name, user.surname].filter(Boolean).join(" ")` — omit the line when empty.
- `rank = user.rank ? presentRank(user.rank) : null` — omit the tag when null/blank.
- `zug` / `gruppe` — trim; omit the tag when null/blank.
- `.visually-hidden` already exists in `styles.css` (used by the skip link / native picker).

### 4. Wire into `frontend/src/pages/DashboardPage.tsx`

Import `IdentityPanel` and render `<IdentityPanel />` between the closing `</section>` of
`.hero` and the tools `<section>`. `DashboardPage` does not currently call `useAuth()`;
it does not need to — the panel reads auth itself. Route `/` is already `RequireAuth`-gated,
so `user` is present in practice.

### 5. Translation keys — `frontend/src/i18n/translations.ts`

Add the same keys to `germanTranslations` and `italianTranslations` (the parity test in
`translations.test.ts` enforces identical key sets). Reuse the existing `authSignedInAs`
key for "Angemeldet als" / "Connesso come".

| key                   | de           | it (confirm org wording) |
|-----------------------|--------------|--------------------------|
| `identityHeading`     | `Wer bist du`| `Chi sei`                |
| `identityProfileLabel`| `Dienstprofil` | `Profilo di servizio`  |
| `identityRankLabel`   | `Dienstgrad` | `Grado`                  |
| `identityZugLabel`    | `Zug`        | `Plotone`                |
| `identityGruppeLabel` | `Gruppe`     | `Squadra`                |

**Loose end to confirm during implementation:** whether Italian should keep `Zug` / `Gruppe`
as-is (org-internal terms, like the untranslated brand) rather than `Plotone` / `Squadra`.
Ask the user; it is a one-line change either way.

### 6. Styles — append to `frontend/src/styles.css`

New classes only; **no new tokens** (reuse `--color-danger-*`, `--color-warning-*`,
`--color-canvas-accent`, `--color-border-strong`, spacing/radius/type scale). Model the pill
on the existing `.role-badge` / `.tool-formats li`.

```css
/* Identity panel (home) */
.identity-panel {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  max-width: var(--reading-width);
  margin-bottom: var(--space-8);
}
.identity-heading {
  margin: 0;
  font-size: var(--font-size-sm);
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--color-text-muted);
}
.identity-account { display: flex; flex-wrap: wrap; gap: var(--space-1) var(--space-2); margin: 0; font-size: var(--font-size-sm); }
.identity-account-label { color: var(--color-text-muted); font-weight: 650; }
.identity-username { font-weight: 750; overflow-wrap: anywhere; }
.identity-fullname {
  margin: 0;
  font-size: var(--font-size-heading-sm);
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  overflow-wrap: anywhere;
}
.identity-tags { display: flex; flex-wrap: wrap; gap: var(--space-2); margin: 0; padding: 0; list-style: none; }
.identity-tag {
  display: inline-flex;
  align-items: center;
  min-height: 1.75rem;
  padding: var(--space-1) var(--space-3);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-pill);
  background: var(--color-canvas-accent);
  color: var(--color-text);
  font-size: var(--font-size-sm);
  font-weight: 750;
}
.identity-tag-rank-red { border-color: var(--color-danger-border); background: var(--color-danger-surface); color: var(--color-danger); }
.identity-tag-rank-yellow { border-color: var(--color-warning-border); background: var(--color-warning-surface); color: var(--color-warning); }
```

Tags already wrap (`flex-wrap`), the panel is width-capped, and every value uses
`overflow-wrap: anywhere`, so there is no 320 px overflow risk. Nothing here is interactive,
so the 44 px target rule does not apply.

### 7. Tests

- **`frontend/src/components/rankPresentation.test.ts`** (new, pure): `KDT`→
  `{label:"KDT",color:"red"}`; canonical-label cases `kdt-stv`, `KDTSTV`, `KDT STV`, and
  `KDT-Stellvertreter` all →`{label:"KDT-STV",color:"red"}`; `ZKDT`→yellow;
  `ZKDT-STV`→`{label:"ZKDT-STV",color:"yellow"}` (deputy rule); `GKDT`→yellow;
  `GKDT-STV`→yellow; `FWM`→`{label:"FWM",color:"neutral"}`; unknown (`"Löschmeister"`)→
  `{label:"LÖSCHMEISTER",color:"neutral"}`; unknown deputy (`"LM-STV"`)→
  `{label:"LM-STV",color:"neutral"}`; `""` / `"   "`→`null`.
- **`frontend/src/components/IdentityPanel.test.tsx`** (new): render with
  `renderApp("/", { user: { ...SUPER_USER, name:"Mario", surname:"Rossi", rank:"KDT", zug:"1", gruppe:"2" } })`
  (helper at `frontend/src/test/renderApp.tsx`). Assert: "Angemeldet als" + username shown;
  `.identity-fullname` element contains `Mario Rossi`; rank tag text `KDT` with class
  `identity-tag-rank-red`; `GKDT-STV` → `identity-tag-rank-yellow`; `FWM` → no rank-colour
  modifier; visible `Zug 1` / `Gruppe 2`; with `rank/zug/gruppe: null` those tags are absent
  and, with `name`+`surname` null, `.identity-fullname` is absent; Italian variant via
  `window.localStorage.setItem(LANGUAGE_STORAGE_KEY, "it")` shows `Connesso come` + the IT
  prefixes.
- **`frontend/src/pages/DashboardPage.test.tsx`**: add one assertion that the panel renders
  (`screen.getByRole("heading", { name: "Wer bist du" })`) ahead of the tool card; confirm
  the existing `getAllByRole("article")` length-1 assertion still holds (the panel is a
  `<section>`, not an `article`).
- **`frontend/src/styles.test.ts`**: extend the contract test — stylesheet contains
  `.identity-panel`; `.identity-fullname` rule contains `text-transform: uppercase`;
  `.identity-tag` rule contains `border-radius: var(--radius-pill)`;
  `.identity-tag-rank-red` references `var(--color-danger`; `.identity-tag-rank-yellow`
  references `var(--color-warning`.
- **`frontend/src/i18n/translations.test.ts`**: the key-parity `it()` covers the new keys
  automatically; add a spot-check that `identityHeading` differs between de and it.
- Optional: add a line to `frontend/e2e/access-control.spec.ts` asserting the signed-in
  dashboard shows the "Wer bist du" heading (kept minimal; `make test` already runs e2e).

### 8. Record completion

Move `TASK-039` out of `TODO.md` (back to `_None queued._`) and append the full record to
`IMPLEMENTATION.md` with `Answer`, `Automated test`, and `Developer demo` sections
(required since `TASK-004`), filling in the real post-change frontend test count.

## Files

| File | Change |
|------|--------|
| `TODO.md` | Restore queue template; add then later remove `TASK-039` |
| `IMPLEMENTATION.md` | Append the completed `TASK-039` record |
| `frontend/src/components/rankPresentation.ts` | **new** — `presentRank()` |
| `frontend/src/components/rankPresentation.test.ts` | **new** |
| `frontend/src/components/IdentityPanel.tsx` | **new** — the panel |
| `frontend/src/components/IdentityPanel.test.tsx` | **new** |
| `frontend/src/pages/DashboardPage.tsx` | render `<IdentityPanel />` between hero and tools |
| `frontend/src/pages/DashboardPage.test.tsx` | one added assertion |
| `frontend/src/i18n/translations.ts` | 5 new keys × 2 languages |
| `frontend/src/i18n/translations.test.ts` | spot-check for `identityHeading` |
| `frontend/src/styles.css` | append `.identity-*` rules |
| `frontend/src/styles.test.ts` | contract assertions for the new classes |

## Verification

**Automated (from repo root unless noted):**

1. `cd frontend && ./node_modules/.bin/vitest run` — all suites pass, including the new
   `rankPresentation` and `IdentityPanel` tests.
2. From `frontend/`: `./node_modules/.bin/tsc -b && ./node_modules/.bin/vite build` —
   strict type-check and production build succeed.
3. `make test` — backend (99, unchanged), frontend (new total), integration, and Playwright
   e2e stages all pass.
4. `git diff --check` — no output.

**Developer demo:**

1. Create an account with a full profile:
   `backend/.venv/bin/python -m firefighter_tools_backend create-user --username chief --role super_user --name Mario --surname Rossi --rank KDT --zug 1 --gruppe 2`
   (repeat with `--rank GKDT-STV` and `--rank FWM` for other accounts).
2. `make dev` (or `make run`), open `http://127.0.0.1:5173/`, sign in.
3. Confirm the home page shows, above the tool card: `Angemeldet als chief`, `MARIO ROSSI`
   in capitals, and three circled soft-background tags — `KDT` in red, `Zug 1` and
   `Gruppe 2` in neutral. Sign in as the other accounts and confirm `GKDT-STV` is amber and
   `FWM` is neutral.
4. Switch `Deutsch` ↔ `Italiano`: heading, "Angemeldet als"/"Connesso come", and the
   Zug/Gruppe prefixes translate; abbreviations stay unchanged.
5. Resize to ~320 px — tags wrap, no horizontal scrolling. Set browser zoom to 200% — the
   panel reflows without clipping.
6. Sign in as an account with no `rank`/`zug`/`gruppe`/`surname` and confirm the panel
   gracefully shows only `Angemeldet als …` and the first name.


## Context

[TODO.md](../../Develop/firefighter-app-ui/TODO.md) currently holds an **un-numbered design brief** ("Implementation of database"), not a `TASK-0NN` entry. It proposes a scope expansion:

- A persisted **user database**.
- Two roles: **`super-user`** (may upload calendar source files) and **`user`** (may only use tools / download).
- A `user` starts with the attributes `name`, `surname`, `rank`, `zug`, `gruppe`.
- Future (explicitly out of scope now): the calendar tool returns a calendar *specific to the signed-in user*.

This contradicts [PLAN.md](../../Develop/firefighter-app-ui/PLAN.md), which today states *"The MVP has no accounts, database, analytics, background jobs, or server-side file history."* Per `AGENTS.md`, `PLAN.md` is the architectural source of truth and must be updated when boundaries change.

The app runs **only on `127.0.0.1`**. Auth here is primarily about *role-gating behaviour on a trusted single machine* and preparing for the future per-user calendar feature — not internet-grade security (TLS, rate limiting, etc. remain a later phase).

### Decisions already taken (via clarifying questions)

| Question | Decision |
| --- | --- |
| How does a person authenticate? | **Username + password + session cookie** (hashed passwords, signed session). |
| Where do user records live? | **SQLite + SQLAlchemy** (first persistence in the project). |
| How is the work queued? | **Phased: `TASK-036`, `TASK-037`, `TASK-038`.** |
| What about `PLAN.md`? | **Update it now** to make the user/role model part of the architecture. |

### Consequence to make explicit for the user

The **only current tool** is upload → convert → download, and that whole flow runs through the single `POST /api/v1/tools/calendar-converter/convert` endpoint, which consumes an upload. Gating uploads to `super-user` therefore means a plain `user` has **no usable tool yet** — the "download a calendar specific to the user" capability that would give normal users something to do is deferred by the brief itself. The plan handles this by showing normal users an explanatory panel where the upload form would be. This is worth confirming is acceptable before implementation.

---

## Architecture: how auth fits the existing layering

The backend already separates `routes → services → adapters → external`, with `models/` (Pydantic, HTTP-facing) and `domain/` (pure dataclasses/enums). The new work mirrors that exactly:

```
backend/src/firefighter_tools_backend/
  config.py                      # NEW: typed settings (pydantic-settings)
  db/                            # NEW: SQLAlchemy engine, Base, session factory
    __init__.py
    engine.py                    #   create_engine(settings.database_url), SessionLocal
    models.py                    #   UserRecord table (ORM)
  domain/user.py                 # NEW: User dataclass, Role enum, typed auth errors + codes
  adapters/user_repository.py    # NEW: CRUD over UserRecord <-> domain User
  services/auth.py               # NEW: hash_password, verify_password, authenticate, get_user
  models/auth.py                 # NEW: LoginRequest, SessionUser, AuthErrorResponse, AuthErrorCode
  routes/auth.py                 # NEW: POST /login, POST /logout, GET /me
  dependencies.py                # NEW: get_db, get_current_user, require_super_user
  main.py                        # EDIT: SessionMiddleware, lifespan create_all, include auth_router
  routes/calendar_converter.py   # EDIT: Depends(require_super_user) on /convert
  __main__.py                    # EDIT: `create-user` subcommand (expanded in TASK-038)
```

Frontend mirrors the existing `I18nProvider` context pattern:

```
frontend/src/
  api/auth.ts                    # NEW: login/logout/fetchCurrentUser + runtime contract guards
  auth/AuthProvider.tsx          # NEW: <AuthProvider> + useAuth() (shape copied from I18nProvider)
  components/RequireAuth.tsx     # NEW: route guard -> redirect to /login
  components/RequireSuperUser.tsx# NEW: role guard for the upload surface
  components/UserMenu.tsx        # NEW: "signed in as", role badge, sign-out (goes in .header-actions)
  pages/LoginPage.tsx            # NEW: /login form
  App.tsx                        # EDIT: wrap in <AuthProvider>, add /login, guard existing routes
  pages/CalendarConverterPage.tsx# EDIT: gate the upload <form> behind super-user
  i18n/translations.ts           # EDIT: add auth*/login*/role* keys to BOTH de and it dicts
  styles.css                     # EDIT: login form, user menu, role badge
```

### Session mechanism

Starlette `SessionMiddleware` (signed cookie, needs `itsdangerous`). The cookie stores only `user_id`; `httponly`, `samesite=lax`, `secure=false` (loopback http). Secret from `FIREFIGHTER_TOOLS_SECRET_KEY` env var with a dev-only default in `config.py`. Logout = `request.session.clear()`. No CORS changes needed — dev traffic is same-origin through the Vite proxy, prod is single-origin; `fetch` sends same-origin cookies by default, so the existing calendar-converter client needs no change (its "no credentials header" test stays valid).

### New backend dependencies (`backend/pyproject.toml` `[project.dependencies]`)

- `sqlalchemy>=2,<3`
- `pydantic-settings>=2,<3`
- `pwdlib[argon2]>=0.2` (modern password hashing; argon2)
- `itsdangerous>=2,<3` (SessionMiddleware signing)

`make setup` already runs `pip install -e 'backend[test]'`, so it picks these up with no Makefile change.

### `.gitignore`

Add `*.db`, `*.sqlite3`, and `data/` (default DB path `sqlite:///./data/firefighter.db`). `.env` / `.env.*` are already ignored. `scripts/verify.py` only flags stray `.ics` files, so a local `.db` does not trip it.

---

## TASK-036 — Backend user store, authentication, and endpoint gating

**Ask (for the user to place in `TODO.md`):** Add a SQLite user database with `super-user` and `user` roles, username/password authentication with a session cookie, and gate the calendar-converter upload endpoint to `super-user`.

Scope:

1. **`config.py`** — `Settings(BaseSettings)`: `database_url` (default `sqlite:///./data/firefighter.db`), `secret_key` (dev default + warning), `session_cookie_name`, `session_max_age`. `.env` support via `pydantic-settings`.
2. **`db/`** — `Base`, `engine`, `SessionLocal`. `UserRecord`: `id` PK, `username` unique/indexed, `password_hash`, `role` (`super_user` | `user`), `name`, `surname`, `rank`, `zug`, `gruppe` (nullable strings for MVP), `created_at`.
3. **`domain/user.py`** — frozen `User` dataclass, `Role` enum, `AuthError` + `AuthErrorCode` (`invalid_credentials`, `not_authenticated`, `forbidden`), following the existing `domain/upload.py` error style.
4. **`adapters/user_repository.py`** — `get_by_username`, `get_by_id`, `add`, `list_all`, `set_password_hash`, `delete`; maps `UserRecord` ↔ domain `User` (never returns the hash outside the service layer).
5. **`services/auth.py`** — `hash_password`, `verify_password` (pwdlib argon2), `authenticate(session, username, password) -> User`, `get_user(session, user_id)`.
6. **`models/auth.py`** — `LoginRequest{username,password}`; `SessionUser` (safe public shape: `username`, `role`, `name`, `surname`, `rank`, `zug`, `gruppe` — no hash); `AuthErrorResponse{code,message}` extending the existing `ContractModel` (`extra="forbid"`).
7. **`dependencies.py`** — `get_db` (yields a session), `get_current_user` (reads `request.session["user_id"]`, 401 `AuthErrorResponse` if absent/invalid), `require_super_user` (403 if `role != super_user`).
8. **`routes/auth.py`** — `POST /api/v1/auth/login` (sets session, returns `SessionUser`), `POST /api/v1/auth/logout` (clears session), `GET /api/v1/auth/me` (returns `SessionUser` or 401).
9. **`main.py`** — add `SessionMiddleware`; add a `lifespan` that runs `Base.metadata.create_all` (Alembic noted as a later addition, not MVP); `include_router(auth_router, prefix=API_PREFIX)`. Keep the SPA catch-all registered last (it already 404s `/api/...`).
10. **`routes/calendar_converter.py`** — add `_: User = Depends(require_super_user)` to `convert_calendar_upload`. Add `Depends(get_current_user)` to `GET /example` (any signed-in user may download). `GET /health` stays public.
11. **`__main__.py`** — add a `create-user` subcommand (`--username`, `--role`, `--name/--surname/--rank/--zug/--gruppe`, password via `getpass`, never echoed or logged). Needed so TASK-036's own tests/demo can create the first super-user; TASK-038 expands the CLI.
12. **`.gitignore`** — add `*.db`, `*.sqlite3`, `data/`.
13. **Tests** — `backend/tests/conftest.py` (first in repo): in-memory SQLite engine, `get_db` dependency override, `client`, `super_user_client`, `user_client` fixtures. New `tests/test_auth.py`: login success/failure, `/me`, logout, `require_super_user` returns 401 vs 403, password stored as argon2 hash (never plaintext), no traceback leakage. **Update existing** `test_calendar_converter_endpoint.py`, `test_calendar_converter_boundaries.py`, `test_production_frontend.py` to call `/convert` and `/example` through an authenticated super-user client (this is unavoidable churn — the un-authenticated calls now return 401/403). The AST import-guard test still passes (no `subprocess` import added).
14. **`AGENTS.md` security section** — add a bullet: passwords are argon2-hashed and never logged; the SQLite DB and `.env` are git-ignored; the session secret comes from the environment.

Reuse: existing `ContractModel` (`models/calendar_conversion.py:11`), the `domain/` error-with-code pattern (`domain/upload.py`), the per-file `client` fixture pattern already in the converter tests.

---

## TASK-037 — Frontend identity and role-gated UI

**Ask (for the user to place in `TODO.md`):** Add a bilingual login screen, an auth context, route guards, a header user menu with sign-out, and hide the calendar-converter upload form from non-`super-user` accounts.

Scope:

1. **`src/api/auth.ts`** — `login(username,password)`, `logout()`, `fetchCurrentUser()`; TS types matching `SessionUser` / `AuthErrorResponse`; runtime type-guards and a `AuthContractError`, mirroring `src/api/calendarConverter.ts`. Relies on the default `same-origin` fetch credentials.
2. **`src/auth/AuthProvider.tsx`** — `createContext<AuthContextValue | null>(null)`, provider holding `{ user, status: "loading"|"authenticated"|"anonymous", login, logout }`, calls `fetchCurrentUser()` on mount, `useI18n`-style `useAuth()` hook that throws outside the provider. No token in storage (cookie is `httponly`; re-fetch `/me` on load).
3. **`src/pages/LoginPage.tsx`** — accessible form (labelled inputs, `role="alert"` error, visible focus), redirects to the intended route or `/` on success.
4. **`src/components/RequireAuth.tsx`** — while `loading` render a spinner/nothing; if `anonymous` `<Navigate to="/login" state={{from}}>`; else render children. **`RequireSuperUser.tsx`** — same, but checks `user.role`.
5. **`src/components/UserMenu.tsx`** — "signed in as {name}", role badge, sign-out button; placed in `.header-actions` in `App.tsx` beside `<LanguageSwitch />` (the flex row already adapts on mobile).
6. **`App.tsx`** — wrap `<AppContent />` in `<AuthProvider>` (nested with `<I18nProvider>`); add `<Route path="/login">`; wrap `/` and `/tools/calendar-converter` elements in `<RequireAuth>`.
7. **`src/pages/CalendarConverterPage.tsx`** — wrap the upload `<form>` block (drop zone + file input + submit) so it renders only for `super_user`; for a plain `user`, render a translated info panel ("upload is restricted to super-users; personalised downloads are coming in a future version"). The example-download link and help panel stay visible.
8. **`src/i18n/translations.ts`** — add keys to **both** `germanTranslations` and `italianTranslations` (the parity test enforces lockstep): `authSignIn`, `authSignOut`, `authSignedInAs`, `authUsername`, `authPassword`, `authInvalidCredentials`, `authSessionExpired`, `roleSuperUser`, `roleUser`, `converterUploadRestricted`, plus labels for `rank` / `zug` / `gruppe` if surfaced.
9. **`src/styles.css`** — login form, user menu, role badge; keep 44 px targets, AA contrast, visible focus, no 320 px overflow (existing stylesheet contract tests).
10. **Tests** — a `renderWithProviders` helper wrapping `<AuthProvider>` + `<I18nProvider>` + router, with `fetchCurrentUser` mocked (`vi.mock`, as `convertCalendar` is mocked today). Update `App.test.tsx`, `DashboardPage.test.tsx`, `CalendarConverterPage.test.tsx` to render authenticated; new `LoginPage.test.tsx`, `AuthProvider.test.tsx`. This is broad but mechanical churn.
11. **E2E** (`frontend/e2e/`) — add a Playwright `globalSetup` that seeds a super-user and a plain user in a temp DB (via the `create-user` CLI), a login helper, and update the specs to sign in first; add one spec asserting a plain user cannot see the upload form.

Reuse: `I18nProvider.tsx` shape (context + hook + provider), the `vi.mock` + `vi.fn()` stub pattern from `CalendarConverterPage.test.tsx`, the Map-backed `localStorage` mock already in `src/test/setup.ts`.

---

## TASK-038 — User administration

**Ask (for the user to place in `TODO.md`):** Provide commands to create, list, update the password of, and delete users, plus first-run documentation for creating the initial super-user.

Scope:

1. **`__main__.py`** — expand the CLI: `create-user` (from TASK-036), `list-users` (username, role, profile fields — never the hash), `set-password` (getpass), `delete-user`. All password input via `getpass`, never echoed, never logged.
2. **Optional (confirm scope with user):** a `super-user`-only `GET /api/v1/users` + `POST /api/v1/users` and a minimal admin page. Recommendation: **CLI-first for MVP**, admin UI as a follow-up task — the brief does not ask for a management UI.
3. **Docs** — README "User accounts" section: create a super-user before first login, role meanings, where the DB file lives, that it is git-ignored and never committed. A `make create-user` convenience target (optional).
4. **Seeding** — document `python -m firefighter_tools_backend create-user ...`. Optionally a `--from-file users.json` importer where the file carries profile fields only (no passwords — prompt per user, or generate and print once).
5. **Tests** — `backend/tests/test_user_cli.py`: create/list/set-password/delete round-trip against a temp DB; asserts listing never prints a hash.

---

## Cross-cutting: `PLAN.md` update (part of TASK-036)

- **Architecture and Interfaces** — add a "Users and access control" subsection; extend the mermaid diagram with an auth boundary and the SQLite user store; document `POST /api/v1/auth/login|logout` and `GET /api/v1/auth/me`; note `/convert` requires `super-user`.
- **Assumptions and Later Roadmap** — replace *"The MVP has no accounts, database…"* with: accounts and a local SQLite user store are now in scope; analytics, background jobs, and server-side *file* history remain out. Keep the note that internet publication (TLS, rate limiting, real session hardening) is still a separate phase.
- **Test Plan and Acceptance Criteria** — add bullets for authentication, role gating, and the "plain user sees no upload form" behaviour.

---

## Verification

Per-task automated tests (run from repo root unless noted):

- **TASK-036:** `make test-backend` — new `tests/test_auth.py` passes; updated converter/production tests pass with the authenticated fixtures. `make verify` still green (loopback host, no retained `.ics`). Manual demo: `backend/.venv/bin/python -m firefighter_tools_backend create-user --username chief --role super_user`, then `make run`, then `curl -i -c jar -b jar -X POST 127.0.0.1:8000/api/v1/auth/login -H 'content-type: application/json' -d '{"username":"chief","password":"…"}'` → 200 + `Set-Cookie`; `curl -b jar 127.0.0.1:8000/api/v1/auth/me` → the user; `POST /api/v1/tools/calendar-converter/convert` without the cookie → 401, with a plain-user cookie → 403, with the super-user cookie → normal conversion.
- **TASK-037:** `make test-frontend` — updated + new Vitest suites pass. `make test-e2e` — login flow + "plain user has no upload form" spec pass. Manual demo: `make run`, open `http://127.0.0.1:8000`, get redirected to `/login`, sign in as the super-user → dashboard + converter upload form visible + user menu shows the name and a "Super-User" badge; sign out → back to `/login`; sign in as a plain user → converter page shows the restriction panel, no file input.
- **TASK-038:** `make test-backend` — `tests/test_user_cli.py` passes. Manual demo: `python -m firefighter_tools_backend list-users` shows both accounts with roles and no hashes; `set-password` then re-login works; `delete-user` then login fails with `invalid_credentials`.

Full gate before declaring any task done: `make test` (backend, frontend, integration, e2e, verify) from the repo root.

---

## Risks / notes

- **Test churn.** Introducing auth breaks every backend test that calls `/convert` unauthenticated and every frontend test that renders `<App />`. Both are updated within their owning task (036 backend, 037 frontend) via shared fixtures/helpers — mechanical but touches many files.
- **Plain users have no tool until the future per-user calendar feature.** Handled with an explanatory panel; confirm this UX is acceptable.
- **`create_all` vs migrations.** MVP uses `Base.metadata.create_all`; Alembic is a sensible later addition once the schema evolves (e.g. when the per-user calendar feature adds columns).
- **Loopback-only security posture is unchanged.** Anyone with an account on the machine can reach the server; passwords/roles gate *behaviour*, not the network. Real hardening stays a later phase, as `PLAN.md` will continue to state.

## Process note

Per `AGENTS.md`, agents must not create `TODO.md` task entries until the user confirms. This plan proposes the three asks above; once you approve, use the `/todo-task` skill to append `TASK-036` (verbatim ask), implement and verify it, record it in `IMPLEMENTATION.md`, then repeat for `TASK-037` and `TASK-038`. `TASK-035` is the current highest identifier.