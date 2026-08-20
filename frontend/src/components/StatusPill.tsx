import { useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { getJobStatus, jobStatuses } from '../design-system/statuses'
import styles from './StatusPill.module.css'

interface Props {
  statusId: string
  onChange: (statusId: string) => void
}

// The pill IS the control: clicking it opens the full pipeline in place, each
// stage shown as the coloured pill the card will wear once chosen. Every colour
// resolves from statuses.json — none is picked here.
//
// This is also the *accessible* way to move a job. Dragging a card between
// columns does the same thing, but native drag-and-drop reaches neither the
// keyboard nor touch, so this menu is the path that always works.
export function StatusPill({ statusId, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)
  const current = getJobStatus(statusId)

  // While the menu is open, dismiss it on an outside click or the Escape key.
  useEffect(() => {
    if (!open) return
    function onDocMouseDown(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDocMouseDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDocMouseDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  // Commit a menu selection, firing onChange only when it actually changed.
  function choose(id: string) {
    if (id !== statusId) onChange(id)
    setOpen(false)
  }

  if (!current) return null

  const pillStyle: CSSProperties = {
    background: current.badgeBg,
    color: current.badgeFg,
  }

  return (
    <div className={styles.wrap} ref={wrapRef}>
      <button
        type="button"
        className={styles.trigger}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Stage: ${current.label}. Change stage`}
        onClick={() => setOpen((v) => !v)}
      >
        <span
          className={open ? `${styles.pill} ${styles.pillOpen}` : styles.pill}
          style={pillStyle}
        >
          <span className={styles.dot} style={{ background: current.dot }} aria-hidden />
          {current.label}
        </span>
      </button>

      {open && (
        <div className={styles.menu} role="menu">
          {/* Every stage, closed ones included — moving a job to Closed · Rejected
              is exactly how a job gets closed, and this is the only place to do it. */}
          {jobStatuses.map((s) => (
            <button
              key={s.id}
              type="button"
              role="menuitemradio"
              aria-checked={s.id === statusId}
              className={
                s.id === statusId ? `${styles.item} ${styles.itemActive}` : styles.item
              }
              onClick={() => choose(s.id)}
            >
              <span
                className={styles.itemPill}
                style={{ background: s.badgeBg, color: s.badgeFg }}
              >
                <span className={styles.dot} style={{ background: s.dot }} aria-hidden />
                {s.label}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
