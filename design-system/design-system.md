# RoleCall — Design System

The spec for building RoleCall consistently. Pair it with the machine-readable files in this folder:

- **[tokens.css](tokens.css)** — all design tokens as CSS variables. Import once, globally. Reference tokens in every component; never hardcode a hex, size, radius, or spacing value. **Components reference the semantic layer only** (see §2).
- **[statuses.json](statuses.json)** — the pipeline status source of truth (columns, badges, filters, DB enum).
- **[icons.md](icons.md)** — Phosphor icon library + mapping. Never use emoji as icons.

---

## 1. Philosophy

**A calm, dense professional workspace.** RoleCall reads as a tool, not an article: a quiet neutral ground, compact type, and hierarchy carried by **weight and density** rather than by large display type. The governing rule is **the data is louder than the chrome** — a page title is 20px and a task row is 14px, so the content dominates. Cyan carries interaction and magenta is the rare "win" voice; both stay sparing, which is what keeps the pipeline colours legible when they appear.

> **Superseded:** this system was originally an editorial "newsprint" concept — ink on warm paper, a 54px display scale, pill controls, hierarchy from scale and whitespace. That register read as a magazine rather than an application and was retired in the Aug 2026 redesign. The `.dc.html` exports still show it and are historical references only.

**Voice for the user.** RoleCall's users are actively job-searching — often stressed and short on time. The design should feel calm, in-control, and quietly encouraging. Energy and color should be used to motivate and encourage, both when a user completes early-pipeline tasks like creating a resume, applying, etc. and when completing later-pipeline tasks like getting an offer. small wins should be celebrated.

## 2. Color usage

`tokens.css` has **two layers, and the split is load-bearing**:

1. **Raw palette** — `--neutral-*`, `--cyan-*`, `--magenta-*`, accent solids. **Components must never reference these.**
2. **Semantic** — `--color-*`, `--priority-*`, washes, scrims. This is the vocabulary components use.

Styling against the semantic layer is what makes a dark theme a token addition later rather than a rewrite of every component. A component referencing `--neutral-200` directly is a bug, even though it renders correctly today.

- **Surfaces:** `--color-bg` (page) · `--color-bg-sunken` (sidebar, wells — sits *back*) · `--color-surface` (cards, menus — sits level or *forward*) · `--color-surface-hover` / `--color-surface-active` for interaction.
- **Borders:** `--color-border-subtle` (list-row dividers) · `--color-border` (default) · `--color-border-strong` (inputs, secondary button).
- **Text:** `--color-text` primary; `--color-text-secondary` supporting; `--color-text-muted` is the **floor for text**. `--color-text-placeholder` is for placeholders only and `--color-text-disabled` is non-text (disabled glyphs, zero-counts).
- **Cyan carries interaction.** `--color-primary` (`#007391`) fills the primary button; `--color-link` for links; `--color-accent` for accents (checked states, focus border) but **not** body text.
- **Magenta is the rarer second voice** — used for the **Offer** status and celebratory "win" moments. It is *not* danger.
- **Danger red (`--danger` `#c43e17`) is destructive-only** and appears at most once per view.
- **Press yellow** = Interviewing; **sage** = hired/success.

## 3. Typography

One family (**Figtree**), four weights (400/500/600/700), sized for a dense tool.

| Role | Token | Notes |
|---|---|---|
| Page title | `--text-title` (20px/600) | one per screen, in the Toolbar; tracking `--tracking-title` |
| Section | `--text-section` (15px/600) | section heading within a screen |
| Eyebrow | `--text-eyebrow` (11px/600) | group headers; UPPERCASE + `--tracking-eyebrow`, `--color-text-muted` |
| Body | `--text-body` (14px/1.5) | default UI text, list rows |
| Body sm | `--text-body-sm` (13px) | menus, secondary controls |
| Meta | `--text-meta` (12px) | counts, dates, company line |

Use `.tabular-nums` (or `font-variant-numeric: tabular-nums`) for dates and numeric columns. Caps labels use `--tracking-eyebrow` (0.06em) — the old 0.16em editorial tracking hurts scanning at 11px.

## 4. Spacing, radius, elevation

