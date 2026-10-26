// API shapes. Statuses/priorities/categories are stored and sent as stable ids;
// the UI resolves labels and colours from the design-system resolvers.

// Slim job payload — the Jobs list/board. Mirrors JobSerializer.
export interface Job {
  id: number
  role: string
  company: string
  status: string
  posting_url: string
  applied_on: string | null
  created_at: string
}

// What the "New application" form sends. The server assigns `id`/`created_at`,
// and `company` is omitted entirely when the field is left blank so the model's
// "undisclosed" default applies rather than an empty string the model rejects.
export type NewJob = Pick<Job, 'role' | 'status'> &
  Partial<Pick<Job, 'company' | 'posting_url' | 'applied_on'>>

// Detail payload for a single job — the slim job, its long-form fields, and
// everything hanging off it. Mirrors JobDetailSerializer; only the detail
// endpoint sends these, so the board never carries a JD summary per card.
export interface JobDetail extends Job {
  /** Fit out of 10 to one decimal (8.5), or null when unrated. The reasoning
   *  behind a score lives in the job's notes, not in a field of its own. */
  fit_score: number | null
  contacts: Contact[]
  notes: Note[]
  questions: Question[]
}

/** Anything editable on a job, from the status pill, the edit dialog, or the
 *  job page's role section. `role`/`company` never go empty — the forms guard
 *  that — but everything else clears back to null or "". */
export type JobPatch = Partial<
  Pick<
    JobDetail,
    | 'role'
    | 'company'
    | 'status'
    | 'applied_on'
    | 'posting_url'
    | 'fit_score'
  >
>

// A logbook entry. Attached to exactly one of a job or a task (never both,
// never neither) — the job page only ever creates the job-attached kind.
export interface Note {
  id: number
  job: number | null
  task: number | null
  text: string
  created_at: string
}

/** An open question about a job. `resolved_at` is the stamp that closes it, and
 *  it is set together with the answer — an answered question is a resolved one. */
export interface Question {
  id: number
  job: number | null
  task: number | null
  text: string
  answer: string
  resolved_at: string | null
  created_at: string
}

/** What the contact dialog sends. `jobs` is the COMPLETE list of job ids the
 *  person is attached to — the M2M is only writable from the contact side and
 *  the API replaces the list rather than appending, so a partial list silently
 *  detaches them from their other jobs. */
export type ContactDraft = Omit<Contact, 'id'>

export interface Contact {
  id: number
  first_name: string
  last_name: string
  email: string
  phone: string
  description: string
  links: string[]
  jobs: number[]
}

export interface Task {
  id: number
  title: string
  status: string
  priority: string
  is_done: boolean
  due_on: string | null
  job: number | null
  // Read-only job context for the row chip (present when job is set).
  job_company: string | null
  job_status: string | null
  category: string
  created_at: string
}

/** What the task form sends, creating or editing. The server assigns
 *  `id`/`created_at` and echoes back the job context (`job_company`/`job_status`)
 *  the row chip needs. `category` must be empty whenever `job` is set — the
 *  model's "never both". `is_done` rides along only on an edit: a task you are
 *  creating isn't done, so the form omits it until there is one to un-do. */
export type NewTask = Pick<
  Task,
  'title' | 'status' | 'priority' | 'category' | 'job' | 'due_on'
> &
  Partial<Pick<Task, 'is_done'>>

/** Anything patchable on an existing task, from the row (checkbox, priority,
 *  a drag between groups) or the edit dialog. */
export type TaskPatch = Partial<
  Pick<
    Task,
    'title' | 'status' | 'priority' | 'category' | 'job' | 'due_on' | 'is_done'
  >
>

// --- Writing Library ---------------------------------------------------
// Pieces are read-only here: writing is authored on a job page (still to
// build), so the library stays a view over the data rather than a second place
// to remember to populate.

/** Slim piece — a row in the library index. Mirrors WritingPieceSerializer. */
export interface WritingPiece {
  id: number
  title: string
  /** Type id from design-system/writing-types.json. */
  type: string
  job: number | null
  /** Resolved from the job, so a filter by company needs no extra column. */
  company: string | null
  /** The piece's opening passage. A library tile leads with CONTENT, so a row
   *  needs a line of the writing itself — one passage rather than the body,
   *  which would put a whole resume in every index row. */
  preview: string
  /** Which passage `preview` came from, so copying it from a tile is credited
   *  like any other copy. `null` only for a piece with no passages at all. */
  preview_passage: number | null
  created_at: string
  updated_at: string
}

/** One reusable chunk of a piece, split out of its markdown body on save.
 *  Never authored, so there is no write shape for it. */
export interface WritingPassage {
  id: number
  text: string
  position: number
  use_count: number
  last_used_at: string | null
}

/** Just enough of a piece to name it in a lineage line. */
export interface WritingPieceRef {
  id: number
  title: string
  type: string
}

/** Detail payload for the piece page — the slim piece plus its body, its
 *  passages and its lineage in both directions. */
export interface WritingPieceDetail extends WritingPiece {
  role: string | null
  body: string
  passages: WritingPassage[]
  derived_from: WritingPieceRef | null
  forks: WritingPieceRef[]
}

/** One matching line from passage search. `excerpt` carries the match wrapped
 *  in the sentinels the API defines — see HIGHLIGHT_OPEN in components/Excerpt. */
export interface PassageHit {
  passage_id: number
  text: string
  position: number
  use_count: number
  excerpt: string
  piece: WritingPieceRef
  company: string | null
}

/** The index's filters. They apply to both result modes, so browsing and
 *  searching narrow by exactly the same rules — which is why `since` is a
 *  server-side window in days rather than a client-side date comparison: a
 *  passage hit carries no date to compare. */
export interface WritingFilters {
  q: string
  type: string
  company: string
  /** "Any time" — a window in days ("30", "90", "365"), or '' for all. */
  since: string
  sort: string
}
