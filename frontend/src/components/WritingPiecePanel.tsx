import { X } from '@phosphor-icons/react'
import { Button } from './Button'
import { CopyButton } from './CopyButton'
import { Drawer } from './Drawer'
import { SkeletonRows } from './Skeleton'
import { TypeGlyph, TypeTag } from './TypeTag'
import { formatDate } from '../format'
import type { WritingPieceStore } from '../useWritingPiece'
import styles from './WritingPiecePanel.module.css'

interface Props {
  store: WritingPieceStore
  onClose: () => void
}

// One saved piece, opened as a side panel OVER the library rather than as its
// own screen. The library is the context you choose from, so taking it away to
// read one piece lost the place you were in; dimming it keeps both.
//
// The whole panel is built around copying: the header copies the piece, and
// every paragraph copies itself, because the unit of reuse is a bullet, not a
// document. Nothing here edits — writing is authored on a job page, a later
// pass.
export function WritingPiecePanel({ store, onClose }: Props) {
  const { piece, load, reload, onPassageUsed } = store
  const label = piece ? piece.title : 'Saved writing'

  // "Copied N×" — the sum of the piece's passage counts, which is all the app
  // knows. It does NOT track which applications a piece went into, so the
  // design's "Used in 1 application" would be a number we can't stand behind.
  // Omitted at zero: a piece nobody has copied says nothing rather than "0×".
  const copied = piece
    ? piece.passages.reduce((total, passage) => total + passage.use_count, 0)
    : 0

  return (
    <Drawer label={label} width="min(560px, 100%)" onClose={onClose}>
      <header className={styles.head}>
        {piece && (
          <span className={styles.headGlyph}>
            <TypeGlyph typeId={piece.type} size={18} />
          </span>
        )}

        <div className={styles.heading}>
          {piece && <TypeTag typeId={piece.type} />}
          <h2 className={styles.title}>
            {piece?.title ?? (load === 'missing' ? 'No such piece' : 'Loading…')}
          </h2>
        </div>

        {/* Quick-copy takes the whole body and deliberately credits NO passage:
            crediting every line for one bulk copy would inflate the signal
            "most used" depends on. */}
        {piece && <CopyButton text={piece.body} label="the whole piece" />}

        <button
          type="button"
          className={styles.close}
          aria-label="Close this piece"
          onClick={onClose}
        >
          <X size={14} weight="bold" aria-hidden />
        </button>
      </header>

      {piece && (
        <div className={styles.meta}>
          {piece.company && <span>{piece.company}</span>}
          <span>Updated {formatDate(piece.updated_at)}</span>
          {copied > 0 && <span className={styles.copied}>Copied {copied}×</span>}
        </div>
      )}

      <div className={styles.body}>
        {load === 'loading' && (
          <div role="status" aria-live="polite">
            <span className="sr-only">Loading this piece…</span>
            <SkeletonRows count={4} />
          </div>
        )}

        {load === 'error' && (
          <div className={styles.state} role="alert">
            <p className={styles.stateTitle}>Couldn’t reach the server</p>
            <p className={styles.stateBody}>
              Check that the backend is running on port 8000, then try again.
            </p>
            <Button variant="secondary" size="sm" onClick={reload}>
              Try again
            </Button>
          </div>
        )}

        {/* A 404 is its own state, not a failure: the piece was deleted, or the
            URL was mistyped. The way out is back to the library behind it. */}
        {load === 'missing' && (
          <div className={styles.state} role="alert">
            <p className={styles.stateTitle}>No such piece</p>
            <p className={styles.stateBody}>
              It may have been deleted. The library has everything still saved.
            </p>
            <Button variant="secondary" size="sm" onClick={onClose}>
              Back to the library
            </Button>
          </div>
        )}

        {load === 'ready' &&
          piece &&
          piece.passages.map((passage) => (
            /* Plain text, not rendered markdown: what you copy is the markdown
               itself, so showing it as written is honest. */
            <div key={passage.id} className={styles.para}>
              <p className={styles.text}>{passage.text}</p>
              <CopyButton
                variant="paragraph"
                text={passage.text}
                label="this paragraph"
                onCopied={() => onPassageUsed(passage)}
              />
            </div>
          ))}
      </div>
    </Drawer>
  )
}
