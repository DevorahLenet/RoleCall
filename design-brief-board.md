# Brief — the Board screen

## The concept

The board is RoleCall's home screen, in two parts.

**A pipeline band across the top** — small, ambient. One segment per active pipeline stage, with the company names written out rather than just counts. It links through to the full job kanban.

**The task list below** — the main working surface. Large.

The task list is primary. The user opens this screen to answer *"what should I do today."* The band is there to give that work context, because most tasks exist *because of* a job — and it doubles as the legend for the stage colours used down in the list.

The full kanban becomes a separate view, reached from the band. It's a weekly maintenance surface, not a daily one.

## Decisions to build on

- Tasks are the main screen. Jobs are the context, not the centrepiece.
- Tasks group by **task status**, sorted by **priority within each group**.
- Closed statuses never appear as columns — they're a filter under Jobs.
- Tasks with no job attached sit in the same list, visibly lighter but always present. They are labelled by category — **Networking** or **Professional development** — never "no job attached."

## What needs designing

**The pipeline band.** Five active stages, each showing the stage, a count, and the companies in it. An empty stage should read as aspirational — a space waiting to be filled, not a failure. Needs a way through to the kanban.

**The task row.** A native checkbox, the task name, and one pill indicating which job the task belongs to — job title or company, plus that job's pipeline stage. Non-job tasks use the same slot, lighter, naming the category instead — **Networking** or **Professional development**. Since the pill leans on colour for stage, its accessible name needs to say the stage out loud.

**Status group headers.** Status name and count. **"Waiting on" needs its own treatment** — it's the group the user *can't act on*, which is the whole reason it's separate.

**The board composed.** Band and list together, plus an empty state for a brand-new user with no jobs and no tasks.

## The concept problem to solve

The system's philosophy is *hierarchy from scale and whitespace, not boxes*, with the card as the only boxed element. A task list fits that naturally — rules, type scale, space. A pipeline band of five tinted segments does not; left to default it becomes five tiles in a row, the boxiest thing in the app. **Making the band feel like newsprint is the main thing to solve.**

A quieter second one: these users are job-searching, and rejection is the common outcome. A band mostly showing zeros shouldn't read as an indictment.

## Open questions

- **Task status has no source of truth yet**, unlike job status. What are the states, and do they get colours at all? Colour is already carrying job stage on the same row.
- Job tasks will naturally outrank networking and professional development on priority, which buries that work while appearing to include it. Does the layout need to protect it?
- **Where do closed jobs live?** Nav is now Today · Jobs · Writing Library, so there's no Archive destination — closed jobs are assumed to be a filter under Jobs. Worth confirming that's the right home.
