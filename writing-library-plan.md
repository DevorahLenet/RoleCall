# Writing Library — flow plan

The `/writing` screen and the data behind it. Currently an empty-state stub. Product context is story 3 in [../rolecall_plan.md](../rolecall_plan.md): *a reusable pool of their best writing — cover letters, impact statements, and other artifacts stored and easy to draw from, so every new application starts faster and stronger.*

## The flow

**Browsing** — Sidebar → Writing Library → all pieces → filter by type/company → open one → copy.

**Topic hunting** — Writing Library → type "fundraising" → the list flips from documents to *matching lines* → copy the line.

**While working on a job** — Job page → Find writing → drawer opens pre-filtered to that job → search → copy → back to drafting without leaving the page.

**New tailored resume** — find the closest existing resume → Duplicate & tailor → edit → saves linked to the new job, with `derived_from` set.

## Two principles this rests on

**1. Filters narrow documents; search returns lines.**

Type, company and recency are properties *of a document*. Topic is not — it's a property of a *passage inside* one. If topic is treated as a document filter, the result is "6 cover letters mention fundraising" and the user still has to open all six and hunt. The actual need is the sentence, not the file.

So the index has two result modes on one screen, switched by whether the query box has anything in it:

| Query | Row unit | Row shows |
|---|---|---|
| empty | **piece** | title · type tag · company · date |
| typed | **passage** | highlighted excerpt · source piece + company · use count |

Filters stay applied in both modes.

**2. The library is a view, not a container.**

The failure mode here is the same one that kills job trackers: it goes stale. If "save this to the library" is a separate deliberate step, it won't happen, and within a month the library is a partial and misleading snapshot.

So writing attached to a job *is* library content. You write the Alteva blurb on the Alteva job page; it appears in the library because that's where all writing lives. The Writing Library screen is the aggregate view over that data, never a second place to remember to populate. Same instinct as auto-generated tasks and computed priority elsewhere in the plan — derive it, don't ask the user to maintain it.

## Data model

Two levels, because the unit of *storage* and the unit of *reuse* are different. You reuse a bullet, not a whole resume.

```
writing_piece
  id              BigAutoField (implicit PK)
  job_id          ForeignKey → job, null=True, blank=True, on_delete=SET_NULL
  type            CharField, choices=WritingType   (design-system/writing-types.json)
  title           CharField
  body            TextField                        (markdown)
  derived_from    ForeignKey → self, null=True, blank=True, on_delete=SET_NULL
  created_at      DateTimeField, auto_now_add=True
  updated_at      DateTimeField, auto_now=True

writing_passage
  id              BigAutoField (implicit PK)
  piece_id        ForeignKey → writing_piece, on_delete=CASCADE
  text            TextField
  position        IntegerField
  use_count       IntegerField, default=0
  last_used_at    DateTimeField, null=True, blank=True
```

**Notes on decisions:**

- **Passages are derived, never authored.** Split `body` on blank lines and list items whenever a piece is saved. The user chunks nothing by hand — that data-entry burden is exactly the friction that kills adoption.
- **`body` is markdown, and this is load-bearing.** Chunk quality depends entirely on it. A piece pasted in as one unstructured blob produces useless passages, which silently breaks topic search — the feature the whole screen exists for.
- **`job_id` nullable mirrors the Task pattern.** Tailored resumes and job-specific blurbs have a job; base resumes and impact statements don't. Company filtering falls out of the job relation rather than needing its own field.
- **`derived_from` earns its place from the real data** — there are nine tailored resumes in `seed.local.json`, all variants of a base. Lineage answers "which existing resume is closest to what I need?" so a new one starts as a fork rather than from scratch.
- **`on_delete=SET_NULL` on `job_id`**, matching Task — deleting a job shouldn't destroy writing. Unlike Task there's no exclusivity constraint to conflict with, so this one is clean.

## Search: SQLite FTS5

Built into SQLite — no new dependency, no service to run.

- **Index passages, not pieces.**
- Use the **`porter` tokenizer** so "fundraising" matches "fundraiser" and "churn" matches "churning."
- FTS5's **`snippet()`** returns a highlighted excerpt around the match — that *is* the passage row, handed over by the database.

The gap this leaves is synonyms: searching "leadership" won't find "managed a team of six." Stemming covers word forms, not concepts. When that starts to bite, the cheap patch is tags; the expensive one is embeddings.

## Screens

### 1. `/writing` — index

Search-first, not browse-first — the topic case is the hard one and the reason the screen exists.

- Toolbar owns the title, plus a **New piece** primary action.
- Search field, prominent.
- Filter row: type chips · company select · sort (recent / most used).
- Flat list rows per `CLAUDE.md` — divider + hover fill, no cards.
- Result unit switches on query presence per the table above.

### 2. Piece detail

Full body, each passage individually hoverable and copyable. Metadata: type, linked job, lineage (derived from / forked into), per-passage use counts.

Actions: **Edit** · **Duplicate & tailor** (new piece with `derived_from` set) · **Copy all**.

### 3. Pull drawer — invoked from a job

Right-docked drawer per the design system. Search-first, pre-filtered to the job's context, primary action is copy-to-clipboard. Never navigates away from the job being worked on.

## "Best writing" is computed, not starred

Story 3 asks for a pool of *best* writing. Don't make the user curate that with stars — manual curation rots the same way manual priority does.

Increment `use_count` and stamp `last_used_at` on every copy. Workhorse lines float up on their own, and "most used" becomes a sort that reflects what actually gets reached for rather than what was once thought to be good.

## Sequencing

- **Buildable now:** the index and piece detail. They need the two tables and the app shell, which exists.
- **Needs job detail first:** the pull drawer. Job detail isn't designed yet.
- Company filtering works off the job relation today, even though `/jobs` is still unbuilt.

## Watch items

- **Copy is the primary action, not open.** Easy to build this as a document manager where everything opens a detail page — but the job ends with text on the clipboard. The copy affordance belongs at every level: passage row, search result, drawer.
- **Auto-capture is what keeps it alive.** If writing only enters the library through a deliberate save step, the library dies. Writing created on a job page must land here automatically.
- **Type carries no colour.** Four more hues would compete with the pipeline palette. Types are outline tags; colour stays reserved for job status.
