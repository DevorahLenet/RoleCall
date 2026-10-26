import { useRef } from 'react'
import type { DragEvent, MouseEvent } from 'react'
import { Link } from 'react-router-dom'
import type { Job } from '../types'
import { formatDate } from '../format'
import styles from './JobCard.module.css'

interface Props {
  job: Job
  /** The lane's stage, carried for screen readers only — the tint is visual. */
  stageLabel: string
  /** True while this card is the one being dragged, so it can recede. */
  dragging: boolean
  onDragStart: (job: Job) => void
  onDragEnd: () => void
}

// One application on the board, at a fixed height so the lanes line up: the
// company as an eyebrow, the role, and one status line pinned to the bottom.
//
// No stage pill and no dot — the lane's tint carries the stage, and repeating
// it on every card inside that lane was five copies of one fact. The stage
// still reaches a screen reader, which can't see the tint, via an sr-only line.
// Changing stage is by drag here, or from the job page's stage pill.
//
// The whole card opens the job page, via a link stretched across it rather than
// a click handler on the article, so it keeps a real href: middle-click, copy
// link and keyboard focus all work. Only the role's link to the posting is
// raised above that layer, and only because it is a target in its own right —
// raising anything inert would put dead space over the card.
//
// The card is also the drag handle for moving between stages.
export function JobCard({ job, stageLabel, dragging, onDragStart, onDragEnd }: Props) {
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

  // One line, always present, so every card is the same height: the date it
  // went out, or — for a job that hasn't been applied to yet — the date you
  // started tracking it. "Not applied yet" is the job page's job to say; here
  // the line is a timestamp either way.
  const status = job.applied_on
    ? `Applied ${formatDate(job.applied_on)}`
    : `Started ${formatDate(job.created_at)}`

  return (
    <article
      className={dragging ? `${styles.card} ${styles.cardDragging}` : styles.card}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <span className={styles.company}>{job.company}</span>

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

      <span className={styles.meta}>{status}</span>

      {/* Last in the DOM so a screen reader reads the card's content before
          being offered the link to open it. Visually it covers the whole card,
          and it carries the stage the tint shows only to the eye. */}
      <Link
        className={styles.open}
        to={`/jobs/${job.id}`}
        draggable={false}
        onClick={handleOpenClick}
      >
        <span className="sr-only">
          {`Open ${job.role} at ${job.company} — ${stageLabel}`}
        </span>
      </Link>
    </article>
  )
}
