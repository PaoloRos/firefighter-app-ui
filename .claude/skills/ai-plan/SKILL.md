---
name: ai-plan
description: >-
  Use when the user asks for a plan, design, or approach for the work described
  in TODO.md — before any implementation. Reads the TODO.md brief, asks the
  clarifying questions needed to make it decision-complete, and writes the
  finished plan to AI-PLAN.md, replacing whatever that file held. Planning only:
  it never edits code, never queues a TASK entry, and never starts
  implementation. Triggers: "make a plan", "plan this", "plan the TODO",
  "how would you implement TODO.md", "design this before we build it".
---

# Plan the TODO.md work into AI-PLAN.md

`TODO.md` is where the user writes what they want — sometimes as a numbered
`TASK-0NN` queue entry, sometimes as a free-form brief. This skill turns that
into a decision-complete plan and stores it in `AI-PLAN.md`.

Boundaries, every time:

- **Plan only.** Do not edit source files, do not add a `TASK-0NN` entry to
  `TODO.md`, do not start implementing. `AI-PLAN.md` is the only file this skill
  writes.
- **One plan per file.** `AI-PLAN.md` always holds exactly the current plan.
  Overwrite the previous contents; git history preserves them
  (`git log -p AI-PLAN.md`).
- Per `AGENTS.md`, agents never create tasks or rewrite asks. The plan *proposes*
  asks; the user confirms them and then runs `/todo-task`.

## 1. Read the inputs

- `TODO.md` — the brief to plan. Quote its wording rather than paraphrasing it
  into something new.
- `PLAN.md` — the architectural source of truth. Note explicitly when the brief
  contradicts it; changing a boundary means `PLAN.md` must be updated as part of
  the resulting work.
- `IMPLEMENTATION.md` — what already exists and the highest `TASK-0NN`
  identifier (the running counter, so the plan can propose the next ids).
- `AGENTS.md` — structure, style, testing, commit, and security rules the plan
  must respect.
- The actual code for every area the brief touches. A plan that names files,
  functions, or endpoints must name real ones — verify each before writing it
  down.

## 2. Ask before deciding

Where the brief allows materially different implementations, ask the user
instead of guessing. Batch the questions; do not drip-feed them. Record every
answer in the plan under **Decisions (confirmed with the user)** so the plan
reads as settled, not speculative.

Also surface consequences the user may not have considered — a role gate that
leaves one group with no usable feature, churn across existing tests, a
contradiction with `PLAN.md`. Say it plainly in the plan and flag it for
confirmation.

## 3. Write AI-PLAN.md

Replace the file's entire contents with the new plan. Use this shape, dropping
sections that genuinely do not apply:

```markdown
# <Short descriptive plan title>

## Context

What TODO.md asks for, what exists today (with real file references), and how the
two differ. Call out any conflict with PLAN.md.

## Decisions (confirmed with the user)

The clarifying questions and the answers, as a table or list.

## Scope / non-goals

What this work does not include, so the boundary is explicit.

## Implementation

Numbered steps. For each: which files change, what the change is, and the
concrete shape of the new code (signatures, markup, keys, CSS classes) so the
implementation is mechanical rather than exploratory.

## Proposed TODO.md tasks

One block per task, with the next sequential identifier and a suggested `Ask`
for the user to place in TODO.md verbatim once confirmed.

## Files

A table of every file to be created or edited, with a one-line change summary.

## Verification

Automated: the exact commands (`make test`, `make test-backend`,
`make test-frontend`, `make test-e2e`) and what passing looks like.
Developer demo: local startup commands, URLs, and the visible behavior to check.

## Risks / notes

Test churn, migration concerns, security posture, loose ends to confirm during
implementation.
```

Write file references as repo-relative markdown links, e.g.
`[TODO.md](TODO.md)` or `[styles.css](frontend/src/styles.css)`.

Keep the plan specific to this repository: German and Italian translation keys in
lockstep, routes under `/api/v1/`, four-space Python and two-space TypeScript,
loopback-only binding, the 10 MiB upload limit, no retained uploads, no secrets
or generated calendars committed.

## 4. Hand back

Report in chat:

- the plan title and that it is in `AI-PLAN.md`,
- a short summary of the approach,
- the tasks it proposes and their identifiers,
- any open question still needing the user's answer.

Then stop. If the user approves, the next step is the `/todo-task` skill, which
queues the confirmed ask and implements it.