- **Spacing:** only the 4pt scale (`--space-1`…`--space-16` = 4/8/12/16/20/24/32/48/64). No arbitrary values.
- **Radius:** `--radius-xs` 4 (chips, tags) · `--radius-sm` 6 (buttons, inputs, checkboxes, menu items) · `--radius-md` 8 (cards, menus, popovers) · `--radius-lg` 12 (dialogs, panels) · `--radius-full` — **avatars, status dots and count badges only.** A fully-rounded button reads consumer/marketing; buttons use `--radius-sm`.
- **Elevation is for things that genuinely float.** `--shadow-xs` (nav active state) · `--shadow-sm` resting card · `--shadow-md` menus/popovers · `--shadow-lg`, `--shadow-dialog`, `--shadow-drawer`, `--shadow-toast`. **Flat list rows separate by divider, not by shadow.**
- **Control height:** `--control-height` (36px) and `--control-height-sm` (30px) drive buttons and menu items. Both rise to 44px under `@media (pointer: coarse)` — see §6.

## 5. Components

### Buttons
**One component — `frontend/src/components/Button.tsx`.** Don't re-declare button CSS in a screen's module; add a variant if one is genuinely missing.

- **Primary:** bg `--color-primary`, label `--color-on-primary`; hover `--color-primary-hover`. The one loud action per view.
- **Secondary (default):** `--color-surface` fill, `1px --color-border-strong`, `--color-text` label; hover fills `--color-surface-hover`.
- **Ghost:** transparent, `--color-text-secondary`; hover fills `--color-surface-active`. For low-stakes and icon-adjacent actions.
- **Danger:** `--color-danger-text` text + border, filling solid danger on hover. Destructive actions only.
- **Disabled:** `opacity: .42`, `cursor: not-allowed`.
- **Radius `--radius-sm`, never `--radius-full`.** Sizes `md` (`--control-height`) and `sm` (`--control-height-sm`).
- **Icon-only buttons:** 44×44 transparent hit area, `--radius-sm`. Always give an `aria-label`.

### Status badges & tags
- **Status badge:** soft-tinted chip + solid dot in the same hue. Pull `badgeBg`/`badgeFg`/`dot` from [statuses.json](statuses.json) — do not re-pick colors. Font 600/11px, `--radius-xs`, dot 6px. **Squared, not pill** — this is a data label, not a button.
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
- **Radio / checkbox / toggle:** 16px controls, `--radius-sm`, `1.5px --color-border-strong`; checked/on uses `--color-accent`; off toggle `--color-border-strong`.
- **Checkbox hover / pressed:** hover borders `--color-accent` and takes a `--wash-cyan-hover` inset wash; pressed deepens to `--wash-cyan-active`. A checked box takes the **same** wash — the accent fill never changes hue, only value. Keep the 44×44px hit area around the 16px control.
- **Always native `<input>`/`<select>`** with associated `<label>`s.

### Priority control
**Priority is a rank, not a status** — it stays in the neutral `--priority-*` tokens and **never borrows a pipeline color.** Weight alone carries the hierarchy: High is the heaviest neutral fill, Med the light one, Low an outline.

The tag *is* the control — clicking it opens a three-item menu in place, which closes on choice. Hover takes a `--wash-ink-hover` wash and a `--color-accent` border; while the menu is open the border stays accented. Tag is 600/11px, `--radius-xs`, wrapped in a transparent 44px hit area. **One per row, right-aligned.**

### Pipeline band
A one-line summary of the whole board: chevrons in pipeline order, each **weighted by how many applications sit in that stage**, tinted with the status `badgeBg`/`badgeFg` and carrying the same solid dot plus its count. It reads as a bar chart you can also read as words.

One per screen, **inset into the content pane** — `--radius-md`, `1px --color-border`, **`--color-bg` fill (the same white as the page; the border alone holds the shape)**, with the chevron track clipped inside. Segments overlap by 1px with an 8px chevron notch; each links to `/jobs?status=<id>`. Active statuses only; closed statuses are reachable under **Jobs**.

**Every stage stays fully legible.** The band is a fixed legend, so no stage is faded out and none collapses to a sliver: `--pipeline-segment-min` is a hard floor on segment width, and the count-based `flexGrow` only decides how the *spare* width is shared. Emptiness is carried by the stage's `0`, never by dimming.

Below 600px the labels drop, the floor relaxes to `--pipeline-segment-min-compact`, and segments keep dot + count. Stage *navigation* also lives in the sidebar; the band is the at-a-glance shape.

### Cards
`--radius-md`, `1px --color-border`, `--color-surface` bg, `--shadow-sm`, `--space-4`–`--space-5` pad. Use for genuinely discrete, floating items — **never for page layout, and never for list rows.**

