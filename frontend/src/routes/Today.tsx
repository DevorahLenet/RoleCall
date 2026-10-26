import { useState } from 'react'
import { Plus } from '@phosphor-icons/react'
import type { NewTask, Task } from '../types'
import { Button } from '../components/Button'
import { Toggle } from '../components/Toggle'
import { Toolbar } from '../components/Toolbar'
import { TaskForm } from '../components/TaskForm'
import { TodayList } from '../components/TodayList'
import { SkeletonRows } from '../components/Skeleton'
import { usePersistedBoolean } from '../usePersistedBoolean'
import { useTrackerContext } from '../useTracker'
import styles from './Pane.module.css'

// What the task dialog is open for: a blank new task, or one existing row.
type FormState = { mode: 'new' } | { mode: 'edit'; task: Task }

// The default screen: the day's task list, and nothing above it. The pipeline
// band that used to open the page was retired in the Oct 21 pass — the
// sidebar's Pipeline section carries the same stage counts, permanently and on
// every screen, so repeating it here only pushed the work down the page.
//
// The list's controls live in the Toolbar rather than over the list: New task
// is this screen's page action, and Show completed is how the list should
// read, which is the same kind of decision.
export function Today() {
  const {
    jobs,
    tasks,
    load,
    reload,
    onOpenNav,
    onCreateTask,
    onUpdateTask,
    onToggleDone,
    onChangePriority,
    onChangeTaskStatus,
    onDeleteTask,
  } = useTrackerContext()

  // Persisted: hiding completed rows is a standing preference about how the
  // list should read, not something worth re-deciding every visit.
  const [showCompleted, setShowCompleted] = usePersistedBoolean(
    'today.showCompleted',
    true,
  )
  const [form, setForm] = useState<FormState | null>(null)

  const doneCount = tasks.filter((t) => t.is_done).length

  // Both the create and the edit save go through the dialog's one onSave. Edit
  // sends the whole form as a patch, which is also how a task gets re-pointed
  // at a different job — the saved record comes back with the chip resolved.
  async function saveTask(input: NewTask) {
    if (form?.mode === 'edit') await onUpdateTask(form.task, input)
    else await onCreateTask(input)
  }

  return (
    <>
      <Toolbar
        title="Step forward"
        accent="forward"
        onOpenNav={onOpenNav}
        actions={
          <>
            {/* Only offered once there is something to hide. */}
            {load === 'ready' && doneCount > 0 && (
              <Toggle
                checked={showCompleted}
                onChange={setShowCompleted}
                label="Show completed"
              />
            )}
            <Button
              variant="secondary"
              size="lg"
              icon={<Plus size={15} weight="bold" />}
              onClick={() => setForm({ mode: 'new' })}
            >
              New task
            </Button>
          </>
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
          <TodayList
            tasks={tasks}
            showCompleted={showCompleted}
            doneCount={doneCount}
            onNewTask={() => setForm({ mode: 'new' })}
            onEditTask={(task) => setForm({ mode: 'edit', task })}
            onToggleDone={onToggleDone}
            onChangePriority={onChangePriority}
            onChangeTaskStatus={onChangeTaskStatus}
            onDeleteTask={onDeleteTask}
          />
        )}
      </div>

      {/* Mounted only while open, so a new task always starts empty and an edit
          always starts from the row it was opened on. */}
      {form && (
        <TaskForm
          jobs={jobs}
          task={form.mode === 'edit' ? form.task : undefined}
          onSave={saveTask}
          onClose={() => setForm(null)}
        />
      )}
    </>
  )
}
