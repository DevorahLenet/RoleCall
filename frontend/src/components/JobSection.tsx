import type { ReactNode } from 'react'
import styles from './JobSection.module.css'

interface Props {
  title: string
  /** Optional control at the right of the header — "+ Add", "Show resolved". */
  action?: ReactNode
  /** `main` is the work column (15px heading); `rail` is reference material on
   *  a sunken panel with an 11px eyebrow. */
  variant?: 'main' | 'rail'
  children: ReactNode
}

// A titled block on the job page. The variant is the page's whole hierarchy in
// one prop: what you act on is set larger and sits on the page, what you refer
// to is set smaller and sits back from it.
export function JobSection({ title, action, variant = 'main', children }: Props) {
  const rail = variant === 'rail'

  return (
    <section className={rail ? styles.rail : styles.section}>
      <div className={styles.head}>
        <h2 className={rail ? styles.titleRail : styles.title}>{title}</h2>
        {action}
      </div>
      {children}
    </section>
  )
}
