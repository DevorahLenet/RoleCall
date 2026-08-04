// Non-job task category resolver. task-categories.json is the single source of
// truth. A category chip is a lighter, outline pill (no pipeline colour) shown
// only when a task has no job attached.
import categoriesJson from '../../../design-system/task-categories.json'

export interface TaskCategory {
  id: string
  label: string
  description: string
}

export const taskCategories = categoriesJson.categories as unknown as TaskCategory[]

const byId: Record<string, TaskCategory> = Object.fromEntries(
  taskCategories.map((c) => [c.id, c]),
)

// Resolve a category id to its record; undefined for the empty (job-attached) case.
export function getCategory(id: string | ''): TaskCategory | undefined {
  return id ? byId[id] : undefined
}
