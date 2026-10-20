# RoleCall — Design System

The spec for building RoleCall consistently. Pair it with the machine-readable files in this folder:

- **[tokens.css](tokens.css)** — all design tokens as CSS variables. Import once, globally. Reference tokens in every component; never hardcode a hex, size, radius, or spacing value. **Components reference the semantic layer only** (see §2).
- **[statuses.json](statuses.json)** — the pipeline status source of truth (columns, badges, filters, DB enum).
- **[icons.md](icons.md)** — Phosphor icon library + mapping. Never use emoji as icons.

---

## 1. Philosophy

**"Step forward" — energy and calm together.** A deep navy sidebar anchors a pale-blue page; the work you act on sits forward on white tiles that lift off it; coral is the single action and brand accent; page titles have a real voice in Playfair Display. **Energy comes from contrast** — a 30px display title against 15px UI, heavy UI weights (700–800), one confident accent. **Calm comes from restraint in quantity** — one hue family for every neutral, one accent, steady spacing. If a screen feels busy, the fix is fewer colours, not smaller type.

The reference screen is [`../design-handoff/today.html`](../design-handoff/today.html) — open it in a browser. It came from the Claude Design **RoleCall** project (Oct 2026).

> **Superseded, twice.** The original editorial "newsprint" concept (ink on warm paper, 54px display type) read as a magazine and was retired in Aug 2026. Its replacement — a calm, dense workspace on cool zinc greys with a 20px title and nothing heavier than 600 — read as calm to the point of sleepy, and was retired in Oct 2026. The `.dc.html` exports show the newsprint era and are historical only.

**Voice for the user.** RoleCall's users are actively job-searching — often stressed and short on time. The design should feel calm, in-control, and quietly encouraging. Energy and color should be used to motivate and encourage, both when a user completes early-pipeline tasks like creating a resume, applying, etc. and when completing later-pipeline tasks like getting an offer. small wins should be celebrated.

## 2. Color usage

`tokens.css` has **two layers, and the split is load-bearing**:

1. **Raw palette** — `--navy-*`, `--coral-*`, `--crimson-*`, `--white`. **Components must never reference these.**
2. **Semantic** — `--color-*`, `--sidebar-*`, `--priority-*`, washes, scrims. This is the vocabulary components use.

Styling against the semantic layer is what makes a dark theme a token addition later rather than a rewrite of every component. A component referencing `--navy-200` directly is a bug, even though it renders correctly today.

