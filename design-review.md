# RoleCall Design System — Design Review

Review of `RoleCall Design System.dc.html` (v1.0, Jul 2026), as a UI/UX critique for aesthetic quality and market fit (audience: job seekers). See [rolecall_plan.md](../rolecall_plan.md) for RoleCall's why, user stories, and design/UX notes.

---

## Changes made since this review (by Devorah)

Fixes accepted and applied to the design system:

- ✅ **Body links** — consistently use `#006786`, never `#0088b0`.
- ✅ **Spacing** — snapped everything to a 4pt scale (4, 8, 12, 16, 20, 24, 32, 48, 64).
- ✅ **Applied vs. Intro differentiation** — made more distinct: lighter Applied, darker Intro; fixed everywhere.
- ✅ **Intro color** — dark cyan everywhere (not yellow); resolved the cyan-vs-yellow inconsistency.
- ✅ **Primary button** — darkened fill to `#007391`/`#006786` so the label passes 4.5:1 contrast.
- ✅ **Offer vs. danger collision resolved** — Offer kept magenta `#d6006c`; danger/destructive moved to a more orange/red hue, distinct from Offer.
- ✅ **Muted gray** — demoted `#7d7979` to decorative only; `#605d5d` now used for all small text.
- ✅ **Focus states** — added a visible focus state to every interactive control.

**Next up:** a design concept (not the core screens yet — deliberately deferred). Still open from the punch-list below: emoji → real icon set, core surfaces (kanban board, detail page, dashboard, priority, reminders — deferred by choice), error/loading states, responsive/mobile, touch targets, native form semantics, logo mark, IA naming drift.

## Addressed in the Aug 2026 app redesign

The editorial "newsprint" register was retired for an application register (see `design-system/design-system.md` §1). That closed several items below:

- ✅ **#7 real icon set** — Phosphor throughout, no emoji.
- ✅ **#9 error & loading states** — skeleton rows on load; an error card with a working retry.
- ✅ **#10 responsive** — 900px (sidebar → drawer) and 600px (row/band reflow) breakpoints.
- ✅ **#13 surface separation** — the root cause is gone: ground and surface are both white, and separation now comes from dividers, borders and a re-tuned shadow scale rather than from two near-identical off-whites.
- ✅ **§8 touch targets** — 44px floor on touch, with compact controls only on fine pointers.
- ✅ **§8 native semantics** — real `<input>`/`<button>` elements with labels and `aria-label`s.
- ✅ **§4 type scale** — formalized and sized for an application (20/15/14/13/12/11).
- ✅ **§1 "restraint tips into flat"** — density and a real shell replace the long stretches of near-identical cards.

