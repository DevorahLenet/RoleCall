# RoleCall — Design System

The spec for building RoleCall consistently. Pair it with the machine-readable files in this folder:

- **[tokens.css](tokens.css)** — all design tokens as CSS variables. Import once, globally. Reference tokens in every component; never hardcode a hex, size, radius, or spacing value.
- **[statuses.json](statuses.json)** — the pipeline status source of truth (columns, badges, filters, DB enum).
- **[icons.md](icons.md)** — Phosphor icon library + mapping. Never use emoji as icons.

---

## 1. Philosophy

**Newsprint structure.** Ink on paper (`--paper` ground, `--ink` text), with cyan and magenta as sparingly-used "process inks" (spot color). Hierarchy comes from **scale and whitespace, not boxes and rules.** Restraint is the point — the one boxed element in the system is the card.

**Voice for the user.** RoleCall's users are actively job-searching — often stressed and short on time. The design should feel calm, in-control, and quietly encouraging. Energy and color should be used to motivate and encourage, both when a user completes early-pipeline tasks like creating a resume, applying, etc. and when completing later-pipeline tasks like getting an offer. small wins should be celebrated.

## 2. Color usage

- **Text:** `--color-text` (`--ink`) for primary; `--color-text-secondary` for supporting; `--color-text-muted` (`--neutral-600`) for the smallest labels/meta. **Never** use `--neutral-500` (`#7d7979`) as text — it fails AA; it's `--color-text-decorative` for non-text only.
- **Cyan carries interaction.** `--color-primary` (`#007391`) fills the primary button; `--color-link`/`--cyan-600` for links and text-on-paper cyan; `--cyan-500` for accents (section numbers, focus border) but **not** body text.
- **Magenta is the rarer second voice** — used for the **Offer** status and celebratory "win" moments. It is *not* danger.
- **Danger red (`--danger` `#c43e17`) is destructive-only** and appears at most once per view.
- **Press yellow** = Interviewing; **sage** = hired/success. Body copy never runs in a raw ink — use the 600/700 steps.

## 3. Typography

One family (**Figtree**), four weights (400/500/600/700). Tight tracking + heavy weight for display; generous line-height (1.5–1.65) for reading; body measure 56–62ch.

| Role | Token | Notes |
|---|---|---|
| Display | `--text-display` (54px/700) | page title; tracking `--tracking-display` |
| H2 | `--text-h2` (36px/700) | section title |
| H3 | `--text-h3` (24px/600) | subsection |
| H4 | `--text-h4` (19px/700) | minor heading |
| Lead | `--text-lead` (20px/400) | intro paragraph |
| Body | `--text-body` (16px/1.65) | default |
| Body sm | `--text-body-sm` (14px) | dense UI |
| Meta | `--text-meta` (13px) | dates, company line |
| Eyebrow / field label | 600 · 11–12px · UPPERCASE · `--tracking-label` | color `--color-text-muted` |

Use `.tabular-nums` (or `font-variant-numeric: tabular-nums`) for dates and numeric columns. Use caps labels sparingly — they're elegant but hard to scan in bulk.

## 4. Spacing, radius, elevation

- **Spacing:** only the 4pt scale (`--space-1`…`--space-16` = 4/8/12/16/20/24/32/48/64). No arbitrary values.
- **Radius:** `--radius-control` 8 (inputs) · `--radius-card` 12 (cards) · `--radius-container` 16 (panels/tables) · `--radius-dialog` 18 (modals) · `--radius-pill` (buttons/badges/toggles).
- **Elevation:** `--shadow-sm` resting card · `--shadow-md` raised · `--shadow-lg` overlay card · `--shadow-dialog` · `--shadow-drawer` · `--shadow-toast`.

## 5. Components

### Buttons — pills throughout
- **Primary:** bg `--color-primary`, label `--color-on-primary`; hover `--color-primary-hover`. The one loud action per view.
- **Secondary:** transparent, `1.5px` `--border-strong` border, `--ink` text; hover border→`--cyan-500`, text→`--cyan-600`.
- **Ghost:** transparent, `--cyan-600` text; hover bg `rgba(0,136,176,.10)`.
- **Delete (outline danger):** `--danger-text` text, `1.5px` danger border; hover soft danger tint.
- **Danger solid:** bg `--danger`, white label; hover `--danger-hover`. Confirmed destructive actions only.
- **Disabled:** `opacity: .42`, `cursor: not-allowed`.
- **Sizes:** sm `--space-2`/`--space-4` pad · md `--space-3`/`--space-5` · lg `--space-4`/`--space-8`.
- **Icon buttons:** 40px circle, same variant logic. Always give an `aria-label`.

### Status badges & tags
- **Status badge:** soft-tinted pill + solid dot in the same hue. Pull `badgeBg`/`badgeFg`/`dot` from [statuses.json](statuses.json) — do not re-pick colors. Font 600/12px, radius pill, dot 8px.
- **Tags:** lighter general-purpose labels (filled tint, outline, or with a leading dot + count). e.g. Remote, Full-time, Referral.

### Form controls
- **Input/select/textarea:** `--white` bg, `1.5px` `--border-input`, `--radius-control`, `--space-3` pad, 15px text. **Focus:** border `--focus-input-border` + `2px` glow `--focus-input-glow`.
- **Labels:** 600 caps, `--color-text-muted`, `--space-2` below.
- **Segmented control:** `--neutral-100` track, pill; active segment bg `--color-primary`, white text; inactive `--color-text-muted`.
- **Radio / checkbox / toggle:** 18px controls, `--radius-check`, `1.5px` `--border-strong`; selected/checked/on state uses `--cyan-500`; off toggle `--neutral-200`.
- **Checkbox hover / pressed:** hover borders `--cyan-500` and takes a `--wash-cyan-hover` inset wash; pressed deepens to `--wash-cyan-active`. A checked box takes the **same** wash — the cyan fill never changes hue, only value. Remember the 44×44px hit area around the 18px control.
- **In real code use native `<input>`/`<select>` elements** with associated `<label>`s — the export's styled `<span>`s are visual only.

