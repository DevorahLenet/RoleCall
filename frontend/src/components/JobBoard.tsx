import { useEffect, useRef } from 'react'
import type { Job } from '../types'
import { activeJobStatuses } from '../design-system/statuses'
import { JobCard } from './JobCard'
import { TruncatedText } from './TruncatedText'
import styles from './JobBoard.module.css'

interface Props {
  jobs: Job[]
  /** Stage arrived at via `?status=` (sidebar or pipeline band): highlighted and,
   *  on a stacked layout, scrolled to. `null` when the board was opened plainly. */
  focusedStatusId: string | null
}

// Newest first within a column: by applied date descending, with jobs that
// haven't gone out yet at the tail, then by creation. ISO date strings sort
// chronologically as plain strings, so no parsing is needed.
function byRecency(a: Job, b: Job): number {
  if (a.applied_on !== b.applied_on) {
    if (!a.applied_on) return 1
    if (!b.applied_on) return -1
    return a.applied_on < b.applied_on ? 1 : -1
  }
  return a.created_at < b.created_at ? 1 : -1
}

// The Jobs board: one column per active stage in statuses.json, all five on
// screen at once. Closed stages aren't columns here — the board is the live
// pipeline.
export function JobBoard({ jobs, focusedStatusId }: Props) {
  const focusedRef = useRef<HTMLElement | null>(null)

  // Only matters once the columns have stacked (below 600px), where a deep link
  // to a late stage would otherwise land at the top of the board. On the wide
  // layout every column is already visible, so `block: 'nearest'` no-ops.
  useEffect(() => {
    const el = focusedRef.current
    if (!el) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'nearest' })
  }, [focusedStatusId])

  return (
    <div className={styles.board}>
      {activeJobStatuses.map((status) => {
        const items = jobs.filter((j) => j.status === status.id).sort(byRecency)
        const focused = status.id === focusedStatusId
        const headingId = `board-col-${status.id}`

        return (
          <section
            key={status.id}
            ref={focused ? focusedRef : undefined}
            className={focused ? `${styles.column} ${styles.columnFocused}` : styles.column}
            aria-labelledby={headingId}
          >
            <h2 id={headingId} className={styles.columnHead}>
              <span className={styles.dot} style={{ background: status.dot }} aria-hidden />
              <TruncatedText text={status.label} className={styles.columnLabel} />
              <span className={items.length ? styles.count : styles.countZero}>
                {items.length}
              </span>
            </h2>

            {items.length === 0 ? (
              <p className={styles.empty}>Nothing yet in this stage</p>
            ) : (
              <div className={styles.stack}>
                {items.map((job) => (
                  <JobCard key={job.id} job={job} />
                ))}
              </div>
            )}
          </section>
        )
      })}
    </div>
  )
}
