# RoleCall — Build Instructions

RoleCall is a job-application tracker. This file governs how the app is built so it stays visually and structurally consistent. See `../rolecall_plan.md` for product context (why, user stories, features).

## Design system — follow it strictly
The design system lives in `design-system/`. Before building or restyling any UI, read `design-system/design-system.md`.

- **Import `design-system/tokens.css` once, globally.** Reference its CSS variables for every color, font, spacing, radius, shadow, and z-index.
- **Never hardcode** a hex color, font size, spacing value, or radius. If a value you need isn't a token, add it to `tokens.css` first, then use it.
- **`tokens.css` has two layers, and components may only use the semantic one.** The raw palette (`--neutral-*`, `--cyan-*`, `--magenta-*`) exists to define the semantic layer (`--color-*`); a component referencing `--neutral-200` directly is a bug even though it renders fine today. This split is what keeps a dark theme a token addition rather than a rewrite.
- **Spacing is the 4pt scale only** (`--space-*`). No arbitrary pixel values.
- **Text color** uses `--color-text` / `--color-text-secondary` / `--color-text-muted` (the floor for text). `--color-text-placeholder` is placeholders only; `--color-text-disabled` is non-text.
- **Radius:** `--radius-xs` chips · `--radius-sm` buttons/inputs · `--radius-md` cards/menus · `--radius-lg` dialogs. **`--radius-full` is avatars, dots and count badges only** — a fully-rounded button reads consumer, not professional.
- **Reuse components** before building new ones — especially `Button.tsx`; don't re-declare button CSS in a screen's module.
- **Collections are flat list rows, not cards:** divider + hover fill, no border/radius/shadow, 44px tall. Cards are for genuinely discrete floating items, never for page layout or list rows.
- **Priority is a rank, not a status.** Use the `--priority-*` neutrals — never a pipeline color. Status colors belong to `statuses.json` and nothing else.

## Status / pipeline
- `design-system/statuses.json` is the **single source of truth** for pipeline status. It drives kanban columns, status badges, filters, and the database status enum.
- Store a job's status as its `id` in a **database ENUM column** whose allowed values are exactly the `id`s in `statuses.json`. Use `label` for display only; resolve `label`/`dot`/`badgeBg`/`badgeFg` in the UI from this file — never store them or re-pick status colors inline. Changing the pipeline means editing `statuses.json` **and** running an enum migration.
- Changing the pipeline = editing that one file.
- `design-system/task-statuses.json` (to do / in progress / waiting) and `design-system/priorities.json` (high / med / low) are the equivalent sources of truth for tasks. Same rule: DB enum of exactly those `id`s, edit-the-file-then-migrate. Task **completion is a separate boolean**, not a status. Task status carries **no color** — colour on a task row belongs to the job's pipeline stage.

## Icons
- Use **Phosphor** (`@phosphor-icons/react`) per `design-system/icons.md`. **Never use emoji as icons.**
- Icon-only buttons need an `aria-label`; decorative icons are `aria-hidden`.

## Accessibility (non-negotiable)
- Keep the global `:focus-visible` ring on every interactive control — don't strip outlines.
- **44×44px is the floor on touch.** Controls with a transparent hit-area wrapper (checkbox, kebab, priority tag) stay 44px at every size. Buttons and menu items size from `--control-height` (36px on a fine pointer), which rises to 44px automatically under `@media (pointer: coarse)` — the one relaxation, and only where a mouse is driving.
- Native form elements (`<input>`, `<select>`, `<button>`) with associated labels.
- Design responsive — users are often on a phone. Two breakpoints carry the app: **900px** (sidebar → drawer) and **600px** (row/band reflow).
- Wrap animation in `@media (prefers-reduced-motion: reduce)`.

## Conventions
- **Comment every functional unit.** In all code files, put a concise comment above each function, component, class, or self-contained block explaining what it does, so the code reads top-to-bottom without deciphering it. Say what and why, not a restatement of the syntax; keep it to a line or two.
- Nav vocabulary: **Today · Jobs · Writing Library** — match routes to these labels. The old export's Board/Table/Archive/Contacts wording is superseded; don't reintroduce it.
- **Closed jobs are a filter under Jobs**, not a top-level destination — there is no Archive nav item. Writing Library is a different thing entirely: the reusable pool of cover letters, blurbs and impact statements (see story 3 in `../rolecall_plan.md`).
- When a change lands, keep this file and `design-system/` as the source of truth — fold new decisions back in rather than letting components drift.

