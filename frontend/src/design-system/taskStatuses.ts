// Task status resolver. task-statuses.json is the single source of truth. The
// list order is Today's group order — In progress, then Waiting, then To do:
// finish what you started, chase what is blocked, and the queue can wait.
import taskStatusesJson from '../../../design-system/task-statuses.json'

export interface TaskStatus {
  id: string
  label: string
  description: string
}

// JSON order drives the Today group order (in_progress → waiting → todo).
export const taskStatuses = taskStatusesJson.statuses as unknown as TaskStatus[]

const byId: Record<string, TaskStatus> = Object.fromEntries(
  taskStatuses.map((s) => [s.id, s]),
)

/** Where a new task starts. Read from the file's `$default` rather than taken
 *  from the head of the list: the list order is presentation (which group sits
 *  at the top of Today), so re-ordering the groups must not quietly change what
 *  a new task is born as. The model's default is loaded from the same key. */
export const defaultTaskStatusId = taskStatusesJson.$default

// Resolve a task-status id to its record (label + description); undefined if unknown.
export function getTaskStatus(id: string): TaskStatus | undefined {
  return byId[id]
}
