import { Plus } from '@phosphor-icons/react'
import styles from './TopNav.module.css'

// Nav vocabulary is settled: Today · Jobs · Writing Library (the design export's
// "Archive" label is superseded — closed jobs are a filter under Jobs).
const NAV_ITEMS = [
  { label: 'Today', href: '#', active: true },
  { label: 'Jobs', href: '#', active: false },
  { label: 'Writing Library', href: '#', active: false },
]

export function TopNav() {
  return (
    <header className={styles.nav}>
      <span className={styles.wordmark}>RoleCall</span>
      <nav className={styles.links}>
        {NAV_ITEMS.map((item) => (
          <a
            key={item.label}
            href={item.href}
            className={item.active ? `${styles.link} ${styles.active}` : styles.link}
            aria-current={item.active ? 'page' : undefined}
          >
            {item.label}
          </a>
        ))}
      </nav>
      <button type="button" className={styles.primary}>
        <Plus size={18} weight="bold" aria-hidden />
        New application
      </button>
    </header>
  )
}
