import type { CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import type { Job } from '../types'
import { activeJobStatuses } from '../design-system/statuses'
import { TruncatedText } from './TruncatedText'
import styles from './PipelineBand.module.css'

// A one-line summary of the whole board: a chevron per active stage, each
// weighted by how many jobs sit in it and tinted with the status colours from
// statuses.json. Each segment names its stage over the companies in it, so the
// band reads as a bar chart you can also read as words. Every active stage stays
// at full strength as a fixed legend; closed statuses are excluded.

// Chevron outline for one segment: point on the right, notch on the left, except
// the first, whose left edge is flat so the band reads as one arrow.
function clipPath(isFirst: boolean): string {
  const point = 'calc(100% - 8px) 0, 100% 50%, calc(100% - 8px) 100%'
  return isFirst
    ? `polygon(0 0, ${point}, 0 100%)`
    : `polygon(0 0, ${point}, 0 100%, 8px 50%)`
}

export function PipelineBand({ jobs }: { jobs: Job[] }) {
  const lastIndex = activeJobStatuses.length - 1

  return (
    <div className={styles.band}>
      {activeJobStatuses.map((status, i) => {
        const inStage = jobs.filter((j) => j.status === status.id)
        const count = inStage.length
        // One mention per company, even with two applications there.
        const companies = [...new Set(inStage.map((j) => j.company))].join(', ')
        const isFirst = i === 0

        // Weighting only decides how the SPARE width is shared;
        // --pipeline-segment-min holds the floor, so no stage collapses.
        const segStyle: CSSProperties = {
          flexGrow: count ? count * 3 : 1,
          flexBasis: 0,
          marginRight: i === lastIndex ? 0 : '-1px',
          paddingLeft: isFirst ? 'var(--space-3)' : 'var(--space-4)',
          clipPath: clipPath(isFirst),
          background: status.badgeBg,
          color: status.badgeFg,
        }

        return (
          <Link
            key={status.id}
            to={`/jobs?status=${status.id}`}
            className={styles.segment}
            style={segStyle}
            aria-label={`${status.label}: ${count} ${count === 1 ? 'job' : 'jobs'}`}
          >
            <span className={styles.head}>
              <span className={styles.dot} style={{ background: status.dot }} aria-hidden />
              <TruncatedText text={status.label} className={styles.label} />
            </span>
            {/* An empty stage says so in words rather than fading out. */}
            {count ? (
              <TruncatedText text={companies} className={styles.names} />
            ) : (
              <span className={styles.namesEmpty}>None yet</span>
            )}
          </Link>
        )
      })}
    </div>
  )
}
