import styles from './Skeleton.module.css'

// Placeholder rows matching the task-row rhythm, so the layout doesn't jump when
// data lands. Hidden from assistive tech — the live region announcing "loading"
// belongs to the screen, not to these blocks.
export function SkeletonRows({ count = 5 }: { count?: number }) {
  return (
    <div className={styles.list} aria-hidden>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className={styles.row}>
          <span className={styles.check} />
          <span className={styles.title} />
          <span className={styles.chip} />
        </div>
      ))}
    </div>
  )
}

// Placeholder columns matching the Jobs board's rhythm — same column width, same
// card stack — so the board doesn't jump when the applications land.
export function SkeletonBoard({ columns = 5, cards = 3 }: { columns?: number; cards?: number }) {
  return (
    <div className={styles.board} aria-hidden>
      {Array.from({ length: columns }, (_, c) => (
        <div key={c} className={styles.column}>
          <span className={styles.columnHead} />
          {Array.from({ length: cards }, (_, i) => (
            <span key={i} className={styles.card} />
          ))}
        </div>
      ))}
    </div>
  )
}
