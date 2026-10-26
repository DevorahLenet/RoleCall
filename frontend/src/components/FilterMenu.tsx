import { useEffect, useId, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { CaretDown } from '@phosphor-icons/react'
import styles from './FilterMenu.module.css'

export interface FilterOption {
  /** The filter's value; the empty string is always the "no filter" option. */
  value: string
  label: string
}

interface Props {
  /** Screen-reader name for the control ("Filter by company"). */
  label: string
  /** Leading glyph — pass a Phosphor element; it is marked decorative here. */
  icon: ReactNode
  value: string
  options: FilterOption[]
  onChange: (value: string) => void
}

// One of the Writing Library's two top-row filters. Sized to match the search
// field beside it (48px, white, lifted) because on this screen narrowing is a
// primary control, not a form field tucked under one.
//
// A button-plus-popover rather than a <select>: the row is a set of equals, and
// a native select can't be given the same height, radius and shadow across
// browsers. The menu is still keyboard- and screen-reader-navigable — it is a
// real list of buttons, dismissed by Escape or an outside click, with the
// trigger's label always naming the current value.
export function FilterMenu({ label, icon, value, options, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)
  const menuId = useId()

  const current = options.find((o) => o.value === value) ?? options[0]

  // While the menu is open, dismiss it on an outside click or Escape — the
  // same two gestures every other popover in the app answers to.
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

  // Choosing closes the menu and returns focus to the trigger, so the keyboard
  // never lands back at the top of the page after a filter change.
  function choose(next: string) {
    if (next !== value) onChange(next)
    setOpen(false)
    wrapRef.current?.querySelector('button')?.focus()
  }

  return (
    <div className={styles.wrap} ref={wrapRef}>
      <button
        type="button"
        className={styles.trigger}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-label={`${label}: ${current.label}`}
        onClick={() => setOpen((v) => !v)}
      >
        <span className={styles.icon} aria-hidden>
          {icon}
        </span>
        <span className={styles.label}>{current.label}</span>
        <CaretDown className={styles.caret} size={14} aria-hidden />
      </button>

      {open && (
        <div className={styles.menu} id={menuId} role="menu" aria-label={label}>
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              role="menuitemradio"
              aria-checked={option.value === value}
              className={option.value === value ? styles.itemOn : styles.item}
              onClick={() => choose(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
