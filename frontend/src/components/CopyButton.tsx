import { useEffect, useRef, useState } from 'react'
import { Check, Copy, WarningCircle } from '@phosphor-icons/react'
import styles from './CopyButton.module.css'

interface Props {
  /** The text that lands on the clipboard. */
  text: string
  /** Names the target for screen readers, e.g. "this passage". */
  label: string
  /** Fired only after the clipboard write actually succeeded, so a use count
   *  can never be credited for a copy that did not happen. */
  onCopied?: () => void
  /** `tile` is the standing control on a library row or a panel header;
   *  `paragraph` is quiet until its block is hovered. */
  variant?: 'tile' | 'paragraph'
}

type State = 'idle' | 'copied' | 'failed'

// Copy is the primary action of the whole Writing Library — the job ends with
// text on the clipboard, not with a document open. So the affordance sits on
// every unit of reuse: each tile, each search hit, each paragraph of an open
// piece, and the piece as a whole.
//
// Copy is an ACTION, so unlike the bare type glyph it always sits in a filled
// control: a 32px face inside a transparent 44px button, which is how it keeps
// the design's look without going under the touch-target floor.
//
// Feedback is the icon swapping plus an sr-only announcement, matching the
// pattern the board and Today already use for changes a sighted user watches
// happen. There is no toast component in this app and one button did not
// warrant inventing one.
export function CopyButton({ text, label, onCopied, variant = 'tile' }: Props) {
  const [state, setState] = useState<State>('idle')
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  // The confirmation is temporary, so it must not outlive the component or
  // stack up when the button is pressed twice.
  useEffect(() => () => clearTimeout(timer.current), [])

  async function copy() {
    clearTimeout(timer.current)
    try {
      await navigator.clipboard.writeText(text)
      setState('copied')
      onCopied?.()
    } catch {
      // Clipboard access can be refused outright (an insecure origin, a locked
      // down browser). Say so rather than showing a success that never was.
      setState('failed')
    }
    timer.current = setTimeout(() => setState('idle'), 1600)
  }

  const icon =
    state === 'copied' ? (
      <Check size={15} weight="bold" aria-hidden />
    ) : state === 'failed' ? (
      <WarningCircle size={15} aria-hidden />
    ) : (
      <Copy size={15} aria-hidden />
    )

  const word = state === 'copied' ? 'Copied' : state === 'failed' ? 'Couldn’t copy' : 'Copy'

  const classes = [
    styles.button,
    styles[variant],
    state === 'copied' ? styles.done : '',
    state === 'failed' ? styles.failed : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <>
      <button
        type="button"
        className={classes}
        aria-label={state === 'idle' ? `Copy ${label}` : `${word} — ${label}`}
        onClick={() => void copy()}
      >
        <span className={styles.face}>{icon}</span>
      </button>

      {/* Announces what the icon already shows, for anyone who cannot see it
          change. */}
      <span className="sr-only" role="status" aria-live="polite">
        {state === 'copied' ? `Copied ${label}` : ''}
        {state === 'failed' ? `Couldn’t copy ${label}` : ''}
      </span>
    </>
  )
}
