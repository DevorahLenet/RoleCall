import { useEffect, useRef, useState } from 'react'
import type { CSSProperties, DragEvent } from 'react'
import type { Job } from '../types'
import type { JobStatus } from '../design-system/statuses'
import { activeJobStatuses, getJobStatus } from '../design-system/statuses'
import { JobCard } from './JobCard'
import { TruncatedText } from './TruncatedText'
import styles from './JobBoard.module.css'

// Each lane is tinted with its own stage colour, which is what keeps the board
// readable as the pipeline once the columns stack on a phone and the headers
// scroll apart. The three values come from statuses.json — the one source of
// stage colour — and are handed to CSS as custom properties so the mixing
// (25% into the page for the fill, 55% for the outline) stays in the stylesheet.
function laneColors(status: JobStatus): CSSProperties {
  return {
    '--sb': status.badgeBg,
    '--sf': status.badgeFg,
    '--sd': status.dot,
  } as CSSProperties
}

interface Props {
  jobs: Job[]
  /** Stage arrived at via `?status=` (sidebar or pipeline band): highlighted and,
   *  on a stacked layout, scrolled to. `null` when the board was opened plainly. */
  focusedStatusId: string | null
  onChangeJobStatus: (job: Job, statusId: string) => void
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

// The Jobs board: one lane per active stage in statuses.json, all five on
// screen at once, each tinted with its own stage colour. Cards move between
// stages by dragging them into another lane — optimistic, persisted by PATCH.
// The non-drag path is the job page's stage pill: the card carries no pill of
// its own now that the lane's tint says which stage it is in.
export function JobBoard({ jobs, focusedStatusId, onChangeJobStatus }: Props) {
  const focusedRef = useRef<HTMLElement | null>(null)
  // The card currently in hand. Its status is kept alongside the id because
  // dragover has to decide whether a column is a valid target, and dataTransfer
  // payloads are unreadable until drop.
  const [dragged, setDragged] = useState<{ id: number; status: string } | null>(null)
  const [dropTarget, setDropTarget] = useState<string | null>(null)
  // Narrates a move that a sighted user simply watches happen.
  const [announcement, setAnnouncement] = useState('')

  // Only matters once the columns have stacked (below 600px), where a deep link
  // to a late stage would otherwise land at the top of the board. On the wide
  // layout every column is already visible, so `block: 'nearest'` no-ops.
  useEffect(() => {
    const el = focusedRef.current
    if (!el) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'nearest' })
  }, [focusedStatusId])

  // The one place a stage change is committed, whichever gesture asked for it.
  function moveJob(job: Job, statusId: string) {
    if (job.status === statusId) return
    onChangeJobStatus(job, statusId)
    setAnnouncement(`${job.role} moved to ${getJobStatus(statusId)?.label ?? statusId}`)
  }

  function clearDrag() {
    setDragged(null)
    setDropTarget(null)
  }

  // preventDefault is what marks a column as a valid drop target, and it runs
  // unconditionally: gating it on React state would mean any tick where
  // `dragged` isn't populated yet silently swallows the drop. The state only
  // decides whether to *highlight* — landing a card back on its own column is
  // already a no-op in moveJob.
  function handleDragOver(e: DragEvent<HTMLElement>, statusId: string) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    const wanted = dragged && dragged.status !== statusId ? statusId : null
    if (dropTarget !== wanted) setDropTarget(wanted)
  }

  // dragleave also fires when the pointer crosses onto a child, so only clear
  // the highlight when the pointer has genuinely left the column's subtree.
  function handleDragLeave(e: DragEvent<HTMLElement>) {
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
      setDropTarget(null)
    }
  }

  // dataTransfer is the source of truth, with the drag state as a fallback: a
  // drop that can't identify its card would otherwise fail silently, which looks
  // exactly like the drop never registering at all.
  function handleDrop(e: DragEvent<HTMLElement>, statusId: string) {
    e.preventDefault()
    const id = Number(e.dataTransfer.getData('text/plain')) || dragged?.id
    const job = jobs.find((j) => j.id === id)
    if (job) moveJob(job, statusId)
    clearDrag()
  }

  return (
    <>
      <div className={styles.board}>
        {activeJobStatuses.map((status) => {
          const items = jobs.filter((j) => j.status === status.id).sort(byRecency)
          const focused = status.id === focusedStatusId
          const isDropTarget = dropTarget === status.id
          const headingId = `board-col-${status.id}`

          const classes = [
            styles.column,
            focused ? styles.columnFocused : '',
            isDropTarget ? styles.columnDropTarget : '',
          ]
            .filter(Boolean)
            .join(' ')

          return (
            <section
              key={status.id}
              ref={focused ? focusedRef : undefined}
              className={classes}
              style={laneColors(status)}
              aria-labelledby={headingId}
              onDragOver={(e) => handleDragOver(e, status.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, status.id)}
            >
              {/* No dot: the lane's tint already carries the stage, and the
                  header's own colour is the stage's. The count sits in a white
                  pill so it reads off the tint. */}
              <h2 id={headingId} className={styles.columnHead}>
                <TruncatedText text={status.label} className={styles.columnLabel} />
                <span className={styles.count}>{items.length}</span>
              </h2>

              {items.length === 0 ? (
                <p className={styles.empty}>Nothing here yet</p>
              ) : (
                <div className={styles.stack}>
                  {items.map((job) => (
                    <JobCard
                      key={job.id}
                      job={job}
                      stageLabel={status.label}
                      dragging={dragged?.id === job.id}
                      onDragStart={(j) => setDragged({ id: j.id, status: j.status })}
                      onDragEnd={clearDrag}
                    />
                  ))}
                </div>
              )}
            </section>
          )
        })}
      </div>

      <p className="sr-only" role="status" aria-live="polite">
        {announcement}
      </p>
    </>
  )
}