- **One hue family for every neutral.** The navy ramp replaced the old cool-zinc greys: every border, divider, muted line and tint is navy, so the ground and the accents belong to each other.
- **Surfaces:** `--color-bg` (pale navy page) · `--color-surface` (white — sits *forward*: task tiles, cards, menus, inputs) · `--color-bg-sunken` (wells that sit *behind* the page — board columns, inline-add, skeletons, rail blocks) · `--color-surface-hover` / `--color-surface-active` for interaction · `--color-surface-done` (completed task tile).
- **The sidebar is its own dark ground** with its own text ramp — `--sidebar-bg`, `--sidebar-text`, `--sidebar-text-strong`, `--sidebar-text-muted`, `--sidebar-active-bg/-text`, `--sidebar-wordmark`. Never put a `--color-text-*` on the sidebar or a `--sidebar-*` anywhere else.
- **Borders:** `--color-border-subtle` (dividers) · `--color-border` (default, decorative) · `--color-border-strong` (control outlines — checkboxes, inputs, secondary button; 3.4:1, which WCAG 1.4.11 requires of a control's edge).
- **Text:** `--color-text` primary; `--color-text-heading` for group headers; `--color-text-secondary` supporting; `--color-text-muted` is the **floor for text**. `--color-text-placeholder` is for placeholders only and `--color-text-disabled` is non-text.
- **Coral carries action — and comes in three strengths for a reason.** The brand coral (`#e5482b`) fails AA as text or behind white text, so it is used only for **non-text marks and large display type**: `--color-accent` (checked states, active borders), `--focus-ring`, `--color-title-accent` (the italic word in a page title), and the Offer stage. Buttons fill with `--color-primary` (`#d23e22`, white label 4.7:1) and links use `--color-link` (`#c93b20`, 5.1:1). All three read as the same coral.
- **Coral is spent sparingly.** Primary button, title accent, checked states, focus, Offer. It is never a heading colour, a nav colour, or decoration — one accent stays loud only while it's rare.
- **Danger is crimson (`--color-danger` `#b4183c`) and destructive-only**, at most once per view. It is deliberately cooler and deeper than coral so "go" and "destroy" never read as the same red.
- **Pipeline colours progress cool → warm in pipeline order** — navy, blue, teal, lime, coral — so the band reads as a gradient of momentum and Offer lands on the brand colour. They live in [statuses.json](statuses.json), never in CSS.

## 3. Typography

**Three faces, each with exactly one job.** Don't introduce a fourth, and don't move a face outside its job.

- **Playfair Display** (`--font-display`) — page titles and the wordmark. Nothing else.
- **Public Sans** (`--font-sans`) — all UI: nav, buttons, chips, labels, body, meta.
- **Roboto** (`--font-task`) — task titles only, so the work reads in a different voice from the chrome around it.

| Role | Token | Notes |
|---|---|---|
| Page title | `--text-title` (Playfair 30px/700) | one per screen, in the Toolbar; `--tracking-title`. May carry **one** italic accent word in `--color-title-accent` (Today: "Step *forward*") |
| Wordmark | `--text-wordmark` (Playfair 20px/700) | "RoleCall", upright, in the sidebar |
| Section | `--text-section` (16px/700) | section heading within a screen |
| Eyebrow | `--text-eyebrow` (12px/700) | group headers; UPPERCASE + `--tracking-eyebrow` (0.08em), `--color-text-heading` |
| Task title | `--text-task` (Roboto 15px/500) | `--tracking-task`. Done tasks keep the weight — they mute and strike through, they don't thin |
| Body | `--text-body` (15px/500) | default UI text |
| Body sm | `--text-body-sm` (14px/500) | menus, secondary controls |
| Meta | `--text-meta` (13px/600) | counts, dates, company line |
| Nav | `--text-nav` (15px/600) | sidebar nav; the active item goes to 800 |
| Stage | `--text-stage` (15px/500) | sidebar pipeline rows |
| Button | `--text-button` (14px/800) | |
| Chip | `--text-chip` (11px/700) | status chips, category pills, priority |
| Band | `--text-band-label` (12px/800) · `--text-band-names` (12px/400) | pipeline band |

**The jump between title and body is the point.** The previous system ran 20px→12px with nothing above 600, and nothing had a voice. Don't shrink the title back to fit a dense screen — give the screen room instead.

Use `.tabular-nums` (or `font-variant-numeric: tabular-nums`) for dates and numeric columns.

## 4. Spacing, radius, elevation

- **Spacing:** only the 4pt scale (`--space-1`…`--space-16` = 4/8/12/16/20/24/32/36/48/64). No arbitrary values. `--space-9` (36px) is the page gutter.
- **Radius:** `--radius-xs` 4 (small inline marks) · `--radius-sm` 6 (checkboxes, inputs, menu items) · `--radius-md` 10 (nav items, search, cards, menus, popovers) · `--radius-lg` 14 (task tiles, dialogs, panels) · `--radius-full` — **buttons, chips, status and priority pills, dots, avatars.** Pills are now the system's control shape; this reverses the Aug 2026 rule that kept `--radius-full` off buttons.
- **Elevation is for things that sit forward.** `--shadow-task` (task tiles — the signature lift) · `--shadow-done` (a completed tile trades its lift for an outline) · `--shadow-search` (search field) · `--shadow-xs` / `--shadow-sm` / `--shadow-md` (menus, popovers) · `--shadow-lg`, `--shadow-dialog`, `--shadow-drawer`, `--shadow-toast`. All shadows are navy-tinted, so they sit in the ground's hue family.
- **Control height:** `--control-height` (36px) and `--control-height-sm` (30px) drive general buttons and menu items, rising to 44px under `@media (pointer: coarse)` — see §6. `--control-height-lg` (44px) is the Toolbar's primary button and search field at every pointer size.

## 5. Components

### Buttons
**One component — `frontend/src/components/Button.tsx`.** Don't re-declare button CSS in a screen's module; add a variant if one is genuinely missing.

- **Primary:** bg `--color-primary` (coral), label `--color-on-primary`, `--text-button` (14px/800); hover `--color-primary-hover`. The one loud action per view.
- **Secondary (default):** `--color-surface` fill, `1px --color-border-strong`, `--color-text` label; hover fills `--color-surface-hover`.
- **Ghost:** transparent, `--color-text-secondary`; hover fills `--color-surface-active`. For low-stakes and icon-adjacent actions.
- **Danger:** `--color-danger-text` (crimson) text + border, filling solid `--color-danger` on hover. Destructive actions only — never coral.
- **Disabled:** `opacity: .42`, `cursor: not-allowed`.
- **Shape: pill (`--radius-full`).** Sizes `lg` (`--control-height-lg`, the Toolbar's primary action, 22px side padding), `md` (`--control-height`) and `sm` (`--control-height-sm`).
- **Icon-only buttons:** 44×44 transparent hit area, `--radius-md`. Always give an `aria-label`.

### Status badges & tags
- **Status chip:** soft-tinted pill + solid dot in the same hue. Pull `badgeBg`/`badgeFg`/`dot` from [statuses.json](statuses.json) — do not re-pick colors. `--text-chip` (11px/700), `--radius-full`, `5px 8px` pad, dot 8px. On a task tile it reads `Company` or `Company · Stage`.
- **Category pill** (a task with no job): outline `1px --color-border`, `--color-text-muted`, `--text-chip`, `--radius-full`. Same slot as a status chip, deliberately quieter — it has no pipeline stage, so no colour.
- **Tags:** lighter general-purpose labels (outline `1px --color-border`, `--color-text-muted`). e.g. Remote, Full-time, Referral.

### Tooltip (truncated text)
`--color-text` fill, `--color-bg` label, `--text-meta`, `--radius-sm`, `--shadow-md`, `--z-tooltip`. Anchored above the text it explains, fading in over `.1s`.

**It only exists to recover clipped text** — `TruncatedText.tsx` measures `scrollWidth` against `clientWidth` on hover and shows nothing when the label already fits, so tooltips never appear on text you can read. Don't repurpose it for help text or descriptions; that's a different component with different rules.

Two constraints are baked in: it **portals to `<body>`**, because the pipeline band clips its segments (`clip-path` + `overflow: hidden`) and would otherwise swallow a tooltip rendered in place even at `position: fixed`; and it is **`pointer-events: none`**, so it can't steal the hover that spawned it. Escape and scroll dismiss it (WCAG 1.4.13).

Truncation is **visual only** — the full string stays in the DOM, so screen readers and find-in-page are unaffected and the tooltip is a pointer affordance rather than the sole source of the text.

### Menus & popovers
`--color-surface` fill, `1px --color-border`, `--radius-md`, `--shadow-md`, `--space-1` pad. Items are `--text-body-sm` at `--radius-sm`, `--control-height-sm` tall, hover `--color-surface-hover`. Dismiss on outside click and Escape. Anchor with `position: absolute` from the trigger's wrapper.

### Form controls
- **Input/select/textarea:** `--color-surface` bg, `1.5px --color-border-strong`, `--radius-sm`, `--space-2` pad, `--text-body`. **Focus:** border `--focus-input-border` + `3px` glow `--focus-input-glow`.
- **Labels:** `--text-eyebrow` caps, `--color-text-muted`, `--space-2` below.
- **Segmented control:** `--color-surface-active` track, `--radius-sm`; active segment `--color-surface` + `--shadow-xs`; inactive `--color-text-muted`.
- **Radio / checkbox / toggle:** checkboxes are 20px, `--radius-sm`, `2px --color-border-strong`; checked/on uses `--color-accent` (coral); off toggle `--color-border-strong`.
- **Toggle switch** (`Toggle.tsx`) is the one shape exception: a 28×16 `--radius-full` track with a 12px knob, because a wide `--radius-sm` control reads as a stretched checkbox rather than a switch. The knob is a dot, which is what `--radius-full` is for — this is not licence to round a button. Use it for a **view preference that applies immediately** (no Save); use a checkbox for a value being submitted with a form. The native `<input role="switch">` sits transparent over the whole label, so the label is the 44px hit area and the focus ring is drawn on the track.
- **Checkbox hover / pressed:** hover borders `--color-accent` and takes a `--wash-accent-hover` inset wash; pressed deepens to `--wash-accent-active`. A checked box takes the **same** wash — the accent fill never changes hue, only value. Keep the 44×44px hit area around the 20px control.
- **Always native `<input>`/`<select>`** with associated `<label>`s.
- **The control styles live in `Form.module.css`** — field, label, control, hint, error and the right-aligned actions row. Forms compose from it rather than restating input CSS per dialog, the same rule `Button.tsx` carries for buttons.

### Priority control
**Priority is a rank, not a status** — it stays in the navy `--priority-*` tokens and **never borrows a pipeline color.** Weight alone carries the hierarchy: High is solid navy with pale text, Med a light navy fill, Low an outline.

The pill *is* the control — clicking it opens a three-item menu in place, which closes on choice. Hover takes a `--wash-ink-hover` wash and a `--color-accent` border; while the menu is open the border stays accented. Pill is `--text-chip`, `--priority-pill-width` (46px) wide, `--radius-full`, wrapped in a transparent 44px hit area. **One per row, right-aligned.** The menu previews each option as the pill it will become — `--priority-*-text` is only legible on its own fill (High's is near-white), so the text token never appears alone on a menu.

### Pipeline band
A one-line summary of the whole board: chevrons in pipeline order, each **weighted by how many applications sit in that stage**, tinted with the status `badgeBg`/`badgeFg`. Each segment carries its dot and stage name (`--text-band-label`) over an ellipsised list of the companies in it (`--text-band-names`). It reads as a bar chart you can also read as words — and because the stage colours run cool → warm, as momentum.

One per screen, **directly on the page ground** — no container, no border; the chevrons hold their own shape. `--space-8` below it. Segments overlap by 1px with an 8px chevron notch; each links to `/jobs?status=<id>`. Active statuses only; closed statuses are reachable under **Jobs**. Live counts are in the sidebar's Pipeline section, so the band spends its width on names.

**Every stage stays fully legible.** The band is a fixed legend, so no stage is faded out and none collapses to a sliver: `--pipeline-segment-min` is a hard floor on segment width, and the count-based `flexGrow` only decides how the *spare* width is shared. An empty stage reads an italic **"None yet"**, never a dimmed segment. A segment also never shrinks below its own stage name — the floor is the larger of the token and the label — so "Interviewing" never ellipsises; only the company list does.

Below 600px the company names drop, the floor relaxes to `--pipeline-segment-min-compact`, and segments keep their dot (with the stage name as an accessible label). Stage *navigation* and counts also live in the sidebar; the band is the at-a-glance shape.

### Jobs board (kanban)
The **Jobs** screen. One column per stage in [statuses.json](statuses.json), in pipeline order — the same source that drives the band, the badges and the DB enum, so adding a stage adds a column.

**The board never scrolls sideways.** All five active stages are on screen at once: columns are `flex: 1 1 0` so they share the pane equally whatever the stage counts, and `--board-column-min` (200px) is only the floor at which they *wrap* instead of shrinking further. A column is a **well** — `--color-bg-sunken`, `--radius-md`, `--space-3` pad — sitting just behind the pale-navy page, which is what lets the white cards inside read as *forward*. Header is an eyebrow: status dot · label · count (`--color-text-disabled` at zero, matching the sidebar). **An empty stage keeps its full column** and reads "Nothing yet in this stage"; the board is a fixed legend of the pipeline, same rule as the band.

**Active stages only** — the board is the live pipeline. Closed statuses have no column and, for now, no surface here at all.

**`?status=<id>` focuses a column, it does not filter to one.** On a board, hiding the other stages throws away the thing you came to look at — so the linked stage takes an `inset 0 0 0 1.5px --color-accent` ring. It also scrolls itself into view, which only bites once the columns have stacked (`behavior: auto` under `prefers-reduced-motion`). Both the sidebar Pipeline links and the pipeline band land here.

**Below 900px** columns wrap onto a second row at the floor; **below 600px** one stage per row. Neither reflow introduces a horizontal scroller.

### Job card
The board's unit, and one of the few places a card is correct: role (`--text-body` at `--weight-semibold`) · company (`--text-meta` muted, ellipsised with a tooltip when clipped) · a footer carrying the **status chip** (dot + label, `badgeBg`/`badgeFg`) and the **applied date**. Footer is `space-between` and wraps rather than crushing.

**The whole card opens the job page** (`/jobs/:id`) — the card is a summary of that page. It is a link *stretched* across the card (`position: absolute; inset: 0`), not a click handler on the article, so it keeps a real href for middle-click, copy-link and the keyboard; the card's border takes `--color-accent` on hover and `:focus-within`. **The role is its own link to `posting_url`**, and it plus the status pill are raised above the stretched layer so both stay clickable; the role stays `--color-text` at rest, because a column of coral headings would shout, and **hover and `:focus-visible` declare it**. With no URL the role is plain text. The card is still the drag handle, so the stretched link is `draggable={false}` and a click synthesised at the end of a drag is swallowed.

**Date shows only when there is one** — short month + day (`Mar 12`), `--text-meta`, `.tabular-nums`; an un-applied job shows nothing rather than a placeholder. Dates render by splitting the `YYYY-MM-DD` string, never `new Date(iso)` — the constructor reads a bare date as UTC midnight and shows the previous day west of Greenwich.

The stage appears on the card *as well as* the column header because the columns stack on a phone, where the header scrolls away. A visually-hidden span carries what the visual design drops — "Applied" before the bare date, and the new-tab warning on the link.

### Job detail page
The per-job workspace at `/jobs/:id`. **Split by kind of information**: a main column of work you act on, and a sticky rail (`--detail-rail-width`) of reference you only read. The first version was a single column of four identically-styled sections and read as scattered — separating the *kinds* physically is what made it legible, not restyling the parts.

Order is **header → Tasks → Notes → Questions**, with the facts and the people in the rail. Tasks are the work; the log is where the traffic goes once a job is live, and a question is usually raised by something just logged. **Section headers carry no counts** — they are labels, not a dashboard — and each empty state is one quiet line where the rows would be, because a young job legitimately has no tasks, notes or questions and the page must look deliberate rather than broken.

**Hierarchy comes from three header sizes, not from boxes:** 30px Playfair Toolbar title (the role) · 16px `--text-section` for the main sections · 12px `--text-eyebrow` for rail blocks. Rail blocks sit on `--color-bg-sunken` — the same "sits back" surface as the board's columns. They are **not cards**: cards are never page layout.

**Each list keeps its own left gutter**, which is what lets the eye sort the page at a glance: tasks lead with the checkbox, notes with a date column, questions with a `?` or `✓` mark in that same column. **Tasks are tiles here exactly as on Today** (same `TaskRow`); notes and questions are reference, so they stay flat rows (divider + hover fill, 44px floor) and wrap rather than truncate — 44px is a minimum here, not a height. Row actions stay at `opacity: 0` until the row is hovered or one of them takes focus, and are always visible under `@media (pointer: coarse)`. Where a row carries more than one, only the destructive one warms to danger on hover — at most one red thing per row.

**The header is two facts**: company and stage. Stage is the page's most frequent edit by a distance, so it is inline via the same `StatusPill` the board uses; everything rarer sits behind **Edit details** in the Toolbar. A missing applied date reads **"Not applied yet"** and a missing score **"Not rated"** — real states, not gaps.

**Fit is a rank, not a status**, so it stays neutral and never borrows a pipeline colour — the same rule that governs priority.

**Contacts are a rail block**: initials avatar, name, and what the person is. The avatar is one of the three correct uses of `--radius-full`, and it stays neutral — a palette of avatar colours would compete with the pipeline hues, which are the only colours in this app allowed to carry meaning.

**Adding is a button, not a standing field.** Each section header carries **+ Add**; the composer opens beneath it and closes on Escape or Cancel. Three permanently-open fields made the page read as a form to fill in rather than a record to read. A textarea keeps Enter for newlines and takes ⌘/Ctrl+Enter as "done".

**Below 900px** the rail stacks under the main column. DOM order is main→rail at every width, so tab order always matches reading order — never an `order:` / DOM mismatch.

### Writing Library
Search-first, because the hard case is the one the screen exists for: not "six letters mention fundraising" but the sentence itself. The **row unit flips on the query** — no query lists pieces, a query lists matching passages — while type, company and sort narrow both.

**Search field** (`SearchField.tsx`): a native `<input type="search">` at 44px with a leading `MagnifyingGlass` and a clear button that only exists when there is something to clear. Set larger than a form control on purpose — here the query is the primary control, not one input among several.

**Filter chips** are controls, unlike the type *tag* they sit beside, so they take hover and a pressed state. Selection reads as **fill + weight, never colour**: writing types carry no hue, because a row already shows its job's company and four more colours would compete with the pipeline palette. Single-select with an `All` escape.

**Copy is the primary action** of the whole surface, so the affordance repeats at every unit of reuse — passage row, search hit, whole body. `CopyButton.tsx` confirms with a transient label plus an `sr-only` `role="status"` announcement, matching the live regions the board and Today already use; there is no toast component in this app and one button did not warrant inventing one. A refused clipboard write says so and records nothing.

**Search excerpts** mark their matches with `<mark>` over a `--wash-accent-hover` wash rather than a solid fill — a filled highlight in a dense row reads as a status colour.

### Cards
`--radius-md`, `1px --color-border`, `--color-surface` bg, `--shadow-sm`, `--space-4`–`--space-5` pad. Use for genuinely discrete, floating items — **never for page layout, and never for list rows.**

**The page is pale navy and surfaces are white**, so a card separates by fill first; keep the `1px --color-border` as its edge. When something needs to sit *back* from the page (board columns, rail blocks, inline-add), use `--color-bg-sunken` — not `--color-surface`.

**Clickable cards:** when the whole card is a target, the border goes `--color-accent` on hover over a `.12s` transition — the shadow and fill stay put.

### Task tiles
**Tasks are the one collection that floats.** The work you act on lifts off the page; everything else stays flat. Each task is a white tile: `--color-surface`, `--radius-lg`, `--shadow-task`, `--task-min-height` (40px), `4px --space-3` pad, a `--space-3` flex gap — with **`--task-gap` (3px) between tiles** and `--group-gap` (18px) between groups. Group headers are eyebrows in `--color-text-heading`.

Tile anatomy: `[checkbox 20px, --radius-sm, 2px --color-border-strong] [title — --text-task, flex 1, wraps] [status chip or category pill] [priority pill]`. **Only the title shrinks or wraps;** everything else is `flex: none`. The checkbox, priority pill and kebab keep their 44px transparent hit areas even though the tile is shorter: each takes a negative block margin derived from `--task-min-height` so the target overhangs the tile's padding instead of stretching the tile.

**Done:** the tile trades its lift for an outline — `--color-surface-done` fill, `--shadow-done`, title `--color-text-muted` with a line-through, checkbox filled `--color-accent`. It stays in place (see `task-statuses.json` `$done`).

This reverses the Aug 2026 "a card-per-row reads as noise" rule — deliberately, for tasks only. The lift is what gives the work queue its energy, and a 3px gap keeps the density cost small.

### List rows
**The default for every other collection** — notes, questions, contacts, writing rows, job rows outside the board. A row is **flat**: no border, no radius, no shadow, no gap. Rows sit directly against each other, separated by a `1px --color-border-subtle` divider, and light up with `--color-surface-hover` on hover.

Minimum height 44px, which doubles as the hit area for the row's leading control and trailing kebab. Row type is `--text-body`; chips inside use `--text-chip` at `--radius-full`.

### Sidebar shell
The application frame is a fixed **240px rail** (`--sidebar-width`) plus a scrolling content pane. The rail is the one dark ground in the app — `--sidebar-bg` (deep navy), no edge, `--space-6` / `--space-4` pad — and it carries its own text ramp (`--sidebar-*`); never put page text tokens on it.

It carries, top to bottom: wordmark (`--text-wordmark`, `--sidebar-wordmark`) · primary nav (Today · Jobs · Writing Library — `--text-nav`, `--nav-item-height` 38px, `--radius-md`, `--sidebar-text`) · a `Pipeline` eyebrow section (`--sidebar-text-muted`) listing active stages in `--text-stage` / `--sidebar-text-strong` with right-aligned tabular counts, each linking to its Jobs filter · an account slot pinned to the bottom. **The active nav item is a pale pill on the dark rail** — `--sidebar-active-bg`, `--sidebar-active-text`, weight 800 — readable by fill and weight, not colour alone. Stage dots are 8px with a `1.5px --sidebar-dot-ring` ring, so the navy Researching dot stays visible on navy.

Nav items are text only — three short labels on a dark rail don't need icons to be told apart. Hover is a faint `--sidebar-hover-bg` lift; the account avatar is pale-on-dark like the active pill, keeping coral for actions.

**Below 900px** the rail leaves the grid and becomes an overlay drawer over `--scrim-drawer`, opened by a hamburger in the Toolbar and dismissed by the scrim, the `X`, Escape, or navigating.

### Toolbar
Per-screen header, `--toolbar-height` (96px) minimum, **on the page ground with no bottom edge** — the title's size does the separating. `--space-5` / `--space-9` pad, and screen content shares that `--space-9` side gutter. Page title (`--text-title`, Playfair 30px) left, never wrapping — it ellipsises, the actions never shrink; actions right, with the primary action as a `lg` pill button. Hamburger left of the title on small screens. **Below 600px** the actions wrap to a second row and the bar scrolls away with the page rather than pinning two rows over a phone screen. **The page title lives here, not in the content** — so every screen starts at the same rhythm.

**Title copy may carry one italic accent word** in `--color-title-accent`. Today's title is "Step *forward*". Other screens use their own names in the same style; the accent word is optional and never more than one.

The right side reserves room for a future **⌘K search / jump field** (`--control-height-lg`, `--radius-md`, `--shadow-search`, shrinks to 150px before anything else gives) — see §8.

### Data table
List view of the pipeline. Container `--radius-md`, `--color-bg-sunken` fill. Eyebrow `th` labels, `--color-border-subtle` row rules, `.tabular-nums` dates, row hover `--color-surface-hover`.

### Dialogs
Overlay-elevation card over a `--scrim-dialog` sheet. `--color-surface`, `--radius-lg`, `--shadow-dialog`, `--space-6` pad. **Form dialog** for creating; **confirm dialog** (narrower, danger action) for destructive intent. Close affordance top-right (`X` icon).

`Dialog.tsx` is the shell every form dialog composes from — it renders the scrim, the card, the title and the `X`, and the caller supplies the `<form>`. Like the tooltip it **portals to `<body>`**, so no ancestor's `overflow` can clip it. It **traps Tab** inside the card, sends focus to the first form control on open and returns it to the opener on close, freezes body scroll while open, and dismisses on Escape, the `X`, or a click that both starts and ends on the scrim. Mount it only while open, so a reopened form starts empty.

### Pull-out drawer
Right-docked panel over `--scrim-drawer` for quick tasks that shouldn't take the whole page (quick-add, edit contacts, filters — and RoleCall's resume/cover-letter panels). `min(440px, 100%)` wide, `--color-surface` bg, `--shadow-drawer`, scrollable. Dismiss via sheet, `X`, Escape, or Cancel.

### Feedback, loading & empty states
- **Toast:** `--color-text` bg, `--color-bg` text, `--radius-md`, fixed bottom-center, `--z-toast`, with a colored status dot; auto-dismiss + manual `X`.
- **Empty state:** invite the first entry rather than showing a blank surface — Phosphor icon in a `--radius-full` `--color-surface-active` circle, `--text-section` title, one encouraging line, primary CTA. Component: `EmptyState.tsx`.
- **Loading:** skeleton blocks matching the destination layout's rhythm, so nothing jumps when data lands. `--color-surface-active` fill, `--radius-xs`, gentle opacity pulse that respects `prefers-reduced-motion`. Mark the blocks `aria-hidden` and announce loading once via a visually-hidden `role="status"`. Component: `Skeleton.tsx`.
- **Error:** a card with a plain-language title, what to check, and a **Try again** button wired to a real retry — never a bare sentence.

## 6. Accessibility rules
- **Contrast:** body/small text uses `--color-text-muted` or darker. `--color-text-placeholder` is placeholders only; `--color-text-disabled` is non-text.
- **Coral has three strengths so it can pass.** The brand coral `#e5482b` is 3.97:1 on white — fine for non-text marks (accent, focus ring, ≥3:1) and for the 30px title accent (large text, ≥3:1), but **never** body-size text or text sitting on it. Buttons use `--color-primary` (4.7:1 with white) and links `--color-link` (5.1:1). Don't "simplify" these back to one coral.
- **Control edges meet 3:1** (WCAG 1.4.11): checkboxes and inputs use `--color-border-strong`, never the lighter decorative borders.
- **On the sidebar**, text uses the `--sidebar-*` ramp (muted 5.7:1, body 9.5:1 on `--sidebar-bg`).
- **Focus:** every interactive element shows the global `:focus-visible` ring (already in tokens.css). Don't remove outlines.
- **Touch targets:** **44×44px is the floor on touch.** Controls wrapped in a transparent hit area (checkbox, kebab, priority tag) stay 44px at every size. Buttons and menu items run compact on a fine pointer via `--control-height` (36px) and rise to 44px automatically under `@media (pointer: coarse)` — this is the one place the flat 44px rule is relaxed, and only where a mouse is driving.
- **Semantics:** native form elements with labels; icon-only buttons get `aria-label`; decorative icons `aria-hidden`.
- **Responsive:** two breakpoints carry the app — **900px** (sidebar → drawer) and **600px** (row and band reflow, tighter pane padding). Users often job-hunt on a phone.
- **Motion:** any animation is wrapped in `@media (prefers-reduced-motion: reduce)`.

## 7. Conventions to lock before building screens
- **Nav vocabulary: settled — Today · Jobs · Writing Library**, rendered as a left sidebar. Routes match these labels (`/`, `/jobs`, `/writing`). The `.dc.html` export's *Archive* label is superseded.
- **There is no Archive destination.** Closed jobs are a filter under **Jobs**. *Writing Library* is a separate surface — the reusable pool of cover letters, blurbs and impact statements from story 3.
- **Status list is fixed by [statuses.json](statuses.json)** — changing the pipeline means editing that one file (it feeds columns, badges, filters, and the DB enum together).
- **Task status is fixed by [task-statuses.json](task-statuses.json)**, **priority by [priorities.json](priorities.json)**, and **non-job task category by [task-categories.json](task-categories.json)** — same discipline, same enum-migration rule.

## 8. Not in this system yet (deferred by choice)
**Reminder components** are intentionally not designed, and the job page's **writing drawer** has no `Drawer` component to build on yet. The Toolbar's **⌘K search / jump palette** is designed as a field but not as a feature — reserve its slot, don't build the palette as part of styling. The **closed-status colours** in `statuses.json` were chosen to sit quietly in the navy family, not designed in Claude Design — revisit when the closed-jobs view exists. **Only Today was designed** in the Oct 2026 redesign; Jobs, job detail, Writing Library and the dialogs inherit it through tokens and these rules, and are due a visual pass of their own. **Closed jobs have no surface yet** — they're stored and counted but the board shows active stages only, so a closed-jobs filter is still owed. A **logo mark** is still open. See [../design-review.md](../design-review.md) for the full punch-list.

**Dark mode is structured for but not built.** The raw/semantic split in `tokens.css` exists so a dark theme is a `[data-theme="dark"]` block overriding the semantic layer — no component changes. The open work is dark variants for the eight `statuses.json` colours, which would need a shape change to that file (e.g. a `badgeBgDark` alongside each `badgeBg`).