Still open: dashboard/momentum stats (#8, #12), a celebratory Offer moment (#12), and a logo mark (#11). The **kanban board** and the **job detail page** have since been built.

---

## Overall verdict — 7 / 10

Genuinely good work with a real point of view — the newsprint / "process inks on paper" concept is differentiated, disciplined, and reads like a considered product, not a template. The visual language is coherent and the component breadth is impressive for a first pass. But two structural problems matter more than any pixel: (1) a handful of real WCAG contrast failures on the most-used elements, and (2) it's a *component gallery*, not yet a spec for RoleCall's actual screens — the kanban board, detail page, dashboard, priority, and reminders (five core surfaces) aren't designed here. Strong as a foundation; ~60% complete as a buildable system.

---

## 1. Aesthetic quality — Strong
- **Works:** High craft. Hierarchy comes from scale + whitespace, not boxes — the "one boxed element (the card)" rule gives editorial calm most trackers lack. Hairline dividers, tabular figures, eyebrow labels feel Linear/Stripe-tier. Clears the "real product vs. template" bar.
- **Weak:** Restraint occasionally tips into flat — long stretches of near-identical `#f8f4f4` cards on `#f3f2f2` paper have low surface separation. Elegant but quiet, under-delivering on the "motivating/encouraging" brief.
- **Fix:** Keep the discipline; earn one or two moments of contrast/energy per screen.

## 2. Color — Needs work (Critical issues)
- 🔴 **Critical — primary button failed AA.** Cyan `#0088b0` + `#f3f2f2` label ≈ 3.6:1 (white ≈ 4.1:1). Fix: darken to ~`#007391`/`#006786`. *(Addressed.)*
- 🔴 **High — muted gray text failed AA.** `#7d7979` on paper ≈ 3.9:1, used pervasively for small caps labels/meta. Fix: `#605d5d` (≈5.6:1) for text. *(Addressed.)*
- 🔴 **High — semantic collision.** Magenta `#d6006c` meant both "Offer" (triumph) and "Delete/Danger." Fix: separate them. *(Resolved — danger moved to an orange/red; Offer kept magenta.)*
- 🟡 **Medium — adjacent statuses too similar.** "Applied" `#38a6cf` and "Intro" `#006786` both cyan; hard to tell at dot scale. Plus Intro was cyan in the array but yellow in the drawer chip. *(Addressed.)*
- 🟡 **Nice-to-have:** body links should always use `#006786`. *(Addressed.)*

## 3. Typography — Strong
- **Works:** Figtree at 4 weights — friendly-but-professional; tight display tracking, generous body line-height (16/1.65, 56–62ch), `tabular-nums` on dates.
- **Weak:** Over-reliance on 11–12px uppercase labels (worst-case scan target with low-contrast gray). Scale is slightly ad hoc.
- **Fix:** Formalize a type scale (e.g. 12/14/16/20/24/32/44/64); reduce caps micro-labels per screen.

## 4. Spacing & layout — Weakest foundation area
- **Works:** Radius system is clean and intentional — 8 (controls) / 12 (cards) / 16 (containers) / 999 (pills). Elevation sm/md/lg sensible.
- **Weak:** Spacing was not on a scale (10, 11, 13, 15, 17, 22, 26, 28px…) — would drift immediately when tokenized.
- **Fix:** Snap to a 4pt scale. *(Addressed.)*

## 5. Component coverage — Good, with critical gaps
- **Complete primitives:** buttons, badges, tags, full form kit, cards, nav, table, dialogs, drawer, toast, empty state.
- **Missing (the actual product):**
  - The **kanban board** itself (columns, headers, big/small treatment, closed columns) — the #1 surface.
  - The **detail page composition** (core-info block; notes/blockers/questions organized-text + edit-mode; right-docked resume/cover-letter drawers as a layout).
  - **Dashboard / todos** — entirely absent.
  - **Priority UI** (stories 4–6) and **reminder UI** (stories 7–8).
  - **Error / loading / validation** states.
  - A real **icon set** — currently emoji (✎ ⋯ 🗑 ✓), which render inconsistently and read badly to screen readers. Adopt Phosphor/Lucide.
  - **Logo mark**.

## 6. Consistency & scalability — Concept strong, structure not yet there
- **Works:** Conceptually scalable spine; the status system is already data-driven (a `RAW` array deriving dot/badge styles) — the right model to port to a status token map.
- **Weak:** Zero tokens/variables — every value is an inline literal. Tokenizing is the gating task before the Claude Code build.

## 7. Market fit — A genuine strength
- Stands out vs. Teal/Huntr/generic-SaaS-blue: editorial, grown-up, calm, with a concept behind it — a product asset and a good interview story. Positive instinct: "Closed · Rejected" is muted gray, not red — doesn't rub salt in a rejection. Only drag was offer=danger undercutting the best moment.

## 8. Accessibility beyond color — Needs work
- 🔴 **No visible focus states** on buttons/links/segmented/toggle/radio/checkbox. *(Addressed.)*
- 🔴 **No mobile/responsive design** — fixed 1140px desktop canvas; users job-hunt on phones. Still open.
- 🟡 **Touch targets** — small buttons (~26px) and radio/checkbox (18px) under 44px minimum.
- 🟡 **Semantics** — radios/checkboxes are styled `<span>`s; real build needs native inputs + labels.

## 9. Emotional design — Under-delivered vs. the brief
- **Works:** Calm paper ground, inviting empty state, confirming toast.
- **Weak:** Brief asks for motivating/encouraging/momentum/wins — almost none present. No celebratory moment (offer colored like danger), no progress/momentum, no "wins" surface; dashboard undesigned.
- **Fix:** (a) give Offer/Hired a genuine celebratory beat (magenta now reads as the "win" color, since danger moved to orange/red — lean into that with a moment of delight); (b) design a dashboard with 2–3 warm momentum stats; (c) give "wins & learns" a small affirming home.

---

## Ordered punch-list — before tokenizing & building

**Critical (correctness/accessibility):**
1. Darken primary button so label passes 4.5:1. ✅
2. Separate Offer from danger. ✅ *(Danger → orange/red; Offer kept magenta.)*
3. Demote `#7d7979` to decorative; `#605d5d` for small text. ✅
4. Visible focus state on every control. ✅
5. Differentiate Applied vs. Intro; resolve Intro cyan-vs-yellow. ✅

**High (makes it buildable & real):**
6. Extract tokens: color, 4pt spacing scale ✅, radii, type scale, shadows, z-index. Port status `RAW` as a token map.
7. Replace emoji with a real icon set (Phosphor/Lucide).
8. Design the missing core surfaces: kanban board, detail page, dashboard/todos.
9. Add error, validation, loading/skeleton states.
10. Define responsive/mobile behavior for board, detail, drawers.

**Nice-to-have (polish & delight):**
11. Priority indicator + reminder components.
12. Celebratory Offer/Hired moment + dashboard momentum stats.
13. Logo mark; light surface-separation tweak so cards read off the paper.

---

## Flagged (not asked, worth knowing)
- **Naming drift:** segmented control says *Board / Table / Archive*; nav says *Board / Archive / Contacts*. Align IA vocabulary before it leaks into code/routes.
- **The `.dc.html` uses a custom `<x-dc>` / `sc-for` / `DCLogic` runtime** — none transfers to a React/Claude Code build. Treat this file as a visual reference only; tokens + components get rebuilt.
- **The status set is the data model's backbone** — lock the final list (currently 8, incl. 3 "Closed" variants) before building; it drives columns, badges, filters, and the DB enum at once.