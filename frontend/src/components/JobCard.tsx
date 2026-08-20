import { useRef } from 'react'
import type { DragEvent, MouseEvent } from 'react'
import { Link } from 'react-router-dom'
import type { Job } from '../types'
import { formatDate } from '../format'
import { StatusPill } from './StatusPill'
import { TruncatedText } from './TruncatedText'
import styles from './JobCard.module.css'

interface Props {
  job: Job
  /** True while this card is the one being dragged, so it can recede. */
  dragging: boolean
  onChangeStatus: (job: Job, statusId: string) => void
  onDragStart: (job: Job) => void
  onDragEnd: () => void
}

// One application on the board: role, company, its pipeline stage, and the date
// it went out. A card rather than a list row because on the board these really
// are discrete items floating in a column — the one shape cards are for.
//
// The whole card opens the job page, via a link stretched across it rather than
// a click handler on the article, so it keeps a real href: middle-click, copy
// link and keyboard focus all work. Exactly two things are raised above that
// layer, and only because they are targets in their own right: the role's link
// to the posting, and the status pill. Raising anything inert — an <h3>, the
// footer — would put dead space over the card and swallow the click.
//
// The card is also the drag handle for moving between stages.
export function JobCard({ job, dragging, onChangeStatus, onDragStart, onDragEnd }: Props) {
  // A drag that ends over the card can be followed by a synthesised click,
  // which would navigate away instead of finishing the move. This marks the
  // moment a drag ended so the very next click can be swallowed.
  const draggedAt = useRef(0)

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

  function handleDragEnd() {
    draggedAt.current = Date.now()
    onDragEnd()
  }

  function handleOpenClick(e: MouseEvent) {
    if (Date.now() - draggedAt.current < 100) e.preventDefault()
  }

  return (
    <article
      className={dragging ? `${styles.card} ${styles.cardDragging}` : styles.card}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {/* The role links to the posting, in a new tab. Without a URL it stays
          plain text, so nothing suggests a target that isn't there.
          `draggable={false}` keeps the browser from dragging the URL instead
          of the card. */}
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
            on a phone, where the header scrolls out of sight. It is raised above
            the card's link so it keeps its own menu; the date beside it is not,
            so clicking there opens the job like the rest of the card. */}
        <span className={styles.raised}>
          <StatusPill
            statusId={job.status}
            onChange={(statusId) => onChangeStatus(job, statusId)}
          />
        </span>

        {/* No date, no element — an un-applied job says nothing rather than
            carrying a placeholder. The label is there only for screen readers,
            which would otherwise hear a bare "Mar 12". */}
        {job.applied_on && (
          <span className={styles.applied}>
            <span className="sr-only">Applied </span>
            {formatDate(job.applied_on)}
          </span>
        )}
      </div>

      {/* Last in the DOM so a screen reader reads the card's content before
          being offered the link to open it. Visually it covers the whole card. */}
      <Link
        className={styles.open}
        to={`/jobs/${job.id}`}
        draggable={false}
        onClick={handleOpenClick}
      >
        <span className="sr-only">{`Open ${job.role} at ${job.company}`}</span>
      </Link>
    </article>
  )
}
