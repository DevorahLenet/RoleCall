import { useState } from 'react'
import type { DragEvent } from 'react'
import { ListChecks, Plus } from '@phosphor-icons/react'
import type { Job, NewTask, Task, TaskPatch } from '../types'
import { getTaskStatus, taskStatuses } from '../design-system/taskStatuses'
import { getPriority } from '../design-system/priorities'
import { usePersistedBoolean } from '../usePersistedBoolean'
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
  onUpdateTask: (task: Task, patch: TaskPatch) => Promise<Task>
  onToggleDone: (task: Task) => void
  onChangePriority: (task: Task, priorityId: string) => void
  onChangeTaskStatus: (task: Task, statusId: string) => void
  onDeleteTask: (task: Task) => void
}

// What the task dialog is open for: a blank new task, or one existing row.
type FormState = { mode: 'new' } | { mode: 'edit'; task: Task }

// Within a group, priority rank alone decides the order — completion doesn't
// enter into it, so checking a task off leaves the row exactly where it was
// instead of pulling it out from under the cursor. Sort is stable, so tasks at
// the same rank keep the API's newest-first order.
function sortWithinGroup(a: Task, b: Task): number {
  return getPriority(a.priority).rank - getPriority(b.priority).rank
}

// The day's tasks, grouped by task status in the order task-statuses.json lists
// them — In progress, then Waiting, then To do. Groups are separated by an
// eyebrow header carrying a count; the rows themselves stay flat and dense.
// Completed tasks strike through in place and can be hidden from the head, a
// choice that is remembered across sessions.
//
// A row moves between statuses by dragging it into another group. The keyboard
// and touch path to the same change is the row menu's Edit, which opens the task
// dialog with its Status select — drag is never the only way to do it.
export function TodayList({
  jobs,
  tasks,
  onCreateTask,
  onUpdateTask,
  onToggleDone,
  onChangePriority,
  onChangeTaskStatus,
  onDeleteTask,
}: Props) {
  const [form, setForm] = useState<FormState | null>(null)
  // Persisted: hiding completed rows is a standing preference about how the list
  // should read, not something worth re-deciding every visit.
  const [showCompleted, setShowCompleted] = usePersistedBoolean(
    'today.showCompleted',
    true,
  )

  // The row currently in hand. Its status rides along with the id because
  // dragover has to decide whether a group is a valid target, and dataTransfer
  // payloads are unreadable until drop.
  const [dragged, setDragged] = useState<{ id: number; status: string } | null>(null)
  const [dropTarget, setDropTarget] = useState<string | null>(null)
  // Narrates a move that a sighted user simply watches happen.
  const [announcement, setAnnouncement] = useState('')

  const doneCount = tasks.filter((t) => t.is_done).length
  const visible = showCompleted ? tasks : tasks.filter((t) => !t.is_done)

  const groups = taskStatuses.map((status) => ({
    status,
    items: visible.filter((t) => t.status === status.id).sort(sortWithinGroup),
  }))

  // Empty groups are hidden at rest — an empty heading is noise. During a drag
  // they all appear, because a group you cannot see is a group you cannot drop
  // into, and moving the last task out of a status would otherwise make that
  // status unreachable.
  const shown = groups.filter((g) => g.items.length > 0 || dragged !== null)
  const hasRows = groups.some((g) => g.items.length > 0)

  // The one place a status change is committed. Optimistic, through the shell,
  // so the row lands in its new group immediately.
  function moveTask(task: Task, statusId: string) {
    if (task.status === statusId) return
    onChangeTaskStatus(task, statusId)
    setAnnouncement(
      `${task.title} moved to ${getTaskStatus(statusId)?.label ?? statusId}`,
    )
  }

  function clearDrag() {
    setDragged(null)
    setDropTarget(null)
  }

  // preventDefault is what marks a group as a valid drop target, and it runs
  // unconditionally: gating it on React state would mean any tick where
  // `dragged` isn't populated yet silently swallows the drop. The state only
  // decides whether to *highlight* — dropping a row back on its own group is
  // already a no-op in moveTask.
  function handleDragOver(e: DragEvent<HTMLElement>, statusId: string) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    const wanted = dragged && dragged.status !== statusId ? statusId : null
    if (dropTarget !== wanted) setDropTarget(wanted)
  }

  // dragleave also fires when the pointer crosses onto a child, so only clear
  // the highlight when the pointer has genuinely left the group's subtree.
  function handleDragLeave(e: DragEvent<HTMLElement>) {
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
      setDropTarget(null)
    }
  }

  // dataTransfer is the source of truth, with the drag state as a fallback: a
  // drop that cannot identify its row would otherwise fail silently, which looks
  // exactly like the drop never registering at all.
  function handleDrop(e: DragEvent<HTMLElement>, statusId: string) {
    e.preventDefault()
    const id = Number(e.dataTransfer.getData('text/plain')) || dragged?.id
    const task = tasks.find((t) => t.id === id)
    if (task) moveTask(task, statusId)
    clearDrag()
  }

  // Both the create and the edit save go through the dialog's one onSave. Edit
  // sends the whole form as a patch, which is also how a task gets re-pointed at
  // a different job — the saved record comes back with the chip resolved.
  async function saveTask(input: NewTask) {
    if (form?.mode === 'edit') await onUpdateTask(form.task, input)
    else await onCreateTask(input)
  }

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
            onClick={() => setForm({ mode: 'new' })}
          >
            New task
          </Button>
        </div>
      </div>

      {shown.map((group) => {
        const isDropTarget = dropTarget === group.status.id
        const classes = [styles.group, isDropTarget ? styles.groupDropTarget : '']
          .filter(Boolean)
          .join(' ')

        return (
          <div
            key={group.status.id}
            className={classes}
            onDragOver={(e) => handleDragOver(e, group.status.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, group.status.id)}
          >
            <h3 className={styles.groupTitle}>
              {group.status.label}
              <span className={styles.count}>{group.items.length}</span>
            </h3>
            {group.items.length === 0 ? (
              /* Only reachable mid-drag, which is exactly what it is for: a
                 status with nothing in it still has to be a place to let go. */
              <p className={styles.groupEmpty}>Drop here to move it to this status</p>
            ) : (
              <div className={styles.rows}>
                {group.items.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    dragging={dragged?.id === task.id}
                    onToggleDone={onToggleDone}
                    onChangePriority={onChangePriority}
                    onEdit={(t) => setForm({ mode: 'edit', task: t })}
                    onDeleteTask={onDeleteTask}
                    onDragStart={(t) => setDragged({ id: t.id, status: t.status })}
                    onDragEnd={clearDrag}
                  />
                ))}
              </div>
            )}
          </div>
        )
      })}

      {/* Two different kinds of empty: nothing tracked yet, or everything done
          and the completed rows hidden. They deserve different words. */}
      {!hasRows &&
        (tasks.length === 0 ? (
          <EmptyState
            icon={<ListChecks size={22} />}
            title="No tasks yet"
            message="Add the first thing you owe someone — a follow-up, a portfolio edit, a coffee chat — and it lands in To do."
            action={
              <Button
                variant="primary"
                icon={<Plus size={15} weight="bold" />}
                onClick={() => setForm({ mode: 'new' })}
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

      <p className="sr-only" role="status" aria-live="polite">
        {announcement}
      </p>

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
    </section>
  )
}
