import { NavLink } from 'react-router-dom'
import { BookOpen, Briefcase, Sun, X } from '@phosphor-icons/react'
import type { Job } from '../types'
import { activeJobStatuses } from '../design-system/statuses'
import { TruncatedText } from './TruncatedText'
import styles from './Sidebar.module.css'

// Nav vocabulary is settled: Today · Jobs · Writing Library. Closed jobs are a
// filter under Jobs, not a destination — there is no Archive item.
const NAV_ITEMS = [
  { to: '/', label: 'Today', Icon: Sun, end: true },
  { to: '/jobs', label: 'Jobs', Icon: Briefcase, end: false },
  { to: '/writing', label: 'Writing Library', Icon: BookOpen, end: false },
]

interface Props {
  jobs: Job[]
  /** Mobile only: the drawer is open, and this closes it. */
  open: boolean
  onClose: () => void
}

// Persistent left rail: brand, primary nav, live pipeline counts that double as
// Jobs filters, and an account slot pinned to the bottom. Below 900px it becomes
// an overlay drawer driven by `open` (see AppShell for the trigger).
export function Sidebar({ jobs, open, onClose }: Props) {
  // Count jobs per active stage once, so each stage row can show its own total.
  const countByStatus = jobs.reduce<Record<string, number>>((acc, job) => {
    acc[job.status] = (acc[job.status] ?? 0) + 1
    return acc
  }, {})

  return (
    <aside className={open ? `${styles.sidebar} ${styles.open}` : styles.sidebar}>
      <div className={styles.brandRow}>
        <span className={styles.wordmark}>RoleCall</span>
        <button
          type="button"
          className={styles.close}
          aria-label="Close navigation"
          onClick={onClose}
        >
          <X size={18} aria-hidden />
        </button>
      </div>

      <nav className={styles.nav} aria-label="Main">
        {NAV_ITEMS.map(({ to, label, Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onClose}
            className={({ isActive }) =>
              isActive ? `${styles.navItem} ${styles.navItemActive}` : styles.navItem
            }
          >
            <Icon size={17} aria-hidden />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Pipeline counts are navigation, not decoration — each filters Jobs. */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Pipeline</h2>
        <nav className={styles.stages} aria-label="Pipeline stages">
          {activeJobStatuses.map((status) => {
            const count = countByStatus[status.id] ?? 0
            return (
              <NavLink
                key={status.id}
                to={`/jobs?status=${status.id}`}
                onClick={onClose}
                className={styles.stage}
              >
                <span className={styles.dot} style={{ background: status.dot }} aria-hidden />
                <TruncatedText text={status.label} className={styles.stageLabel} />
                <span className={count ? styles.count : styles.countZero}>{count}</span>
              </NavLink>
            )
          })}
        </nav>
      </div>

      <div className={styles.account}>
        <span className={styles.avatar} aria-hidden>
          D
        </span>
        <span className={styles.accountName}>Devorah</span>
      </div>
    </aside>
  )
}