## Stack & architecture (settled)
- **Frontend:** Vite + React + TypeScript in `frontend/` (strict tsconfig: `verbatimModuleSyntax`, `erasableSyntaxOnly`, no unused locals — use `import type`, no enums). Styling is **CSS Modules over `tokens.css`**; there is no component library.
- **Backend:** Django 6 + Django REST Framework in `backend/` (project `config`, app `tracker`), SQLite (`backend/db.sqlite3`, gitignored). API under `/api/` (`jobs`, `tasks`, `notes`, `questions`, `contacts`, `meta`).
- **Python** lives in the repo-root **`.venv/`** (Python 3.14, machine-wide install). Always use `.venv/Scripts/python.exe`; the bare `python` command is a Windows Store stub and won't work.
- **Enums are generated from the JSON, never hardcoded.** `backend/tracker/design_system.py` loads `design-system/*.json` to build model `choices` **and** DB `CheckConstraint`s. Editing a JSON file changes the constraint → `makemigrations` produces the migration. This is the enforcement mechanism behind the "edit the file, then migrate" rule.
- **Frontend resolvers** in `frontend/src/design-system/*.ts` import the same JSON so labels/colours resolve from one source of truth. Vite `server.fs.allow` includes the repo root so the frontend can import `../../design-system/`.

## Data model (see `backend/tracker/models.py`)
- **Job** (role, company [default "undisclosed"], applied_on, posting_url, status, created_at) · **Task** (job FK `SET_NULL`, title, category, status, is_done, priority, due_on, created_at) · **Note**/**Question** (attached to exactly one of a job or task) · **Contact** (M2M → jobs).
- **Task job/category is "never both"** (not "exactly one"): a task may briefly have neither after its job is deleted (`SET_NULL`). Completion is the `is_done` boolean, never a status.
- **Auth is deferred:** no `user` FK yet; adding it later is an additive migration. DRF runs open (no auth class, `AllowAny`) for the single-user MVP — lock down when auth lands.

## App shell (built)
- **Left sidebar** (`components/Sidebar.tsx`, 240px, `--color-bg-sunken`): wordmark · nav (Today · Jobs · Writing Library) · a `Pipeline` section of active stages with live counts linking to `/jobs?status=<id>` · account slot. Collapses to an overlay drawer below 900px.
- **`components/AppShell.tsx`** owns the frame and mounts `useTracker()` — one fetch feeds both the sidebar counts and the Today list. Screens render into its `Outlet` and read data via `useTrackerContext()`.
- **`components/Toolbar.tsx`** is the sticky per-screen header and **owns the page title** — screens don't render their own `<h1>`.
- **Routes:** `/` Today · `/jobs` · `/writing` (react-router). Jobs and Writing Library are empty-state stubs; the board and detail page aren't designed yet.

## Today screen (built)
- Pipeline band (inset, not full-bleed chrome) over the grouped task list. Rows render **checkbox · title · chip · priority · row menu** as a **flat 44px list row** — no dates (`due_on` is stored but not displayed), no waiting day-count. Done tasks strike through and mute in place at the tail of their group. The row menu (kebab) holds **Edit title** (inline rename) and **Delete task**; both edits are optimistic with revert-on-failure. Delete is behind the menu (no separate confirm dialog yet).
- Groups by task-status order under an eyebrow header carrying a count; sorts unfinished-first then by priority rank.
- Loading renders skeleton rows; the error state is a card with a working **Try again** wired to `reload()`.

## Running the app
- **Seed** (real data, gitignored): `.venv/Scripts/python.exe backend/manage.py seed_local` (reads `seed.local.json`; wipe-and-reload).
- **Backend:** `.venv/Scripts/python.exe backend/manage.py runserver 8000`
- **Frontend:** `cd frontend && npm run dev` (serves `:5173`, calls the API at `localhost:8000`).
- **npm needs the system CA:** this machine intercepts TLS, so npm install/create must run with `NODE_OPTIONS=--use-system-ca` (don't disable strict-ssl). Not needed once deps are installed.
