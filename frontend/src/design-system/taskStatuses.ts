// Task status resolver. task-statuses.json is the single source of truth and the
// group order is meaningful: finish what's started, then start what's queued,
// then Waiting is information rather than work.
import taskStatusesJson from '../../../design-system/task-statuses.json'

export interface TaskStatus {
  id: string
  label: string
  description: string
}

// JSON order drives the Today group order (todo → in_progress → waiting).
export const taskStatuses = taskStatusesJson.statuses as unknown as TaskStatus[]

const byId: Record<string, TaskStatus> = Object.fromEntries(
  taskStatuses.map((s) => [s.id, s]),
)

// Resolve a task-status id to its record (label + description); undefined if unknown.
export function getTaskStatus(id: string): TaskStatus | undefined {
  return byId[id]
}
