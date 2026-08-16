import { Briefcase, Plus } from '@phosphor-icons/react'
import { useSearchParams } from 'react-router-dom'
import { Button } from '../components/Button'
import { Toolbar } from '../components/Toolbar'
import { EmptyState } from '../components/EmptyState'
import { JobBoard } from '../components/JobBoard'
import { SkeletonBoard } from '../components/Skeleton'
import { getJobStatus } from '../design-system/statuses'
import { useTrackerContext } from '../useTracker'
import styles from './Jobs.module.css'

// Jobs is the kanban board — one column per active stage in statuses.json, all
// of them on screen at once. `?status=` (from the sidebar's Pipeline links and
// the pipeline band) focuses a column rather than filtering to it: on a board,
// hiding the other stages would throw away the thing you came to look at.
export function Jobs() {
  const { jobs, load, reload, onOpenNav } = useTrackerContext()
  const [params] = useSearchParams()
  const focused = getJobStatus(params.get('status'))

  return (
    <>
      <Toolbar
        title="Jobs"
        onOpenNav={onOpenNav}
        actions={
          <Button variant="primary" icon={<Plus size={15} weight="bold" />}>
            New application
          </Button>
        }
      />

      <div className={styles.pane}>
        {load === 'loading' && (
          <div role="status" aria-live="polite">
            <span className={styles.srOnly}>Loading your applications…</span>
            <SkeletonBoard />
          </div>
        )}

        {load === 'error' && (
          <div className={styles.error} role="alert">
            <p className={styles.errorTitle}>Couldn’t reach the server</p>
            <p className={styles.errorBody}>
              Check that the backend is running on port 8000, then try again.
            </p>
            <Button variant="secondary" size="sm" onClick={reload}>
              Try again
            </Button>
          </div>
        )}

        {load === 'ready' &&
          (jobs.length === 0 ? (
            <EmptyState
              icon={<Briefcase size={22} />}
              title="No applications yet"
              message="Add the first role you're chasing and it lands in Researching, ready to move down the pipeline as things progress."
              action={
                <Button variant="primary" icon={<Plus size={15} weight="bold" />}>
                  Add an application
                </Button>
              }
            />
          ) : (
            <JobBoard jobs={jobs} focusedStatusId={focused?.id ?? null} />
          ))}
      </div>
    </>
  )
}
