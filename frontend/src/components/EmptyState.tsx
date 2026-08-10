import type { ReactNode } from 'react'
import styles from './EmptyState.module.css'

interface Props {
  icon: ReactNode
  title: string
  /** One encouraging line — invite the first entry, don't just report emptiness. */
  message: string
  action?: ReactNode
}

// Shown wherever a surface has no rows yet. The brief is "invite the first entry
// rather than show a blank surface", so this always carries a next step.
export function EmptyState({ icon, title, message, action }: Props) {
  return (
    <div className={styles.wrap}>
      <span className={styles.badge} aria-hidden>
        {icon}
      </span>
      <h2 className={styles.title}>{title}</h2>
      <p className={styles.message}>{message}</p>
      {action && <div className={styles.action}>{action}</div>}
    </div>
  )
}
