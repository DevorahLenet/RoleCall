# Design handoff — Oct 21, 2026 design pass

Frozen visual references pulled from the Claude Design **RoleCall** project. **Open the files in `components/` in a browser** to see the target. They render with the app's real `../design-system/tokens.css` (via the small `styles.css` shim here), so they can't drift from the code's values.

**These are references, not code.** Rebuild them in the existing React components and CSS modules. Never import anything from this folder into the app, and never copy markup. Icons in the references are drawn inline; the app uses Phosphor (mapping below).

| File | Shows |
|---|---|
| `components/today.html` | Today |
| `components/jobs-board.html` | Jobs board |
| `components/job-detail.html` | Job detail (Medflo) |
| `components/writing-piece.html` | Writing Library **browse**, with one piece **open** in the side panel |
| `components/writing-library-search.html` | Writing Library **search** |
| `components/screen-shell.css` | The shared frame every screen uses |
| `components/writing-library.css` | Shared by the Writing Library screens |

## What changed

### Tokens — already applied to `design-system/tokens.css`
- Page ground is `--navy-30` (`#f7f9fd`); sidebar is `--navy-850` (`#0d1c3c`).
- Titles: **Nunito Sans 800**, 25px — `--text-title` and `--text-wordmark` now match. New `--font-accent`: **Permanent Marker**, for the one accent word in a page title only.
- Roboto (`--font-task`) is now "content you wrote": task titles, notes, questions, board card roles, writing previews and paragraphs.
- New: `--topbar-bg`, `--topbar-height`, `--page-corner-radius`, `--avatar-bg`, `--avatar-text`, `--avatar-size`, `--nav-icon-size`, `--search-max-width`, `--highlight-bg`, `--highlight-text`, `--question-mark-bg`, `--question-mark-text`.
- Fonts in `frontend/index.html` already updated.

