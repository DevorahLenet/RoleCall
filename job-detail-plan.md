# Job detail — plan

Route `/jobs/:id`. **Built** — see the status note at the foot of this file for what shipped, what changed, and what is still owed. Product context is stories 2 and 3 in [../rolecall_plan.md](../rolecall_plan.md): everything about one job at a glance, plus the deeper material behind it.

## What this page is for

It's the **per-job workspace** — the place you land when you want to know where one application stands and do something about it. Distinct from Today, which is cross-job and asks "what do I do now." This page asks "what's the state of this one, and what's outstanding."

## Layout

**Single column.** Every section here is a list, and lists want width. A main-plus-rail split would squeeze the rows and complicate both breakpoints for no real gain.

- **Toolbar** owns the page title per `CLAUDE.md` — the title is the **role**. Screens don't render their own `<h1>`.
- **Header block** directly beneath: company · status control · applied date · posting link · contacts.
- Then the sections, in this order: **Tasks → Questions → Notes**.

Tasks first because they're what you act on. Questions above Notes because open questions are pending decisions and they're short — Notes can run long and would push them below the fold.

## Fields

**Header — from the `job` table**

| Field | Treatment |
|---|---|
| `role` | Toolbar title |
| `company` | Beneath the title |
| `status` | Status badge from `statuses.json`, **editable inline** — this is the most frequent edit on the page, so it shouldn't be buried behind an edit mode |
| `applied_on` | Null until applied, so *"not applied yet"* is a real state the header must render, not an empty gap |
| `posting_url` | Link out with an external-link icon; blank for paper ads and referrals — see HaShadchan in `seed.local.json` |
| `created_at` | "Added" meta, low emphasis |

**Contacts** — M2M, rendered as a compact row of chips in the header rather than a full section. Story 2 asks for contacts *at a glance*, and a person can appear on several jobs.

**Tasks** — `title`, `status`, `priority`, `is_done`, `due_on`. Reuse the Today row treatment; don't build a second task row component. Inline add.

**Questions** — open ones first, resolved ones collapsed with their `answer` visible. Inline add. Resolving is a two-part action: capture the answer, then stamp `resolved_at`.

**Notes** — reverse-chronological, inline add. This is the logbook, and the highest-traffic section once a job is live.

**No count badges anywhere.** Section headers are labels, not dashboards.

## Writing lives in the drawer, not on the page

There is **no writing section on this page.** Writing is reached through a right-docked drawer, triggered from the Toolbar.

The drawer does three things:

1. **This job's writing at the top** — pieces already attached, auto-filtered.
2. **Search the whole library beneath it** — passages, not documents, per [writing-library-plan.md](writing-library-plan.md).
3. **New piece for this job** — creates a `writing_piece` with `job_id` set.

That third item matters more than it looks. The writing library only stays current because writing created on a job lands there automatically; if the drawer were pull-only, new writing would have to be authored from `/writing` and remembered to be linked, which is exactly the manual step that lets a library rot. The drawer is both directions.

## Three fields that don't exist yet

**`description_summary`** — story 3 explicitly asks for a job description summary and there's no column for it. This is a live gap, not a theoretical one: when `seed.local.json` was rebuilt, all the JD content (requirements, responsibilities, comp band, location) had nowhere to go and was dropped rather than misfiled as notes. This page is where that absence becomes obvious.

**Fit assessment** — the source material is full of it ("~8.5/10 fit," "stretch — PM craft matches, security domain is the gap"). Also homeless. Either a section of `description_summary` or its own `fit_notes` / `fit_score` pair.

**Job priority** — stories 4–6 want jobs rated and sorted by priority. `Task` has `priority`; `Job` doesn't. Not needed for this page to work, but it would live in the header when it lands.

The first two are worth settling **before** building, since adding a field afterward means a migration plus a layout revision. The third can wait.

## Sequencing

