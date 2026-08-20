import { useState } from 'react'
import { ListChecks, Plus } from '@phosphor-icons/react'
import type { Job, NewTask, Task } from '../types'
import { taskStatuses } from '../design-system/taskStatuses'
import { getPriority } from '../design-system/priorities'
import { TaskRow } from './TaskRow'
import { TaskForm } from './TaskForm'
import { Button } from './Button'
import { EmptyState } from './EmptyState'
import { Toggle } from './Toggle'
import styles from './TodayList.module.css'

interface Props {
  jobs: Job[]
  tasks: Task[]
  onCreateTask: (input: NewTask) => Promise<Task>
  onToggleDone: (task: Task) => void
  onChangePriority: (task: Task, priorityId: string) => void
  onEditTitle: (task: Task, title: string) => void
  onDeleteTask: (task: Task) => void
}

// Within a group, priority rank alone decides the order — completion doesn't
// enter into it, so checking a task off leaves the row exactly where it was
// instead of pulling it out from under the cursor. Sort is stable, so tasks at
// the same rank keep the API's newest-first order.
function sortWithinGroup(a: Task, b: Task): number {
  return getPriority(a.priority).rank - getPriority(b.priority).rank
}

// The day's tasks, grouped by task status in pipeline order. Groups are separated
// by an eyebrow header carrying a count — the rows themselves stay flat and dense.
// Completed tasks strike through in place and can be hidden entirely from the head.
export function TodayList({
  jobs,
  tasks,
  onCreateTask,
  onToggleDone,
  onChangePriority,
  onEditTitle,
  onDeleteTask,
}: Props) {
  const [formOpen, setFormOpen] = useState(false)
  const [showCompleted, setShowCompleted] = useState(true)

  const doneCount = tasks.filter((t) => t.is_done).length
  const visible = showCompleted ? tasks : tasks.filter((t) => !t.is_done)

  const groups = taskStatuses
    .map((status) => ({
      status,
      items: visible.filter((t) => t.status === status.id).sort(sortWithinGroup),
    }))
    .filter((g) => g.items.length > 0)

  return (
    <section className={styles.list}>
      <div className={styles.head}>
        <h2 className={styles.heading}>Tasks</h2>
        <div className={styles.controls}>
          {doneCount > 0 && (
            <Toggle
              checked={showCompleted}
              onChange={setShowCompleted}
              label="Show completed"
            />
          )}
          <Button
            size="sm"
            icon={<Plus size={14} weight="bold" />}
            onClick={() => setFormOpen(true)}
          >
            New task
          </Button>
        </div>
      </div>

      {groups.map((group) => (
        <div key={group.status.id} className={styles.group}>
          <h3 className={styles.groupTitle}>
            {group.status.label}
            <span className={styles.count}>{group.items.length}</span>
          </h3>
          <div className={styles.rows}>
            {group.items.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                onToggleDone={onToggleDone}
                onChangePriority={onChangePriority}
                onEditTitle={onEditTitle}
                onDeleteTask={onDeleteTask}
              />
            ))}
          </div>
        </div>
      ))}

      {/* Two different kinds of empty: nothing tracked yet, or everything done
          and the completed rows hidden. They deserve different words. */}
      {groups.length === 0 &&
        (tasks.length === 0 ? (
          <EmptyState
            icon={<ListChecks size={22} />}
            title="No tasks yet"
            message="Add the first thing you owe someone — a follow-up, a portfolio edit, a coffee chat — and it lands in To do."
            action={
              <Button
                variant="primary"
                icon={<Plus size={15} weight="bold" />}
                onClick={() => setFormOpen(true)}
              >
                Add a task
              </Button>
            }
          />
        ) : (
          <EmptyState
            icon={<ListChecks size={22} />}
            title="Nothing left to do"
            message={`Every task is done. Turn "Show completed" back on to see ${
              doneCount === 1 ? 'it' : 'them'
            }.`}
          />
        ))}

      {formOpen && (
        <TaskForm
          jobs={jobs}
          onCreate={onCreateTask}
          onClose={() => setFormOpen(false)}
        />
      )}
    </section>
  )
}
