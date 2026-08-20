import type { DragEvent } from 'react'
import type { Job } from '../types'
import { StatusPill } from './StatusPill'
import { TruncatedText } from './TruncatedText'
import styles from './JobCard.module.css'

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

interface Props {
  job: Job
  /** True while this card is the one being dragged, so it can recede. */
  dragging: boolean
  onChangeStatus: (job: Job, statusId: string) => void
  onDragStart: (job: Job) => void
  onDragEnd: () => void
}

// Short month + day, formatted by splitting the `YYYY-MM-DD` string rather than
// going through `new Date(iso)`: the Date constructor reads a bare date as UTC
// midnight, which renders as the previous day for anyone west of Greenwich.
function formatApplied(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m || !d || m > 12) return iso
  return `${MONTHS[m - 1]} ${d}`
}

// One application on the board: role, company, its pipeline stage, and the date
// it went out. A card rather than a list row because on the board these really
// are discrete items floating in a column — the one shape cards are for.
//
// The whole card is a drag handle for moving between stages; the status pill
// does the same thing by menu, for keyboards and touch.
export function JobCard({ job, dragging, onChangeStatus, onDragStart, onDragEnd }: Props) {
  // The job id rides along in dataTransfer as well as in the board's state:
  // setting some payload is what makes the drag valid in Firefox, and reading it
  // back on drop is more reliable than trusting state to still be current.
  //
  // The state update is deferred by a tick on purpose. Restyling the dragged
  // element *during* dragstart (here, dropping it to 40% opacity) makes Chrome
  // cancel the drag before it begins — the browser is still snapshotting the
  // element for its drag image. Letting dragstart finish first fixes it.
  function handleDragStart(e: DragEvent<HTMLElement>) {
    e.dataTransfer.setData('text/plain', String(job.id))
    e.dataTransfer.effectAllowed = 'move'
    setTimeout(() => onDragStart(job), 0)
  }

  return (
    <article
      className={dragging ? `${styles.card} ${styles.cardDragging}` : styles.card}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={onDragEnd}
    >
      {/* The role is the card's one link: it opens the posting in a new tab, and
          says so to screen readers. Without a URL it stays plain text, so
          nothing suggests a target that isn't there. `draggable={false}` keeps
          the browser from dragging the URL instead of the card. */}
      <h3 className={styles.role}>
        {job.posting_url ? (
          <a
            className={styles.roleLink}
            href={job.posting_url}
            target="_blank"
            rel="noopener noreferrer"
            draggable={false}
          >
            {job.role}
            <span className="sr-only"> (opens the posting in a new tab)</span>
          </a>
        ) : (
          job.role
        )}
      </h3>

      <TruncatedText text={job.company} className={styles.company} />

      <div className={styles.foot}>
        {/* Stage is on the card as well as the column header — the columns stack
            on a phone, where the header scrolls out of sight. */}
        <StatusPill
          statusId={job.status}
          onChange={(statusId) => onChangeStatus(job, statusId)}
        />

        {/* No date, no element — an un-applied job says nothing rather than
            carrying a placeholder. The label is there only for screen readers,
            which would otherwise hear a bare "Mar 12". */}
        {job.applied_on && (
          <span className={styles.applied}>
            <span className="sr-only">Applied </span>
            {formatApplied(job.applied_on)}
          </span>
        )}
      </div>
    </article>
  )
}
