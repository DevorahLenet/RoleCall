import { Check, DotsThreeVertical, PencilSimple, Trash } from '@phosphor-icons/react'
import { useEffect, useRef, useState } from 'react'
import type { CSSProperties, DragEvent } from 'react'
import type { Task } from '../types'
import { getJobStatus } from '../design-system/statuses'
import { getCategory } from '../design-system/categories'
import { PriorityPill } from './PriorityPill'
import { TruncatedText } from './TruncatedText'
import styles from './TaskRow.module.css'

interface Props {
  task: Task
  /** False on a job page, where every row belongs to the job in the page title
   *  and the chip would repeat it on every line. */
  showChip?: boolean
  onToggleDone: (task: Task) => void
  onChangePriority: (task: Task, priorityId: string) => void
  /** Opens the task dialog on this row. Every field of a task is edited there,
   *  so the row itself never grows a second, title-only editor. */
  onEdit: (task: Task) => void
  onDeleteTask: (task: Task) => void
  /** Set by a list that groups rows by status (Today), which is the only place a
   *  drag has anywhere to land. The job page's flat list leaves these off and
   *  the row is simply not draggable there. */
  onDragStart?: (task: Task) => void
  onDragEnd?: () => void
  /** This row is the one currently in hand — fades so the drop target reads. */
  dragging?: boolean
}

// One task tile: checkbox · title · chip · priority pill · row menu. The chip is
// the job's pipeline stage when attached, otherwise the category, otherwise "no
// job". Done rows mute and strike through in place (styling), staying in their
// group. The menu holds Edit — which opens the full task dialog — and Delete.
export function TaskRow({
  task,
  showChip = true,
  onToggleDone,
  onChangePriority,
  onEdit,
  onDeleteTask,
  onDragStart,
  onDragEnd,
  dragging = false,
}: Props) {
  const done = task.is_done
  const jobStatus = getJobStatus(task.job_status)
  const category = getCategory(task.category)
  const hasJob = task.job !== null && task.job_company !== null
  const draggable = onDragStart !== undefined

  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // While the menu is open, dismiss it on an outside click or the Escape key.
  useEffect(() => {
    if (!menuOpen) return
    function onDocMouseDown(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('mousedown', onDocMouseDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDocMouseDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [menuOpen])

  // The task id rides along in dataTransfer as well as in the list's state:
  // setting some payload is what makes the drag valid in Firefox, and reading it
  // back on drop is more reliable than trusting state to still be current.
  //
  // The state update is deferred by a tick on purpose. Restyling the dragged
  // element *during* dragstart (here, fading it) makes Chrome cancel the drag
  // before it begins — the browser is still snapshotting the element for its
  // drag image. Letting dragstart finish first fixes it. (Same reasoning, and
  // the same fix, as JobCard on the board.)
  function handleDragStart(e: DragEvent<HTMLElement>) {
    e.dataTransfer.setData('text/plain', String(task.id))
    e.dataTransfer.effectAllowed = 'move'
    setTimeout(() => onDragStart?.(task), 0)
  }

  const classes = [
    styles.row,
    done ? styles.rowDone : '',
    draggable ? styles.rowDraggable : '',
    dragging ? styles.rowDragging : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div
      className={classes}
      draggable={draggable}
      onDragStart={draggable ? handleDragStart : undefined}
      onDragEnd={draggable ? onDragEnd : undefined}
    >
      <button
        type="button"
        className={styles.check}
        aria-pressed={done}
        aria-label={done ? `Mark "${task.title}" as not done` : `Mark "${task.title}" as done`}
        onClick={() => onToggleDone(task)}
      >
        <span className={done ? `${styles.box} ${styles.boxDone}` : styles.box}>
          {done && <Check size={13} weight="bold" aria-hidden />}
        </span>
      </button>

      <span className={styles.title}>{task.title}</span>

      {/* The chip names the row's context — the job's company and stage, or the
          category for a job-less task. A job page passes showChip={false}:
          there the context is the page itself. */}
      {showChip &&
        (hasJob && jobStatus ? (
        <a
          href="#"
          className={styles.chip}
          /* An anchor drags itself as a link by default, which would hijack the
             row's own drag the moment the pointer started on the chip. */
          draggable={false}
          style={
            {
              background: jobStatus.badgeBg,
              color: jobStatus.badgeFg,
            } as CSSProperties
          }
        >
          <span className={styles.chipDot} style={{ background: jobStatus.dot }} aria-hidden />
          <TruncatedText
            text={`${task.job_company} · ${jobStatus.label}`}
            className={styles.chipText}
          />
        </a>
      ) : category ? (
        <span className={styles.categoryChip}>{category.label}</span>
      ) : (
        <span className={styles.noJob}>No job attached</span>
      ))}

      <span className={styles.priority}>
        <PriorityPill
          priorityId={task.priority}
          onChange={(id) => onChangePriority(task, id)}
        />
      </span>

      {/* Row overflow menu: edit and delete, at raised elevation. */}
      <div className={styles.menuWrap} ref={menuRef}>
        <button
          type="button"
          className={styles.menuTrigger}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          aria-label={`Actions for "${task.title}"`}
          onClick={() => setMenuOpen((v) => !v)}
        >
          <DotsThreeVertical size={18} weight="bold" aria-hidden />
        </button>

        {menuOpen && (
          <div className={styles.menu} role="menu">
            <button
              type="button"
              role="menuitem"
              className={styles.menuItem}
              onClick={() => {
                setMenuOpen(false)
                onEdit(task)
              }}
            >
              <PencilSimple size={15} aria-hidden />
              Edit
            </button>
            <button
              type="button"
              role="menuitem"
              className={`${styles.menuItem} ${styles.menuItemDanger}`}
              onClick={() => {
                setMenuOpen(false)
                onDeleteTask(task)
              }}
            >
              <Trash size={15} aria-hidden />
              Delete task
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
