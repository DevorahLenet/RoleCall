import type { ReactNode } from 'react'
import { ArrowLeft, List } from '@phosphor-icons/react'
import { Link } from 'react-router-dom'
import styles from './Toolbar.module.css'

interface Props {
  title: string
  /** One word of `title` to set in italic coral ("Step *forward*"). Optional,
   *  and never more than one — the accent stays loud only while it's rare. */
  accent?: string
  actions?: ReactNode
  /** Route to step back to, for a screen you drill into (the job page). Omitted
   *  on the top-level screens, which have nothing to go back to. */
  backTo?: { to: string; label: string }
  /** Mobile only: opens the sidebar drawer. */
  onOpenNav: () => void
}

// Split the title around its accent word so only that word is wrapped. A word
// that isn't in the title is ignored rather than appended — the title text is
// the contract, the accent only decorates it.
function renderTitle(title: string, accent?: string): ReactNode {
  const at = accent ? title.indexOf(accent) : -1
  if (!accent || at < 0) return title
  return (
    <>
      {title.slice(0, at)}
      <em className={styles.accent}>{accent}</em>
      {title.slice(at + accent.length)}
    </>
  )
}

// Per-page header: view name left, actions right, sticky over the scrolling pane.
// The page title lives here rather than in the content, so every screen starts at
// the same rhythm and the content area opens straight into data.
export function Toolbar({ title, accent, actions, backTo, onOpenNav }: Props) {
  return (
    <header className={styles.bar}>
      <div className={styles.lead}>
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
        <h1 className={styles.title}>{renderTitle(title, accent)}</h1>
      </div>
      {actions && <div className={styles.actions}>{actions}</div>}
    </header>
  )
}