**Ground and surface are both white**, so a card separates by border + shadow, not by fill; neither is optional. When something needs to sit *back* from the page (sidebar, wells, the pipeline band), use `--color-bg-sunken` — not `--color-surface`.

**Clickable cards:** when the whole card is a target, the border goes `--color-accent` on hover over a `.12s` transition — the shadow and fill stay put.

### List rows
**The default way to render a collection** — task rows, job rows, contacts. A row is **flat**: no border, no radius, no shadow, no gap. Rows sit directly against each other, separated by a `1px --color-border-subtle` divider, and light up with `--color-surface-hover` on hover.

Minimum height 44px, which doubles as the hit area for the row's leading checkbox and trailing kebab. Row type is `--text-body`; chips and tags inside run 11px at `--radius-xs`. Density is the point: a card-per-row costs ~40% more vertical space and reads as noise at length.

### Sidebar shell
The application frame is a fixed **240px rail** (`--sidebar-width`) plus a scrolling content pane. The rail sits on `--color-bg-sunken` with a `1px --color-border` right edge — it is *behind* the content, never a card.

It carries, top to bottom: wordmark · primary nav (Today · Jobs · Writing Library, 13px with a Phosphor icon each) · a `Pipeline` eyebrow section listing active stages with live counts, each linking to its Jobs filter · an account slot pinned to the bottom. The active nav item reads by **fill + weight + `--shadow-xs`**, not by colour alone.

**Below 900px** the rail leaves the grid and becomes an overlay drawer over `--scrim-drawer`, opened by a hamburger in the Toolbar and dismissed by the scrim, the `X`, Escape, or navigating.

### Toolbar
Sticky per-screen header, 56px, `--color-bg` with a `1px --color-border` bottom edge. Page title (`--text-title`) left, actions right, hamburger left of the title on small screens. **The page title lives here, not in the content** — so every screen starts at the same rhythm and the content area opens straight into data.

### Data table
List view of the pipeline. Container `--radius-md`, `--color-bg-sunken` fill. Eyebrow `th` labels, `--color-border-subtle` row rules, `.tabular-nums` dates, row hover `--color-surface-hover`.

### Dialogs
Overlay-elevation card over a `--scrim-dialog` sheet. `--color-surface`, `--radius-lg`, `--shadow-dialog`, `--space-6` pad. **Form dialog** for creating; **confirm dialog** (narrower, danger action) for destructive intent. Close affordance top-right (`X` icon).

### Pull-out drawer
Right-docked panel over `--scrim-drawer` for quick tasks that shouldn't take the whole page (quick-add, edit contacts, filters — and RoleCall's resume/cover-letter panels). `min(440px, 100%)` wide, `--color-surface` bg, `--shadow-drawer`, scrollable. Dismiss via sheet, `X`, Escape, or Cancel.

### Feedback, loading & empty states
- **Toast:** `--color-text` bg, `--color-bg` text, `--radius-md`, fixed bottom-center, `--z-toast`, with a colored status dot; auto-dismiss + manual `X`.
- **Empty state:** invite the first entry rather than showing a blank surface — Phosphor icon in a `--radius-full` `--color-surface-active` circle, `--text-section` title, one encouraging line, primary CTA. Component: `EmptyState.tsx`.
- **Loading:** skeleton blocks matching the destination layout's rhythm, so nothing jumps when data lands. `--color-surface-active` fill, `--radius-xs`, gentle opacity pulse that respects `prefers-reduced-motion`. Mark the blocks `aria-hidden` and announce loading once via a visually-hidden `role="status"`. Component: `Skeleton.tsx`.
- **Error:** a card with a plain-language title, what to check, and a **Try again** button wired to a real retry — never a bare sentence.

## 6. Accessibility rules
- **Contrast:** body/small text uses `--color-text-muted` or darker. `--color-text-placeholder` is placeholders only; `--color-text-disabled` is non-text.
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
The **kanban board**, the **job detail page**, and **reminder components** are intentionally not designed. Jobs and Writing Library exist as routes with empty states only. A **logo mark** is still open. See [../design-review.md](../design-review.md) for the full punch-list.

**Dark mode is structured for but not built.** The raw/semantic split in `tokens.css` exists so a dark theme is a `[data-theme="dark"]` block overriding the semantic layer — no component changes. The open work is dark variants for the eight `statuses.json` colours, which would need a shape change to that file (e.g. a `badgeBgDark` alongside each `badgeBg`).
