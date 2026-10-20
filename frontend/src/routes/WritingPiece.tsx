import { Link, useNavigate, useParams } from 'react-router-dom'
import { Button } from '../components/Button'
import { CopyButton } from '../components/CopyButton'
import { SkeletonRows } from '../components/Skeleton'
import { Toolbar } from '../components/Toolbar'
import { TypeTag } from '../components/TypeTag'
import { formatDate } from '../format'
import { useTrackerContext } from '../useTracker'
import { useWritingPiece } from '../useWritingPiece'
import styles from './WritingPiece.module.css'

// One saved piece, broken into the chunks you actually reuse.
//
// The whole screen is built around copying: every passage carries its own copy
// button, because the unit of reuse is a bullet, not a document. Nothing here
// edits — writing is authored on a job page, which is a later pass.
export function WritingPieceRoute() {
  const params = useParams()
  const navigate = useNavigate()
  const id = Number(params.id)
  const { onOpenNav } = useTrackerContext()
  const { piece, load, reload, onPassageUsed } = useWritingPiece(id)

  const title = piece?.title ?? (load === 'missing' ? 'Not found' : 'Loading…')

  return (
    <>
      <Toolbar
        title={title}
        backTo={{ to: '/writing', label: 'Back to the writing library' }}
        onOpenNav={onOpenNav}
        actions={
          piece && (
            /* Copy all deliberately does NOT touch the use counts: crediting
               every passage for one bulk copy would inflate the signal that
               "most used" depends on. */
            <CopyButton variant="full" text={piece.body} label="the whole piece" />
          )
        }
      />

      <div className={styles.content}>
        {load === 'loading' && (
          <div role="status" aria-live="polite">
            <span className="sr-only">Loading this piece…</span>
            <SkeletonRows count={4} />
          </div>
        )}

        {load === 'error' && (
          <div className={styles.error} role="alert">
            <p className={styles.errorTitle}>Couldn’t reach the server</p>
            <p className={styles.errorBody}>
              Check that the backend is running on port 8000, then try again.
            </p>
            <Button variant="secondary" size="sm" onClick={reload}>
              Try again
            </Button>
          </div>
        )}

        {load === 'missing' && (
          <div className={styles.error} role="alert">
            <p className={styles.errorTitle}>No such piece</p>
            <p className={styles.errorBody}>
              It may have been deleted. The library has everything still saved.
            </p>
            <Button variant="secondary" size="sm" onClick={() => navigate('/writing')}>
              Back to the library
            </Button>
          </div>
        )}

        {load === 'ready' && piece && (
          <>
            <header className={styles.header}>
              <div className={styles.meta}>
                <TypeTag typeId={piece.type} />
                {piece.job && piece.company ? (
                  <Link className={styles.job} to={`/jobs/${piece.job}`}>
                    {piece.company}
                    {piece.role ? ` · ${piece.role}` : ''}
                  </Link>
                ) : (
                  <span className={styles.unattached}>Not tied to a job</span>
                )}
                <span className={styles.stamp}>Updated {formatDate(piece.updated_at)}</span>
              </div>

              {/* Lineage, read-only: which piece this was forked from, and what
                  has been forked out of it. This is what makes "which existing
                  piece is closest to what I need?" answerable. */}
              {(piece.derived_from || piece.forks.length > 0) && (
                <p className={styles.lineage}>
                  {piece.derived_from && (
                    <span>
                      Forked from{' '}
                      <Link to={`/writing/${piece.derived_from.id}`}>
                        {piece.derived_from.title}
                      </Link>
                    </span>
                  )}
                  {piece.forks.length > 0 && (
                    <span>
                      Forked into{' '}
                      {piece.forks.map((fork, i) => (
                        <span key={fork.id}>
                          {i > 0 && ', '}
                          <Link to={`/writing/${fork.id}`}>{fork.title}</Link>
                        </span>
                      ))}
                    </span>
                  )}
                </p>
              )}
            </header>

            <h2 className={styles.sectionTitle}>Passages</h2>
            <p className={styles.sectionNote}>
              Split from the piece automatically — copy any line on its own.
            </p>

            <div className={styles.rows}>
              {piece.passages.map((passage) => (
                <article key={passage.id} className={styles.passage}>
                  {/* Plain text, not rendered markdown: what you copy is the
                      markdown itself, so showing it as written is honest. */}
                  <p className={styles.text}>{passage.text}</p>
                  <div className={styles.passageEnd}>
                    {passage.use_count > 0 && (
                      <span className={styles.uses}>used {passage.use_count}×</span>
                    )}
                    <CopyButton
                      text={passage.text}
                      label="this passage"
                      onCopied={() => onPassageUsed(passage)}
                    />
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  )
}
