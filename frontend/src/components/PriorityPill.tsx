import { useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { getPriority, priorities } from '../design-system/priorities'
import type { Priority } from '../design-system/priorities'
import styles from './PriorityPill.module.css'

// The pill IS the control: clicking opens a three-item menu in place at raised
// elevation, which closes on choice. Priority stays in the neutral --priority-*
// tokens and never borrows a pipeline colour.

interface Props {
  priorityId: string
  onChange: (priorityId: string) => void
}

// The pill's colours for one rank. The --priority-*-text tokens are only
// readable on their own fill (High's is near-white), so text and fill always
// travel together — never the text colour alone on a menu's white ground.
function styleFor(p: Priority): CSSProperties {
  return {
    background: p.bg,
    color: p.text,
    border: p.border ? `1px solid ${p.border}` : '1px solid transparent',
  }
}

export function PriorityPill({ priorityId, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)
  const current = getPriority(priorityId)

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

  const pillStyle = styleFor(current)

  // Commit a menu selection (only firing onChange when it actually changed).
  function choose(id: string) {
    if (id !== priorityId) onChange(id)
    setOpen(false)
  }

  return (
    <div className={styles.wrap} ref={wrapRef}>
      <button
        type="button"
        className={styles.trigger}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Priority: ${current.label}. Change priority`}
        onClick={() => setOpen((v) => !v)}
      >
        <span
          className={open ? `${styles.pill} ${styles.pillOpen}` : styles.pill}
          style={pillStyle}
        >
          {current.label}
        </span>
      </button>

      {open && (
        <div className={styles.menu} role="menu">
          {priorities.map((p) => (
            <button
              key={p.id}
              type="button"
              role="menuitemradio"
              aria-checked={p.id === priorityId}
              className={
                p.id === priorityId ? `${styles.item} ${styles.itemActive}` : styles.item
              }
              onClick={() => choose(p.id)}
            >
              {/* Each option previews the pill it will become, as StatusPill's
                  menu does for stages. */}
              <span className={styles.pill} style={styleFor(p)}>
                {p.label}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
