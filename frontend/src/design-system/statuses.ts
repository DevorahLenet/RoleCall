// Job pipeline status resolver. statuses.json is the single source of truth for
// columns, badges, filters, and the DB enum — the UI resolves label/colours from
// it here and never re-picks a status colour inline.
import statusesJson from '../../../design-system/statuses.json'

export interface JobStatus {
  id: string
  label: string
  group: 'active' | 'closed'
  dot: string
  badgeBg: string
  badgeFg: string
}

// JSON order is pipeline order (researching → … → offer → closed*).
export const jobStatuses = statusesJson.statuses as unknown as JobStatus[]

const byId: Record<string, JobStatus> = Object.fromEntries(
  jobStatuses.map((s) => [s.id, s]),
)

/** Active stages, in pipeline order — closed statuses are excluded (they live
 *  under Jobs, never in the Today pipeline band). */
export const activeJobStatuses = jobStatuses.filter((s) => s.group === 'active')

/** Where a new application starts — the first active stage in pipeline order.
 *  Derived rather than typed out so it stays the same value as the Job model's
 *  `status` default; changing the pipeline's opening stage is still one file. */
export const defaultJobStatusId = activeJobStatuses[0].id

// Resolve a status id to its full record (label + colours); undefined if unknown.
export function getJobStatus(id: string | null | undefined): JobStatus | undefined {
  return id ? byId[id] : undefined
}
