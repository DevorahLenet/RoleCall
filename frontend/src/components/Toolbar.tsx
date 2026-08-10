import type { ReactNode } from 'react'
import { List } from '@phosphor-icons/react'
import styles from './Toolbar.module.css'

interface Props {
  title: string
  actions?: ReactNode
  /** Mobile only: opens the sidebar drawer. */
  onOpenNav: () => void
}

// Per-page header: view name left, actions right, sticky over the scrolling pane.
// The page title lives here rather than in the content, so every screen starts at
// the same rhythm and the content area opens straight into data.
export function Toolbar({ title, actions, onOpenNav }: Props) {
  return (
    <header className={styles.bar}>
      <button
        type="button"
        className={styles.navToggle}
        aria-label="Open navigation"
        onClick={onOpenNav}
      >
        <List size={20} aria-hidden />
      </button>
      <h1 className={styles.title}>{title}</h1>
      {actions && <div className={styles.actions}>{actions}</div>}
    </header>
  )
}
