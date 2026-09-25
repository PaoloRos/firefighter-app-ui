---
name: event-plan
description: >-
  Use when the user asks to create, regenerate, or update the event plan — the
  XLSX schedule of shifts and events built from the printed Taschenkalender and
  the member list. Follows event-guideline.md, writes the .xlsx the calendar
  converter accepts, and verifies it with the converter itself. Triggers:
  "create the event plan", "make the schedule from the Taschenkalender",
  "regenerate the event plan", "/event-plan".
---

# Create the event plan

The event plan is an `.xlsx` schedule the calendar converter turns into
per-person ICS calendars. It is built from two references and one set of rules:

- **Rules:** [`event-guideline.md`](../../../event-guideline.md) at the repository
  root. It is the source of truth for the period, output location, shift rules,
  and which event goes to whom. When it disagrees with this skill, follow the
  guideline.
- **Calendar reference** and **employment reference:** the files the guideline
  names (currently `data/taschenkalendar-2026.pdf` and `data/list-users.json`).

Generating the plan is data work, not an implementation task: it needs no
`TODO.md` entry and changes no code.

## Steps

1. **Read the guideline**, then both references it names. Re-read it every run;
   the period, events, and audiences change.

2. **Read the calendar visually.** Which week a name belongs to and which day
   carries an event are shown by layout and highlighting; extracted PDF text
   scrambles both. Render the pages covering the period to PNG in the
   scratchpad and read the images. `pdftoppm` is not installed; use PyMuPDF in a
   scratchpad virtual environment (`python3 -m venv <scratchpad>/venv &&
   <scratchpad>/venv/bin/pip install pymupdf`, then `page.get_pixmap(dpi=400)`).
   For every week (Monday–Sunday) record the names written in it; for every day
   record the highlighted events (`Übung`, `Atemschutz`, `Sitzung`,
   `Weih.-feier`, …). A week with no names has no shift.

3. **Resolve every printed name to exactly one account** in the employment
   reference by surname plus first-name initials (`Zwisch. A.` →
   `zwischenbrugger.andreas`, `Kofler Ch.` → `kofler.christian`, `Theiner F.J.`
   → `theiner.franz-joseph`). If a name matches no account or more than one,
   stop and ask; never guess.

4. **Resolve each audience** in the guideline to accounts. Match qualifications
   case-insensitively after folding umlauts (`ä`→`ae`, `ö`→`oe`, `ü`→`ue`), so
   `atemschutztraeger` matches `Atemschutzträger`; match ranks exactly. When a
   guideline name matches nobody, check for an obvious spelling variant (for
   example `geraewart` for `Geraetewart`), use it, and report it. Otherwise ask.

5. **Build the rows** with the columns of
   `assets/examples/calendar_schedule_example.xlsx`: `id`, `summary`,
   `all_date`, `start_date`, `start_time`, `end_date`, `end_time`, `location`,
   `description`, `participants`.
   - `participants` holds `personnel_number` values exactly as stored (matching
     is case-sensitive) joined by `;`. Leave it empty for events for everybody.
   - **Shifts:** follow the guideline's shift rule. For a night shift, write one
     event per night: start on day D at the start time, end on day D+1 at the end
     time, with that week's names as participants. A week that straddles the
     start of the period contributes only the nights that start inside it.
   - **All-day events:** `all_date` true, `start_date` = `end_date`, no times.
   - **ids** are `<kind>-<yyyy-mm-dd>` (`nachtdienst-2026-10-05`,
     `uebung-2026-10-05`) and must be unique.
   - **Summaries** are German, as printed: `Nachtdienst`, `Übung`,
     `Atemschutz`, `Sitzung`, `Weihnachtsfeier`.
   - Include only the event kinds the guideline names; ignore holidays, moon
     phases, and other printed entries.
   - If the guideline gives no time for an event kind, ask the user. Never
     invent a time.

6. **Write the workbook** with `openpyxl` from `backend/.venv`: real date cells
   for dates, time cells for times, a boolean for `all_date`, text for
   `participants`. Colour rows as the guideline's colour table says: a solid
   `PatternFill` with the listed hex on every cell of the event's row (never
   the header row); event kinds the table does not list get no fill.
   The converter ignores formatting, so colours never change the calendars.
   Save it where the guideline says, creating the directory.

7. **Verify with the converter** from `backend/.venv`:
   `calendar_conversion.convert_schedule(source, filename=..., calendar_name=...)`
   must return `success` with no invalid events. Then convert with
   `participant=` for a few people (a shift member, an audience-only member, the
   super user) and check they get their own events plus the everybody events,
   and nothing else.

8. **Report** the file path, the number of events per kind, how the partial
   first week and any spelling variants were handled, and every decision the
   user made during the run. Do not commit the file: it names members, and
   `assets/` is tracked, so publishing it is the user's call.
