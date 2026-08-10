import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import styles from './TruncatedText.module.css'

interface Props {
  /** The full string. Rendered inline, and revealed in the tooltip when clipped. */
  text: string
  className?: string
}

interface Coords {
  left: number
  top: number
}

// Text that ellipsises, and reveals the full string in a small tooltip on hover —
// but only when it is *actually* clipped, so nothing pops up on a label you can
// already read. The tooltip portals to <body> because the pipeline band clips its
// segments (clip-path + overflow:hidden), which would otherwise swallow it.
//
// Truncation here is purely visual: the full text stays in the DOM, so screen
// readers and find-in-page are unaffected and the tooltip is a pointer affordance.
export function TruncatedText({ text, className }: Props) {
  const ref = useRef<HTMLSpanElement>(null)
  const [coords, setCoords] = useState<Coords | null>(null)

  // Measure on demand rather than tracking resize: overflow can only matter at
  // the moment of hover, and scrollWidth is cheap to read once.
  const show = useCallback(() => {
    const el = ref.current
    if (!el || el.scrollWidth <= el.clientWidth) return
    const rect = el.getBoundingClientRect()
    setCoords({ left: rect.left + rect.width / 2, top: rect.top })
  }, [])

  const hide = useCallback(() => setCoords(null), [])

  // WCAG 1.4.13: hover content must be dismissible without moving the pointer.
  // Scroll also invalidates the anchor position, so it dismisses too.
  useEffect(() => {
    if (!coords) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') hide()
    }
    document.addEventListener('keydown', onKey)
    window.addEventListener('scroll', hide, true)
    return () => {
      document.removeEventListener('keydown', onKey)
      window.removeEventListener('scroll', hide, true)
    }
  }, [coords, hide])

  return (
    <>
      <span
        ref={ref}
        className={className}
        onMouseEnter={show}
        onMouseLeave={hide}
      >
        {text}
      </span>

      {coords &&
        createPortal(
          <span
            role="tooltip"
            className={styles.tip}
            style={{ left: coords.left, top: coords.top }}
          >
            {text}
          </span>,
          document.body,
        )}
    </>
  )
}
