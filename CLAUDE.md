# RoleCall — Build Instructions

RoleCall is a job-application tracker. This file governs how the app is built so it stays visually and structurally consistent. See `../rolecall_plan.md` for product context (why, user stories, features).

## Design system — follow it strictly
The design system lives in `design-system/`. Before building or restyling any UI, read `design-system/design-system.md`.

- **Import `design-system/tokens.css` once, globally.** Reference its CSS variables for every color, font, spacing, radius, shadow, and z-index.
- **Never hardcode** a hex color, font size, spacing value, or radius. If a value you need isn't a token, add it to `tokens.css` first, then use it.
- **Spacing is the 4pt scale only** (`--space-*`). No arbitrary pixel values.
- **Text color** uses `--color-text` / `--color-text-secondary` / `--color-text-muted`. Never put text in `--neutral-500` or raw `--cyan-500` (fails contrast).
- **Reuse components** before building new ones. Keep the "hierarchy from scale & whitespace, not boxes" principle — the card is the only boxed element.

## Status / pipeline
- `design-system/statuses.json` is the **single source of truth** for pipeline status. It drives kanban columns, status badges, filters, and the database status enum.
- Store a job's status as its `id` in a **database ENUM column** whose allowed values are exactly the `id`s in `statuses.json`. Use `label` for display only; resolve `label`/`dot`/`badgeBg`/`badgeFg` in the UI from this file — never store them or re-pick status colors inline. Changing the pipeline means editing `statuses.json` **and** running an enum migration.
- Changing the pipeline = editing that one file.

## Icons
- Use **Phosphor** (`@phosphor-icons/react`) per `design-system/icons.md`. **Never use emoji as icons.**
- Icon-only buttons need an `aria-label`; decorative icons are `aria-hidden`.

## Accessibility (non-negotiable)
- Keep the global `:focus-visible` ring on every interactive control — don't strip outlines.
- Minimum 44×44px touch targets.
- Native form elements (`<input>`, `<select>`, `<button>`) with associated labels.
- Design responsive — users are often on a phone.

## Conventions
- Nav vocabulary: **TBD** — to be defined with the screens. The design export was self-inconsistent (Board/Table/Archive vs. Board/Archive/Contacts); don't reintroduce that contradiction. Settle the labels when screens are designed, then match routes.
- When a change lands, keep this file and `design-system/` as the source of truth — fold new decisions back in rather than letting components drift.