### App frame (every screen) — `screen-shell.css`
- **New `TopBar` component**: a sticky `--topbar-height` strip on `--topbar-bg`. Left: the ⌘K search field — **rendered disabled** for now (see Decisions). Right: **New application** (primary, `md`) and the account avatar (`--avatar-*`, `--avatar-size`, white ring).
- **Page sheet**: content sits on `.page` — `--color-bg` with a `--page-corner-radius` top-left corner — inset into the top-bar + sidebar frame (the pane behind it is `--topbar-bg`).
- **Sidebar**: wordmark → nav → Pipeline. Nav items get Phosphor icons at `--nav-icon-size`. **New nav item: Ratings** (placeholder page — see Decisions). **Account block removed** from the sidebar (it's in the top bar now).
- **Title accent word**: `em` in the title renders upright in `--font-accent`, weight 400, `--color-title-accent`.
- **Secondary button**: white, no border, `--shadow-search`.

### Page titles
Today "Step *forward*" · Jobs "Jobs in *progress*" · Writing Library "*Ready* when you are" (the accent word comes first). Job detail keeps the role as its title, no accent.

### Today
- **Pipeline band removed** — the sidebar's Pipeline section replaces it. Toolbar → task groups directly.
- **New task** moves to the page toolbar as a `secondary` `lg` button.

### Jobs board
- Each stage is a **tinted lane**: the stage's `badgeBg` mixed 25% into the page, with a faint outline of the same mixed 55%. Header: stage name in the stage's `badgeFg`, 600 14px, sentence case, a white count pill, no dot.
- **Cards**: fixed 112px tall, `--radius-lg`, `--shadow-task`. Company eyebrow (uppercase, muted) → role (Roboto 500 14px, 2-line clamp) → status line pinned to the bottom: **"Applied Jul 7"** when `applied_on` is set, else **"Started Jul 14"** from `created_at`. **No stage pill and no dot on cards.**
- Empty stage: dashed outline in the stage colour, "Nothing here yet".

### Job detail
- Header: white circular back button; above the title, the **company as an uppercase eyebrow** plus the stage pill (still the inline stage control). The title wraps.
- Section titles are **eyebrows**. Tasks are tiles as on Today.
- **Notes and questions are quiet tiles**: white, `--radius-lg`, a faint lift and a `--color-bg-sunken` inset outline, text in Roboto 400 `--color-text-secondary`. Notes lead with a **date square** (month over day, `--color-bg-sunken`); questions lead with a **"?" square** (`--question-mark-bg/-text`) and show "Asked Jul 13" under the text.
- Rail: Details and Contacts are `--color-bg-sunken` blocks, 300px wide, `--space-5` apart.

### Writing Library — browse and search share one layout
- **Top row**: search field (48px, `--radius-lg`, `--shadow-search`, clear ✕ when it has a value) + **Any company** and **Any time** filter buttons (48px, same surface).
- **Type pills** below: All writing / Impact statements / Blurbs / Cover letters / Resumes — glyph + label, `--control-height-sm`, `--radius-full`, white with a 1px `--color-border` inset; **active = `--priority-high-bg` / `--priority-high-text`**. Search adds a count line under them ("5 lines across 5 pieces").
- **Tiles** (12px apart), left to right: bare type glyph (20px, muted, no box) · body — **preview first** (Roboto 400 15px, 2-line clamp; search shows the full matched passage), then the **title line** (type eyebrow · piece title · company in plain muted text) · date (browse only) · **copy** button.
- **Search highlight**: `<mark>` in `--highlight-bg` / `--highlight-text`, no weight change.
- **Icon rule**: identifying icons (writing type) are bare glyphs; action icons (copy, close) always sit in a filled control.

### Writing Library — open piece
- Opening a piece shows a **side panel over the dimmed library** (min(560px, 100%), `--shadow-drawer`, `--scrim-drawer`): type glyph + type label + one-line title, quick-copy, close; a meta row (company · updated · **copy count**); then the full text, each paragraph copyable on hover. The opened tile gets a 2px `--color-accent` ring.

## Where the app differs from the Claude Design files (decided Oct 21)

| Design file | App | Why |
|---|---|---|
| Contact avatars filled with stage colours, white initials | **Navy** — `--avatar-bg` / `--avatar-text`, like the account avatar | White on teal/blue failed contrast (2.96 / 3.88), and a person isn't at a pipeline stage. Also fixes the invisible-avatar bug. |
| Count pills on job-detail section headers | **No counts** | Standing "no counts" decision; the pills also failed contrast (2.96). |
| Question mark used `--status-intro-*` | `--question-mark-bg/-text` | Same teal, but never borrows a pipeline colour. |
| "Used in 1 application" in the open-piece meta | **"Copied N×"** (sum of the piece's passage `use_count`; omit at 0) | The app doesn't track which applications a piece was used in — only copies. |
| ⌘K search field live | **Rendered disabled** — `aria-disabled`, "Search is coming soon" tooltip | The palette isn't designed yet. |
| Ratings nav item | **Links to a placeholder page** (EmptyState: "Ratings are coming") | The ratings chart isn't built yet. |
| Board scrolls sideways below 1100px | **Keeps the existing rule**: wrap below 900px, one lane per row below 600px, never a sideways scroll | Long-standing board rule; the design's scroller wasn't called out as a change. |
| 32px copy / close / paragraph-copy buttons | **Keep the 32px look inside a transparent 44px hit area**; paragraph copy always visible under `pointer: coarse` | 44px touch floor is non-negotiable. |

## Not in this sync
- **Two pieces open at once** — still being designed.
- The **⌘K palette** itself, **closed-status colours**, and the **compose-from-library** feature (see `../../rolecall_plan.md`).

## Phosphor icon mapping
Today `CalendarCheck` · Jobs `Briefcase` · Writing Library `BookOpen` · Ratings `ChartBar` · search `MagnifyingGlass` · new `Plus` · back `ArrowLeft` · edit `PencilSimple` · question `Question` · company filter `Buildings` · date filter `CalendarBlank` · dropdown `CaretDown` · All writing `SquaresFour` · Impact statement `Star` · Blurb `ChatCenteredText` · Cover letter `EnvelopeSimple` · Resume `IdentificationCard` · copy `Copy` · close `X`
