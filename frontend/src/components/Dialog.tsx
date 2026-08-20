import { useEffect, useId, useRef } from 'react'
import type { KeyboardEvent, ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from '@phosphor-icons/react'
import styles from './Dialog.module.css'

interface Props {
  title: string
  onClose: () => void
  children: ReactNode
}

// Modal shell for the create/edit forms: an overlay-elevation card over a scrim.
// It portals to <body> so no ancestor's overflow can clip it, keeps Tab inside
// while open, and dismisses on Escape, a scrim click, or the top-right X.
export function Dialog({ title, onClose, children }: Props) {
  const cardRef = useRef<HTMLDivElement>(null)
  const titleId = useId()

  // Send focus to the first form control on open and return it to whatever
  // opened the dialog on close, so the keyboard never lands back at the top.
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null
    const first = cardRef.current?.querySelector<HTMLElement>(
      'input, select, textarea',
    )
    ;(first ?? cardRef.current)?.focus()
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

  // Escape closes; Tab cycles within the card rather than escaping to the page.
  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'Escape') {
      onClose()
      return
    }
    if (e.key !== 'Tab' || !cardRef.current) return
    const items = Array.from(
      cardRef.current.querySelectorAll<HTMLElement>(
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
      // that began inside the card shouldn't close it on release.
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        ref={cardRef}
        onKeyDown={onKeyDown}
      >
        <div className={styles.head}>
          <h2 className={styles.title} id={titleId}>
            {title}
          </h2>
          <button
            type="button"
            className={styles.close}
            aria-label="Close dialog"
            onClick={onClose}
          >
            <X size={16} weight="bold" aria-hidden />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  )
}
