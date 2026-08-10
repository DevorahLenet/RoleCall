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
