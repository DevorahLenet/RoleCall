import type { CSSProperties } from 'react'
import type { Job } from '../types'
import { activeJobStatuses } from '../design-system/statuses'
import styles from './PipelineBand.module.css'

// A one-line summary of the whole board: a chevron per active stage, each
// weighted by how many jobs sit in it and tinted with the status colours from
// statuses.json. Every active stage carries its own colour so the band reads as
// a fixed legend; empty stages just fade back. Closed statuses are excluded.

// Chevron outline for one segment: point on the right, notch on the left, except
// the first (flat left) and last (flat right) so the band reads as one arrow.
function clipPath(isFirst: boolean, isLast: boolean): string {
  const notchIn = '8px 50%' // left notch (cut into by the previous chevron)
  if (isFirst) {
    return 'polygon(0 0, calc(100% - 8px) 0, 100% 50%, calc(100% - 8px) 100%, 0 100%)'
  }
  if (isLast) {
    return `polygon(0 0, 100% 0, 100% 100%, 0 100%, ${notchIn})`
  }
  return `polygon(0 0, calc(100% - 8px) 0, 100% 50%, calc(100% - 8px) 100%, 0 100%, ${notchIn})`
}

export function PipelineBand({ jobs }: { jobs: Job[] }) {
  const lastIndex = activeJobStatuses.length - 1

  return (
    <div className={styles.band}>
      <div className={styles.track}>
        {activeJobStatuses.map((status, i) => {
          const inStage = jobs.filter((j) => j.status === status.id)
          const count = inStage.length
          const names = count ? inStage.map((j) => j.company).join(', ') : 'None'
          const isFirst = i === 0
          const isLast = i === lastIndex

          // Every stage wears its own status colour; empty ones fade back (they
          // also stay narrow, since flexGrow only expands with the count).
          const segStyle: CSSProperties = {
            flexGrow: count ? count * 3 : 1,
            flexBasis: 0,
            marginRight: isLast ? 0 : '-1px',
            paddingLeft: isFirst ? 'var(--space-3)' : 'var(--space-5)',
            clipPath: clipPath(isFirst, isLast),
            background: status.badgeBg,
            color: status.badgeFg,
            opacity: count ? 1 : 0.5,
          }

          return (
            <a key={status.id} href="#" className={styles.segment} style={segStyle}>
              <span className={styles.labelRow}>
                <span
                  className={styles.dot}
                  style={{ background: status.dot }}
                  aria-hidden
                />
                <span className={styles.label}>{status.label}</span>
              </span>
              <span
                className={styles.names}
                style={{ fontStyle: count ? 'normal' : 'italic' }}
              >
                {names}
              </span>
            </a>
          )
        })}
      </div>
      <a href="#" className={styles.boardLink}>
        Job board →
      </a>
    </div>
  )
}
