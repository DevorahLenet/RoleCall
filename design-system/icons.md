# RoleCall — Icons

**Library: [Phosphor Icons](https://phosphoricons.com/).** In React: `@phosphor-icons/react` (`npm i @phosphor-icons/react`).

**Hard rule: never use emoji as icons.** Every icon in the UI comes from Phosphor. Emoji render inconsistently across OS/browser and are announced unpredictably by screen readers.

## Usage

```tsx
import { Plus, PencilSimple, Trash } from "@phosphor-icons/react";

<Plus size={20} weight="bold" />
```

- **Default weight:** `regular`. Use `bold` for primary-button icons, `fill` sparingly for a selected/active state.
- **Sizing:** match the adjacent text — 16px inline with body, 20px in buttons, 24px for standalone actions. Prefer `size` in px so it aligns to the type.
- **Color:** icons inherit `currentColor` — set the parent's `color`, don't hardcode.
- **Accessibility:** icon-only buttons need an `aria-label`. Decorative icons beside a text label should be `aria-hidden`.

## Mapping (replaces the emoji placeholders in the design export)

| Action / meaning | Emoji before | Phosphor icon |
|---|---|---|
| Add / new application | `+` | `Plus` |
| Edit | `✎` | `PencilSimple` |
| Overflow / more | `⋯` | `DotsThree` |
| Delete / destructive | `🗑` | `Trash` |
| Confirm / checked | `✓` | `Check` |
| Select caret | `▼` | `CaretDown` |
| Close / dismiss | `✕` | `X` |
| Open posting URL (external) | — | `ArrowSquareOut` |
| Back | — | `ArrowLeft` |

## Common app icons (for the surfaces you'll build)

| Meaning | Phosphor icon |
|---|---|
| Board (kanban) view | `Kanban` |
| Table / list view | `Rows` |
| Archive | `Archive` |
| Contacts / person | `User` / `UserCircle` |
| Email | `EnvelopeSimple` |
| Phone | `Phone` |
| Date / applied-on | `CalendarBlank` |
| Follow-up reminder | `Bell` |
| Priority | `Flag` (or `Star` for a rating) |
| Filter | `Funnel` |
| Search | `MagnifyingGlass` |
| Drag handle (reorder cards) | `DotsSixVertical` |
| Attachment / linked doc | `Paperclip` |
| Resume / cover letter (document) | `FileText` |
| Interview prep | `ChatCircleText` |
| Time tracker | `Timer` |
| Win / celebrate (Offer, wins & learns) | `Trophy` / `Confetti` |
| Notes | `NotePencil` |
| Blockers | `Warning` |
| Questions | `Question` |
