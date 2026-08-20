// Thin API client for the Django backend. Base URL is a constant for now; move
// to an env var (VITE_API_BASE) when there's more than one environment.
import type {
  Contact,
  ContactDraft,
  Job,
  JobDetail,
  JobPatch,
  NewJob,
  NewTask,
  Note,
  Question,
  Task,
  TaskPatch,
} from '../types'

const API_BASE = 'http://localhost:8000/api'

/** Thrown by every call that unwraps a response, carrying the status so callers
 *  can tell the cases apart — a 404 on the job page means "no such job", which
 *  is a different screen from "the server is down". */
export class ApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

// Unwrap a fetch Response to typed JSON, throwing with the body on non-2xx.
async function toJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.text()
    throw new ApiError(res.status, `${res.status} ${res.statusText}: ${body}`)
  }
  return res.json() as Promise<T>
}

// Fetch every job (slim payload) for the pipeline band.
export function getJobs(): Promise<Job[]> {
  return fetch(`${API_BASE}/jobs/`).then((r) => toJson<Job[]>(r))
}

// Fetch every task for the Today screen.
export function getTasks(): Promise<Task[]> {
  return fetch(`${API_BASE}/tasks/`).then((r) => toJson<Task[]>(r))
}

// Create a job from the New application form. Returns the saved row so the board
// can render it with the id and created_at the server assigned.
export function createJob(input: NewJob): Promise<Job> {
  return fetch(`${API_BASE}/jobs/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  }).then((r) => toJson<Job>(r))
}

// Create a task from the New task form. Returns the saved row so the list can
// render it with the id and the job context (company + stage) the server resolved.
export function createTask(input: NewTask): Promise<Task> {
  return fetch(`${API_BASE}/tasks/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  }).then((r) => toJson<Task>(r))
}

// One job with everything hanging off it — contacts, notes and questions — for
// the job page. One request rather than four.
export function getJob(id: number): Promise<JobDetail> {
  return fetch(`${API_BASE}/jobs/${id}/`).then((r) => toJson<JobDetail>(r))
}

/** Partial update — a stage move from the board, the edit dialog's fields, or
 *  the job page's role summary. Answers with the detail payload whatever was
 *  patched, so a caller holding the detail record can take the response. */
export function patchJob(id: number, patch: JobPatch): Promise<JobDetail> {
  return fetch(`${API_BASE}/jobs/${id}/`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  }).then((r) => toJson<JobDetail>(r))
}

/** Partial update — the row's own edits (`is_done`, `priority`, a drag between
 *  status groups) and the edit dialog's full save go through the same call. The
 *  response carries the re-resolved job context, so a task moved to another job
 *  comes back with the chip already correct. */
export function patchTask(id: number, patch: TaskPatch): Promise<Task> {
  return fetch(`${API_BASE}/tasks/${id}/`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  }).then((r) => toJson<Task>(r))
}

// Delete a task. Resolves on 204; throws with the body on any non-2xx.
export function deleteTask(id: number): Promise<void> {
  return fetch(`${API_BASE}/tasks/${id}/`, { method: 'DELETE' }).then((res) => {
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
  })
}

// --- Notes & questions -------------------------------------------------
// Both attach to exactly one parent; the job page always passes a job id.

export function createNote(input: Pick<Note, 'job' | 'text'>): Promise<Note> {
  return fetch(`${API_BASE}/notes/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  }).then((r) => toJson<Note>(r))
}

export function deleteNote(id: number): Promise<void> {
  return fetch(`${API_BASE}/notes/${id}/`, { method: 'DELETE' }).then((res) => {
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
  })
}

export function createQuestion(
  input: Pick<Question, 'job' | 'text'>,
): Promise<Question> {
  return fetch(`${API_BASE}/questions/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  }).then((r) => toJson<Question>(r))
}

/** Answering and resolving are one edit: `answer` and `resolved_at` are sent
 *  together, and clearing `resolved_at` reopens the question. */
export function patchQuestion(
  id: number,
  patch: Partial<Pick<Question, 'answer' | 'resolved_at'>>,
): Promise<Question> {
  return fetch(`${API_BASE}/questions/${id}/`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  }).then((r) => toJson<Question>(r))
}

export function deleteQuestion(id: number): Promise<void> {
  return fetch(`${API_BASE}/questions/${id}/`, { method: 'DELETE' }).then((res) => {
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
  })
}

// --- Contacts ----------------------------------------------------------
// The job/contact M2M is declared on Contact, so a job page writes contacts
// here rather than through the job. Every write carries the COMPLETE `jobs`
// list: the API replaces it, so sending a partial list detaches the person
// from their other jobs.

/** Every contact, for the "link an existing person" picker. */
export function getContacts(): Promise<Contact[]> {
  return fetch(`${API_BASE}/contacts/`).then((r) => toJson<Contact[]>(r))
}

export function createContact(input: ContactDraft): Promise<Contact> {
  return fetch(`${API_BASE}/contacts/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  }).then((r) => toJson<Contact>(r))
}

export function patchContact(
  id: number,
  patch: Partial<ContactDraft>,
): Promise<Contact> {
  return fetch(`${API_BASE}/contacts/${id}/`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  }).then((r) => toJson<Contact>(r))
}

export function deleteContact(id: number): Promise<void> {
  return fetch(`${API_BASE}/contacts/${id}/`, { method: 'DELETE' }).then((res) => {
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
  })
}
