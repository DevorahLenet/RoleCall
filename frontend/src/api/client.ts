// Thin API client for the Django backend. Base URL is a constant for now; move
// to an env var (VITE_API_BASE) when there's more than one environment.
import type { Job, Task } from '../types'

const API_BASE = 'http://localhost:8000/api'

// Unwrap a fetch Response to typed JSON, throwing with the body on non-2xx.
async function toJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`${res.status} ${res.statusText}: ${body}`)
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

/** Partial update — toggling `is_done`, changing `priority`, or renaming `title`. */
export function patchTask(
  id: number,
  patch: Partial<Pick<Task, 'is_done' | 'priority' | 'title'>>,
): Promise<Task> {
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