- Needs `/jobs` to exist first, or at least a route that can link here.
- The writing drawer needs `writing_piece` / `writing_passage` to exist. Build the page without it and add the Toolbar trigger when the library lands — nothing else on the page depends on it.
- Tasks, Questions, Notes and Contacts all have their tables already.

## Watch items

- **Reuse the Today task row.** Two task row components will drift apart within a month.
- **Status is the frequent edit; everything else is rare.** Don't put the whole header behind an edit mode to accommodate the rare case — inline-edit status, and let the rest be an edit affordance on the fields themselves.
- **Empty states matter here more than on Today.** A job in `researching` has no applied date, probably no tasks, no notes, no questions and no writing. That's the *normal* state for ten of the nineteen jobs in the seed data, so the page has to look deliberate when almost everything is empty rather than looking broken.

---

## Status — built (Aug 2026)

Everything above shipped except the writing drawer. `routes/JobDetail.tsx` is the page; `CLAUDE.md` records the behaviour, `design-system/design-system.md` §5 the design rules.

**The three homeless fields, settled.** `description_summary`, `fit_score` and `fit_notes` are columns on `Job` (migration `0002`). Fit went to its **own score + notes pair** rather than a section of the summary: a score in its own column is what lets stories 4-6 rank jobs later without parsing "~8.5/10" back out of a paragraph. The score is 0-10 to one decimal, null when unrated, with a DB check constraint behind the serializer's range.

**Job priority is still deferred, and it now overlaps `fit_score`.** Settle whether "how well do I match" and "how much do I want it" are one field or two before adding a third rating to the header.

**Changed from the plan:**
- The summary and fit render as a section titled **"The role", placed last** — after Notes, not in the header. It is reference material written once around the time you apply; putting it above the working sections would push tasks below reference. The **score alone** appears in the header as a tag, since that is the part worth seeing at a glance.
- The **board card's role now links here** rather than to `posting_url` — the page had to be reachable, and the card is a summary of it. The posting keeps an icon-only link in the card footer.
- **Answering and resolving are one action**, not two: `answer` and `resolved_at` go in one PATCH, so a question can never sit answered-but-open. Reopening clears the stamp and keeps the answer.
- `GET /api/jobs/:id/` **embeds contacts, notes and questions** so the page loads in one request. Tasks deliberately do *not* ride along — they come from the shell's store, which is what lets this page reuse Today's row and every existing task handler untouched.

**Still owed:** the writing drawer (needs `writing_piece`); **contact editing** — the chips are read-only and there is no contact UI anywhere in the app yet; and a confirm step before deleting a note or question (they delete optimistically, matching tasks).

---

## Status — restructured (Aug 2026, second pass)

The first build followed the layout above literally and read as **scattered**: one column of four sections in the same 11px eyebrow, with nothing to tell the eye what mattered. The page was rebuilt around a different organising idea — **separate the kinds of information, not just the sections**.

**What changed from the plan above:**
- **Single column is superseded.** Work (tasks, notes, questions) is a main column; facts and people are a sticky rail. The original objection — "lists want width" — holds, and is answered by `--content-max` leaving the main column ~800px.
- **Order is Tasks → Notes → Questions.** Notes moved above questions: the log carries the traffic once a job is live, and a question is usually raised by something just logged.
- **Contacts are a rail block, not header chips**, and they are now **editable**: add someone new, or link a person who already exists on another job. The M2M is only writable from the contact side and the API *replaces* the `jobs` list, so every write sends the complete one.
- **The role summary section is gone**, and `description_summary` / `fit_notes` with it (migration `0003`). That content is a note like any other judgement — which is what `$notesScope` in `seed.local.json` always said. **`fit_score` survives** in the rail, edited in the job dialog, because a sortable number is what stories 4-6 need.
- **Adding is a button**, not a standing field per section.
- **The board card, not its title, opens this page**; the title goes to the posting.

**Still owed:** the writing drawer (needs `writing_piece`), and a confirm step before deleting a note or question.
