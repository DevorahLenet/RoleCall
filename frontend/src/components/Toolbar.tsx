import type { ReactNode } from 'react'
import { ArrowLeft, List } from '@phosphor-icons/react'
import { Link } from 'react-router-dom'
import styles from './Toolbar.module.css'

interface Props {
  title: string
  actions?: ReactNode
  /** Route to step back to, for a screen you drill into (the job page). Omitted
   *  on the top-level screens, which have nothing to go back to. */
  backTo?: { to: string; label: string }
  /** Mobile only: opens the sidebar drawer. */
  onOpenNav: () => void
}

// Per-page header: view name left, actions right, sticky over the scrolling pane.
// The page title lives here rather than in the content, so every screen starts at
// the same rhythm and the content area opens straight into data.
export function Toolbar({ title, actions, backTo, onOpenNav }: Props) {
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
      {/* Icon-only, so it carries its destination in the label rather than in
          visible text that would crowd the title on a phone. */}
      {backTo && (
        <Link className={styles.back} to={backTo.to} aria-label={backTo.label}>
          <ArrowLeft size={18} aria-hidden />
        </Link>
      )}
      <h1 className={styles.title}>{title}</h1>
      {actions && <div className={styles.actions}>{actions}</div>}
    </header>
  )
}
