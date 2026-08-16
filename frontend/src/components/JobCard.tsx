import type { CSSProperties } from 'react'
import type { Job } from '../types'
import { getJobStatus } from '../design-system/statuses'
import { TruncatedText } from './TruncatedText'
import styles from './JobCard.module.css'

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

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
export function JobCard({ job }: { job: Job }) {
  const status = getJobStatus(job.status)

  return (
    <article className={styles.card}>
      {/* The role is the card's one link: it opens the posting in a new tab, and
          says so to screen readers. Without a URL it stays plain text, so
          nothing suggests a target that isn't there. */}
      <h3 className={styles.role}>
        {job.posting_url ? (
          <a
            className={styles.roleLink}
            href={job.posting_url}
            target="_blank"
            rel="noopener noreferrer"
          >
            {job.role}
            <span className={styles.srOnly}> (opens the posting in a new tab)</span>
          </a>
        ) : (
          job.role
        )}
      </h3>

      <TruncatedText text={job.company} className={styles.company} />

      <div className={styles.foot}>
        {/* Stage is on the card as well as the column header — the columns stack
            on a phone, where the header scrolls out of sight. Colours resolve
            from statuses.json; never re-picked here. */}
        {status && (
          <span
            className={styles.status}
            style={
              {
                background: status.badgeBg,
                color: status.badgeFg,
              } as CSSProperties
            }
          >
            <span
              className={styles.statusDot}
              style={{ background: status.dot }}
              aria-hidden
            />
            {status.label}
          </span>
        )}

        {/* No date, no element — an un-applied job says nothing rather than
            carrying a placeholder. The label is there only for screen readers,
            which would otherwise hear a bare "Mar 12". */}
        {job.applied_on && (
          <span className={styles.applied}>
            <span className={styles.srOnly}>Applied </span>
            {formatApplied(job.applied_on)}
          </span>
        )}
      </div>
    </article>
  )
}
