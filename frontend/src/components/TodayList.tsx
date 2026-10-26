import { useState } from 'react'
import type { DragEvent } from 'react'
import { ListChecks, Plus } from '@phosphor-icons/react'
import type { Task } from '../types'
import { getTaskStatus, taskStatuses } from '../design-system/taskStatuses'
import { getPriority } from '../design-system/priorities'
import { TaskRow } from './TaskRow'
import { Button } from './Button'
import { EmptyState } from './EmptyState'
import styles from './TodayList.module.css'

interface Props {
  tasks: Task[]
  /** The Toolbar's view preference — done rows drop out of every group. */
  showCompleted: boolean
  /** How many tasks are done, so the all-done empty state can say so. */
  doneCount: number
  onNewTask: () => void
  onEditTask: (task: Task) => void
  onToggleDone: (task: Task) => void
  onChangePriority: (task: Task, priorityId: string) => void
  onChangeTaskStatus: (task: Task, statusId: string) => void
  onDeleteTask: (task: Task) => void
}

// Within a group, priority rank alone decides the order — completion doesn't
// enter into it, so checking a task off leaves the row exactly where it was
// instead of pulling it out from under the cursor. Sort is stable, so tasks at
// the same rank keep the API's newest-first order.
function sortWithinGroup(a: Task, b: Task): number {
  return getPriority(a.priority).rank - getPriority(b.priority).rank
}

// The day's tasks, grouped by task status in the order task-statuses.json lists
// them — In progress, then Waiting, then To do. Groups are separated by an
// eyebrow header carrying a count; each task is a floating tile, 3px apart.
//
// The list starts straight under the Toolbar: no heading of its own (the page
// title is the heading) and no control row, since New task and Show completed
// are page actions and live in the Toolbar.
//
// A row moves between statuses by dragging it into another group. The keyboard
// and touch path to the same change is the row menu's Edit, which opens the task
// dialog with its Status select — drag is never the only way to do it.
export function TodayList({
  tasks,
  showCompleted,
  doneCount,
  onNewTask,
  onEditTask,
  onToggleDone,
  onChangePriority,
  onChangeTaskStatus,
  onDeleteTask,
}: Props) {
  // The row currently in hand. Its status rides along with the id because
  // dragover has to decide whether a group is a valid target, and dataTransfer
  // payloads are unreadable until drop.
  const [dragged, setDragged] = useState<{ id: number; status: string } | null>(null)
  const [dropTarget, setDropTarget] = useState<string | null>(null)
  // Narrates a move that a sighted user simply watches happen.
  const [announcement, setAnnouncement] = useState('')

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

  return (
    <section className={styles.list} aria-label="Tasks">
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
            <h2 className={styles.groupTitle}>
              {group.status.label}
              <span className={styles.count}>{group.items.length}</span>
            </h2>
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
                    onEdit={onEditTask}
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
                onClick={onNewTask}
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
    </section>
  )
}