### Priority control
**Priority is a rank, not a status** — it stays in the neutral greys of the `--priority-*` tokens and **never borrows a pipeline color.** Weight alone carries the hierarchy: High is the heaviest neutral fill, Med the light one, Low an outline.

The pill *is* the control — clicking it opens a three-item menu in place, at raised elevation, which closes on choice. Hover takes a `--wash-ink-hover` wash and a `--cyan-500` border; while the menu is open the border stays cyan. Pill is 600/12px, `--space-1`/`--space-3` pad, `--radius-pill`. **One per row, right-aligned.**

### Pipeline band
A one-line summary of the whole board: chevrons in pipeline order, each **weighted by how many applications sit in that stage**, tinted with the status `badgeBg`/`badgeFg` and carrying the same solid dot. It reads as a bar chart you can also read as words.

One per screen, directly under the header. Container `--radius-container`, `--border-card`, `--surface` fill. Segments overlap by 1px with an 8px chevron notch; each links to its filtered board, with a trailing link to the full job board.

**It is chrome, never content** — hold it to a single line of label plus company names. Active statuses only; closed statuses are filtered out of the band and reachable under **Jobs**.

### Cards
The only boxed element. `--radius-card`, `1px` `--hairline` border, `--surface` bg, `--shadow-sm`, `--space-4` pad. Use for discrete items (pipeline cards, contacts, **task rows**) — **never for page layout.** Elevation tiers: resting (sm on `--surface`) → raised (md on `--white`) → overlay (lg on `--white`).

**Clickable cards:** when the whole card is a target, the border goes `--cyan-500` on hover over a `.12s` transition — the shadow and fill stay put.

### Navigation
Top bar on `--paper` with a single `--hairline` bottom border. Wordmark 700/20px; current view `--cyan-600` 600, others `--color-text-muted` 400; primary action anchored right.

### Data table
List view of the pipeline. Container `--radius-container`, `--surface-alt` fill. Caps `th` labels, hairline `--border-row` rules, `.tabular-nums` dates, row hover `rgba(0,136,176,.05)`.

### Dialogs
Overlay-elevation card over a `--scrim-dialog` sheet. `--white`, `--radius-dialog`, `--shadow-dialog`, `--space-8` pad. **Form dialog** for creating; **confirm dialog** (narrower, danger-solid action) for destructive intent. Close affordance top-right (`X` icon).

### Pull-out drawer
Right-docked panel over `--scrim-drawer` for quick tasks that shouldn't take the whole page (quick-add, edit contacts, filters — and RoleCall's resume/cover-letter panels). `min(440px, 100%)` wide, `--paper` bg, `--shadow-drawer`, scrollable. Dismiss via sheet, `X`, or Cancel.

### Feedback & empty states
- **Toast:** `--ink` bg, `--paper` text, `--radius-card`, fixed bottom-center, `--z-toast`, with a colored status dot; auto-dismiss + manual `X`.
- **Empty state:** invite the first entry rather than showing a blank surface — soft chip icon, short encouraging line, primary CTA.

## 6. Accessibility rules
- **Contrast:** body/small text uses `--color-text-muted` or darker. Confirmed-passing pairs only; don't put text in `--neutral-500` or raw `--cyan-500`.
- **Focus:** every interactive element shows the global `:focus-visible` ring (already in tokens.css). Don't remove outlines.
- **Touch targets:** minimum 44×44px hit area — pad small controls (buttons, radios, checkboxes) even if the visual is smaller.
- **Semantics:** native form elements with labels; icon-only buttons get `aria-label`; decorative icons `aria-hidden`.
- **Responsive:** design board, detail, and drawers to reflow on mobile — users often job-hunt on a phone. (Screens themselves are TBD; keep this constraint in mind when they're built.)

## 7. Conventions to lock before building screens
- **Nav vocabulary: settled — Today · Jobs · Writing Library.** Structure set by the Today screen design (`../RoleCall Today.dc.html`), which still shows the superseded *Archive* label in its third slot. Current view renders `--cyan-600`/600, the others `--color-text-muted`/400, with **+ New application** as the primary action anchored right. Routes should match these labels.
- **There is no Archive destination.** Closed jobs are a filter under **Jobs**. *Writing Library* is a separate surface — the reusable pool of cover letters, blurbs and impact statements from story 3.
- **Status list is fixed by [statuses.json](statuses.json)** — changing the pipeline means editing that one file (it feeds columns, badges, filters, and the DB enum together).
- **Task status is fixed by [task-statuses.json](task-statuses.json)**, **priority by [priorities.json](priorities.json)**, and **non-job task category by [task-categories.json](task-categories.json)** — same discipline, same enum-migration rule.

## 8. Not in this system yet (deferred by choice)
Core screens (kanban board, detail page, dashboard/todos), the task row and its status treatment, reminder components, error/loading states, and a logo mark are intentionally **not** designed here — this is the reusable foundation only. See [../design-review.md](../design-review.md) for the full punch-list.

**Task status has no source of truth.** Job status has [statuses.json](statuses.json) and a DB enum; task status (to do / in progress / waiting on / done) has no equivalent yet. Note that color is already carrying job stage on a task row, so task status likely needs to work in **shape and form** rather than hue. Priority is now designed (above) but likewise has no enum file — if it becomes a DB column, it needs one on the `statuses.json` pattern.
