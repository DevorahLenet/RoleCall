import { Check, DotsThreeVertical, PencilSimple, Trash } from '@phosphor-icons/react'
import { useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import type { Task } from '../types'
import { getJobStatus } from '../design-system/statuses'
import { getCategory } from '../design-system/categories'
import { PriorityPill } from './PriorityPill'
import styles from './TaskRow.module.css'

interface Props {
  task: Task
  onToggleDone: (task: Task) => void
  onChangePriority: (task: Task, priorityId: string) => void
  onEditTitle: (task: Task, title: string) => void
  onDeleteTask: (task: Task) => void
}

// One task line: checkbox · title · chip · priority pill · row menu. The chip is
// the job's pipeline stage when attached, otherwise the category, otherwise "no
// job". Done rows mute and strike through in place (styling), staying in their
// group. The title edits inline; the menu holds rename and delete.
export function TaskRow({
  task,
  onToggleDone,
  onChangePriority,
  onEditTitle,
  onDeleteTask,
}: Props) {
  const done = task.is_done
  const jobStatus = getJobStatus(task.job_status)
  const category = getCategory(task.category)
  const hasJob = task.job !== null && task.job_company !== null

  // Inline-edit + menu state. `draft` holds the in-progress title; `skipBlur`
  // stops the unmount-blur from re-committing after Enter/Escape already ran.
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(task.title)
  const [menuOpen, setMenuOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const skipBlur = useRef(false)

  // Enter edit mode from a fresh copy of the title, then focus + select it.
  function startEditing() {
    setMenuOpen(false)
    setDraft(task.title)
    setEditing(true)
  }
  useEffect(() => {
    if (editing) inputRef.current?.select()
  }, [editing])

  // Commit the rename (only when non-empty and actually changed); guard the
  // trailing unmount-blur so it can't fire onEditTitle a second time.
  function commit() {
    const next = draft.trim()
    skipBlur.current = true
    setEditing(false)
    if (next && next !== task.title) onEditTitle(task, next)
  }
  // Abandon the edit, restoring the original title.
  function cancel() {
    skipBlur.current = true
    setDraft(task.title)
    setEditing(false)
  }

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

  return (
    <div className={done ? `${styles.row} ${styles.rowDone}` : styles.row}>
      <button
        type="button"
        className={styles.check}
        aria-pressed={done}
        aria-label={done ? `Mark "${task.title}" as not done` : `Mark "${task.title}" as done`}
        onClick={() => onToggleDone(task)}
      >
        <span className={done ? `${styles.box} ${styles.boxDone}` : styles.box}>
          {done && <Check size={11} weight="bold" aria-hidden />}
        </span>
      </button>

      {editing ? (
        <input
          ref={inputRef}
          className={styles.titleInput}
          value={draft}
          aria-label="Task title"
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit()
            else if (e.key === 'Escape') cancel()
          }}
          onBlur={() => {
            if (skipBlur.current) {
              skipBlur.current = false
              return
            }
            commit()
          }}
        />
      ) : (
        <span className={done || !hasJob ? styles.titleMuted : styles.title}>
          {task.title}
        </span>
      )}

      {hasJob && jobStatus ? (
        <a
          href="#"
          className={styles.chip}
          style={
            {
              background: jobStatus.badgeBg,
              color: jobStatus.badgeFg,
            } as CSSProperties
          }
        >
          <span className={styles.chipDot} style={{ background: jobStatus.dot }} aria-hidden />
          {task.job_company} · {jobStatus.label}
        </a>
      ) : category ? (
        <span className={styles.categoryChip}>{category.label}</span>
      ) : (
        <span className={styles.noJob}>No job attached</span>
      )}

      <PriorityPill
        priorityId={task.priority}
        onChange={(id) => onChangePriority(task, id)}
      />

      {/* Row overflow menu: rename and delete, at raised elevation. */}
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
              onClick={startEditing}
            >
              <PencilSimple size={15} aria-hidden />
              Edit title
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
