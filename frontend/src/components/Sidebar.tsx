import { NavLink } from 'react-router-dom'
import { BookOpen, Briefcase, CalendarCheck, ChartBar, X } from '@phosphor-icons/react'
import type { Job } from '../types'
import { activeJobStatuses } from '../design-system/statuses'
import { TruncatedText } from './TruncatedText'
import styles from './Sidebar.module.css'

// Nav vocabulary is settled: Today · Jobs · Writing Library · Ratings. Closed
// jobs are a filter under Jobs, not a destination — there is no Archive item.
// Each item carries its Phosphor icon (icons.md), which is what lets the four
// be told apart at a glance now that the list is long enough to scan.
const NAV_ITEMS = [
  { to: '/', label: 'Today', end: true, Icon: CalendarCheck },
  { to: '/jobs', label: 'Jobs', end: false, Icon: Briefcase },
  { to: '/writing', label: 'Writing Library', end: false, Icon: BookOpen },
  { to: '/ratings', label: 'Ratings', end: false, Icon: ChartBar },
]

interface Props {
  jobs: Job[]
  /** Mobile only: the drawer is open, and this closes it. */
  open: boolean
  onClose: () => void
}

// Persistent left rail: brand, primary nav, and live pipeline counts that double
// as Jobs filters. The account moved to the top bar, so the rail is navigation
// and nothing else. Below 900px it becomes an overlay drawer driven by `open`
// (see AppShell for the trigger).
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
        {NAV_ITEMS.map(({ to, label, end, Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onClose}
            className={({ isActive }) =>
              isActive ? `${styles.navItem} ${styles.navItemActive}` : styles.navItem
            }
          >
            <Icon className={styles.navIcon} aria-hidden />
            <span>{label}</span>
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
    </aside>
  )
}
