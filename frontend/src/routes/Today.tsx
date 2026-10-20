import { Plus } from '@phosphor-icons/react'
import { Button } from '../components/Button'
import { Toolbar } from '../components/Toolbar'
import { PipelineBand } from '../components/PipelineBand'
import { TodayList } from '../components/TodayList'
import { SkeletonRows } from '../components/Skeleton'
import { useTrackerContext } from '../useTracker'
import styles from './Pane.module.css'

// The default screen: pipeline shape at a glance, then the day's task list.
export function Today() {
  const {
    jobs,
    tasks,
    load,
    reload,
    onOpenNav,
    onNewApplication,
    onCreateTask,
    onUpdateTask,
    onToggleDone,
    onChangePriority,
    onChangeTaskStatus,
    onDeleteTask,
  } = useTrackerContext()

  return (
    <>
      <Toolbar
        title="Step forward"
        accent="forward"
        onOpenNav={onOpenNav}
        actions={
          <Button
            variant="primary"
            size="lg"
            icon={<Plus size={15} weight="bold" />}
            onClick={onNewApplication}
          >
            New application
          </Button>
        }
      />

      <div className={styles.content}>
        {load === 'loading' && (
          <div role="status" aria-live="polite">
            <span className="sr-only">Loading your day…</span>
            <SkeletonRows />
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

        {load === 'ready' && (
          <>
            <PipelineBand jobs={jobs} />
            <TodayList
              jobs={jobs}
              tasks={tasks}
              onCreateTask={onCreateTask}
              onUpdateTask={onUpdateTask}
              onToggleDone={onToggleDone}
              onChangePriority={onChangePriority}
              onChangeTaskStatus={onChangeTaskStatus}
              onDeleteTask={onDeleteTask}
            />
          </>
        )}
      </div>
    </>
  )
}
