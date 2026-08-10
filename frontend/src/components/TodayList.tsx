import { Plus } from '@phosphor-icons/react'
import type { Task } from '../types'
import { taskStatuses } from '../design-system/taskStatuses'
import { getPriority } from '../design-system/priorities'
import { TaskRow } from './TaskRow'
import { Button } from './Button'
import styles from './TodayList.module.css'

interface Props {
  tasks: Task[]
  onToggleDone: (task: Task) => void
  onChangePriority: (task: Task, priorityId: string) => void
  onEditTitle: (task: Task, title: string) => void
  onDeleteTask: (task: Task) => void
}

// Within a group: unfinished work first, then by priority rank; completed tasks
// strike through and mute in place at the tail of their group.
function sortWithinGroup(a: Task, b: Task): number {
  if (a.is_done !== b.is_done) return a.is_done ? 1 : -1
  return getPriority(a.priority).rank - getPriority(b.priority).rank
}

// The day's tasks, grouped by task status in pipeline order. Groups are separated
// by an eyebrow header carrying a count — the rows themselves stay flat and dense.
export function TodayList({
  tasks,
  onToggleDone,
  onChangePriority,
  onEditTitle,
  onDeleteTask,
}: Props) {
  const groups = taskStatuses
    .map((status) => ({
      status,
      items: tasks.filter((t) => t.status === status.id).sort(sortWithinGroup),
    }))
    .filter((g) => g.items.length > 0)

  return (
    <section className={styles.list}>
      <div className={styles.head}>
        <h2 className={styles.heading}>Tasks</h2>
        <Button size="sm" icon={<Plus size={14} weight="bold" />}>
          New task
        </Button>
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
    </section>
  )
}
