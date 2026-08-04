import { Plus } from '@phosphor-icons/react'
import type { Task } from '../types'
import { taskStatuses } from '../design-system/taskStatuses'
import { getPriority } from '../design-system/priorities'
import { TaskRow } from './TaskRow'
import styles from './TodaySection.module.css'

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

export function TodaySection({
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
    <main className={styles.section}>
      <div className={styles.header}>
        <h2 className={styles.title}>What to do today</h2>
        <button type="button" className={styles.secondary}>
          <Plus size={18} weight="bold" aria-hidden />
          New task
        </button>
      </div>

      <div className={styles.groups}>
        {groups.map((group) => (
          <section key={group.status.id}>
            <h3 className={styles.groupTitle}>{group.status.label}</h3>
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
          </section>
        ))}
      </div>
    </main>
  )
}
