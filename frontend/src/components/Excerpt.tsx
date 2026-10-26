import { Fragment } from 'react'
import styles from './Excerpt.module.css'

// The sentinels the search endpoint wraps matched terms in (STX/ETX). Control
// characters rather than brackets or markup, so a passage that itself contains
// "[" or "<b>" cannot corrupt the highlight — and because we split on them and
// render text nodes, nothing here is ever interpreted as HTML.
// Must match HIGHLIGHT_OPEN / HIGHLIGHT_CLOSE in backend/tracker/search.py.
const OPEN = String.fromCharCode(2) // STX
const CLOSE = String.fromCharCode(3) // ETX

interface Props {
  /** The `excerpt` from a search hit, sentinels and all. */
  text: string
}

// Renders a search excerpt with its matched terms marked in highlighter
// yellow. `<mark>` because that is what it means — the browser and screen
// readers both already know.
export function Excerpt({ text }: Props) {
  // Split on the opening sentinel, then each part after the first begins with a
  // match that runs to its closing sentinel.
  const [lead, ...rest] = text.split(OPEN)

  return (
    <p className={styles.excerpt}>
      {lead}
      {rest.map((chunk, i) => {
        const [match, tail = ''] = chunk.split(CLOSE)
        return (
          <Fragment key={i}>
            <mark className={styles.mark}>{match}</mark>
            {tail}
          </Fragment>
        )
      })}
    </p>
  )
}
