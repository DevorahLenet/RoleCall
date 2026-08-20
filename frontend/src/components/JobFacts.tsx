import { ArrowSquareOut } from '@phosphor-icons/react'
import type { JobDetail } from '../types'
import { formatDate } from '../format'
import { JobSection } from './JobSection'
import styles from './JobFacts.module.css'

interface Props {
  job: JobDetail
}

// The job's facts, as a labelled property list in the rail. Everything here is
// read-only at a glance and edited through the toolbar's Edit details dialog —
// stage is the one frequent edit and stays inline in the hero instead.
//
// A real <dl>: these are name/value pairs, and the markup should say so.
export function JobFacts({ job }: Props) {
  return (
    <JobSection title="Details" variant="rail">
      <dl className={styles.list}>
        <dt className={styles.label}>Applied</dt>
        {/* Not-applied-yet is a real state for a researching job, not a gap —
            it says so rather than leaving a hole where a date would be. */}
        <dd className={job.applied_on ? styles.value : styles.absent}>
          {job.applied_on ? formatDate(job.applied_on) : 'Not applied yet'}
        </dd>

        <dt className={styles.label}>Added</dt>
        <dd className={styles.value}>{formatDate(job.created_at)}</dd>

        <dt className={styles.label}>Fit</dt>
        <dd className={job.fit_score === null ? styles.absent : styles.value}>
          {job.fit_score === null ? (
            'Not rated'
          ) : (
            <>
              <span className={styles.score}>{job.fit_score}</span>
              <span className={styles.outOf}> / 10</span>
            </>
          )}
        </dd>

        {/* Blank for paper ads and referrals, so the row only exists when the
            posting does — no placeholder for a link that isn't there. */}
        {job.posting_url && (
          <>
            <dt className={styles.label}>Posting</dt>
            <dd className={styles.value}>
              <a
                className={styles.link}
                href={job.posting_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                View posting
                <ArrowSquareOut size={13} aria-hidden />
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            </dd>
          </>
        )}
      </dl>
    </JobSection>
  )
}
