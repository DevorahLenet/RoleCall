import { useEffect, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import type { NewJob } from '../types'
import { getJobStatus } from '../design-system/statuses'
import { JobForm } from './JobForm'
import { Sidebar } from './Sidebar'
import { useTracker } from '../useTracker'
import styles from './AppShell.module.css'

// The application frame: fixed rail + scrolling content pane, with the shared
// data hook mounted here so both regions read one fetch. Screens render into the
// Outlet and pull data via useTrackerContext().
//
// The New application dialog lives here too, not on Jobs: adding an application
// is an app-level action offered from every screen's toolbar, so there is one
// dialog and one post-save rule rather than a copy per screen.
export function AppShell() {
  const tracker = useTracker()
  const [navOpen, setNavOpen] = useState(false)
  const [jobFormOpen, setJobFormOpen] = useState(false)
  // Narrates a save that a sighted user watches land in its column.
  const [announcement, setAnnouncement] = useState('')
  const location = useLocation()
  const navigate = useNavigate()

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

  // Adding while the board has a column focused starts the form on that stage,
  // so the card lands where you were looking. Anywhere else, the form falls back
  // to the pipeline's first stage.
  const onJobs = location.pathname === '/jobs'
  const focusedStatusId = onJobs
    ? new URLSearchParams(location.search).get('status') ?? undefined
    : undefined

  // Save, then land on the board with the new card's column focused — the board
  // is the only place the job is visible, so that is where saving takes you from
  // whichever screen you started on. Focusing a column on Jobs replaces the
  // history entry (it's the same view), while coming from another screen pushes,
  // so Back returns to where you were.
  async function handleCreateJob(input: NewJob) {
    const job = await tracker.onCreateJob(input)
    navigate(`/jobs?status=${job.status}`, { replace: onJobs })
    setAnnouncement(
      `${job.role} at ${job.company} added to ${getJobStatus(job.status)?.label ?? job.status}`,
    )
    return job
  }

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
        <Outlet
          context={{
            ...tracker,
            onOpenNav: () => setNavOpen(true),
            onNewApplication: () => setJobFormOpen(true),
          }}
        />
      </div>

      {/* Mounted only while open, so every visit starts on an empty form. */}
      {jobFormOpen && (
        <JobForm
          initialStatusId={focusedStatusId}
          onCreate={handleCreateJob}
          onClose={() => setJobFormOpen(false)}
        />
      )}

      <p className="sr-only" role="status" aria-live="polite">
        {announcement}
      </p>
    </div>
  )
}
