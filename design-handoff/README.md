# Design handoff — "Step forward" (Oct 2026)

A frozen visual reference for the redesign. Pulled from the Claude Design **RoleCall** project (`rolecall-new/`, itself a cleaned handoff of the *Grove 14s* exploration).

**Open `today.html` in a browser** to see the target. It renders with its own `tokens.css` so it looks exactly as designed.

## This folder is reference, not source

- **The app's tokens are `../design-system/tokens.css`.** That file already carries every value from this handoff, merged into the app's existing token names, plus what the app needs that the handoff lacks. Never import `design-handoff/tokens.css` into the app.
- **Pipeline colours are `../design-system/statuses.json`.** The `--status-*` vars here are a handoff convenience; the app resolves stage colours from the JSON.
- **Rules live in `../design-system/design-system.md` and `../CLAUDE.md`.** Where this handoff and those disagree, those win.

## Where the app deliberately differs from this handoff

| Handoff | App | Why |
|---|---|---|
| Primary button `#e5482b` | `#d23e22` (`--color-primary`) | White label was 3.97:1 — fails AA. Reads as the same coral. |
| Links `#e5482b` | `#c93b20` (`--color-link`) | 3.97:1 on white — fails AA. |
| Checkbox / input edge `#a3b3d1` | `#7a8cb0` (`--color-border-strong`) | 2.12:1 — controls need 3:1 (WCAG 1.4.11). |
| No danger colour | Crimson `#b4183c` (`--color-danger`) | Coral is now "go"; destroy must not be the same red. |
| `--control-height: 44px` | `--control-height-lg: 44px` | 44px applies to the header button and search only. General buttons and menus stay 36px on a mouse (44px on touch). |
| No sunken-well colour | `--color-bg-sunken: navy-100` | Board columns, inline-add and skeletons need a well; the sidebar now uses its own `--sidebar-*` tokens. |

## Not part of this pass

- **⌘K search field.** A new feature (command palette), not styling. The header can leave room for it, but don't build the palette as part of the restyle.
- **The title copy "Step *forward*".** Adopt it on Today; other screens keep their own titles in the same Playfair style, with an optional accent word.
