import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { useTracker } from '../useTracker'
import styles from './AppShell.module.css'

// The application frame: fixed rail + scrolling content pane, with the shared
// data hook mounted here so both regions read one fetch. Screens render into the
// Outlet and pull data via useTrackerContext().
export function AppShell() {
  const tracker = useTracker()
  const [navOpen, setNavOpen] = useState(false)
  const location = useLocation()

  // Close the mobile drawer on navigation, and on Escape while it's open.
  useEffect(() => setNavOpen(false), [location.pathname, location.search])
  useEffect(() => {
    if (!navOpen) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setNavOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [navOpen])

  return (
    <div className={styles.shell}>
      <Sidebar jobs={tracker.jobs} open={navOpen} onClose={() => setNavOpen(false)} />

      {/* Scrim sits under the drawer and above the pane; mobile only. */}
      {navOpen && (
        <div
          className={styles.scrim}
          onClick={() => setNavOpen(false)}
          aria-hidden
        />
      )}

      <div className={styles.pane}>
        <Outlet context={{ ...tracker, onOpenNav: () => setNavOpen(true) }} />
      </div>
    </div>
  )
}
