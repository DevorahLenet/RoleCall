import { useEffect, useRef } from 'react'
import type { KeyboardEvent, ReactNode } from 'react'
import { createPortal } from 'react-dom'
import styles from './Drawer.module.css'

interface Props {
  /** Accessible name for the panel — it has no title bar of its own. */
  label: string
  onClose: () => void
  /** Panel width. The design system's default is min(440px, 100%); the
   *  Writing Library's piece panel is wider because it holds prose. */
  width?: string
  children: ReactNode
}

// A right-docked panel over a scrim, for work that shouldn't take the whole
// page. The general one: the Writing Library's open piece uses it now, and the
// job page's writing drawer will reuse it rather than growing a second.
//
// Behaviour is deliberately identical to Dialog.tsx — portal to <body> so no
// ancestor's overflow can clip it, Tab trapped inside, Escape and scrim-click
// to dismiss, body scroll frozen, focus returned to whatever opened it. The
// difference is only shape and that the CALLER owns the whole inside, header
// and close button included: a drawer's header varies, a dialog's doesn't.
export function Drawer({ label, onClose, width, children }: Props) {
  const panelRef = useRef<HTMLDivElement>(null)

  // Focus the panel itself rather than its first control: a drawer is a region
  // you read before you act on, so the label should be announced first. Focus
  // returns to the opener on close, so the keyboard never lands back at the top.
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null
    panelRef.current?.focus()
    return () => opener?.focus()
  }, [])

  // Freeze the page behind the scrim so scrolling can't run away under it.
  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [])

  // Escape closes; Tab cycles within the panel rather than escaping to the page.
  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'Escape') {
      onClose()
      return
    }
    if (e.key !== 'Tab' || !panelRef.current) return
    const items = Array.from(
      panelRef.current.querySelectorAll<HTMLElement>(
        'button, input, select, textarea, a[href], [tabindex]:not([tabindex="-1"])',
      ),
    ).filter((el) => !el.hasAttribute('disabled'))
    if (items.length === 0) return

    const first = items[0]
    const last = items[items.length - 1]
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first.focus()
    }
  }

  return createPortal(
    <div
      className={styles.scrim}
      // Only a click that starts and ends on the scrim itself dismisses — a drag
      // that began inside the panel shouldn't close it on release.
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className={styles.panel}
        style={width ? { width } : undefined}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
        ref={panelRef}
        onKeyDown={onKeyDown}
      >
        {children}
      </div>
    </div>,
    document.body,
  )
}
