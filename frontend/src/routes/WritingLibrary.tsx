import { BookOpen } from '@phosphor-icons/react'
import { Link, useSearchParams } from 'react-router-dom'
import type { WritingFilters } from '../types'
import { Button } from '../components/Button'
import { CopyButton } from '../components/CopyButton'
import { EmptyState } from '../components/EmptyState'
import { Excerpt } from '../components/Excerpt'
import { SearchField } from '../components/SearchField'
import { SkeletonRows } from '../components/Skeleton'
import { Toolbar } from '../components/Toolbar'
import { TruncatedText } from '../components/TruncatedText'
import { TypeTag } from '../components/TypeTag'
import { writingTypes } from '../design-system/writingTypes'
import { formatDate } from '../format'
import { useTrackerContext } from '../useTracker'
import { useWritingLibrary } from '../useWritingLibrary'
import styles from './WritingLibrary.module.css'

// The reusable pool of cover letters, blurbs, resumes and impact statements.
//
// Search-first, because the hard case is the one the screen exists for: you
// don't want "six cover letters mention fundraising", you want the sentence.
// So the row unit flips on the query — no query lists PIECES, a query lists
// PASSAGES — while the filters narrow both the same way.
//
// Read and copy only. Writing is authored on a job page (still to build), which
// is what keeps the library a view over the data rather than a second place to
// remember to populate.
export function WritingLibrary() {
  const { onOpenNav } = useTrackerContext()
  const [params, setParams] = useSearchParams()

  // The filters live in the URL, like the board's `?status=`, so a search is
  // shareable and survives the Back button.
  const filters: WritingFilters = {
    q: params.get('q') ?? '',
    type: params.get('type') ?? '',
    company: params.get('company') ?? '',
    sort: params.get('sort') ?? '',
  }
  const library = useWritingLibrary(filters)

  // Rewrites one filter, dropping empties so the URL never carries `?type=`.
  function setFilter(key: keyof WritingFilters, value: string) {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    setParams(next, { replace: true })
  }

  const sortValue = filters.sort || (library.searching ? 'relevance' : 'recent')
  const filtered = filters.type !== '' || filters.company !== ''

  return (
    <>
      {/* No New piece action: there is nothing it could do yet, and a button
          that opens nothing is worse than no button. */}
      <Toolbar title="Writing Library" onOpenNav={onOpenNav} />

      <div className={styles.content}>
        <div className={styles.controls}>
          <SearchField
            value={filters.q}
            onChange={(value) => setFilter('q', value)}
            label="Search your writing"
            placeholder="Search for a line — fundraising, onboarding, a team you led…"
          />

          <div className={styles.filters}>
            {/* Type is a chip row rather than a select: four options, always
                worth seeing at once. Single-select, with All as the way out. */}
            <div className={styles.chips} role="group" aria-label="Filter by type">
              <button
                type="button"
                className={filters.type === '' ? styles.chipOn : styles.chip}
                aria-pressed={filters.type === ''}
                onClick={() => setFilter('type', '')}
              >
                All
              </button>
              {writingTypes.map((type) => (
                <button
                  key={type.id}
                  type="button"
                  className={filters.type === type.id ? styles.chipOn : styles.chip}
                  aria-pressed={filters.type === type.id}
                  onClick={() => setFilter('type', type.id)}
                >
                  {type.label}
                </button>
              ))}
            </div>

            <div className={styles.selects}>
              <label className="sr-only" htmlFor="writing-company">
                Filter by company
              </label>
              <select
                id="writing-company"
                className={styles.select}
                value={filters.company}
                onChange={(e) => setFilter('company', e.target.value)}
              >
                <option value="">Any company</option>
                {library.companies.map((company) => (
                  <option key={company} value={company}>
                    {company}
                  </option>
                ))}
              </select>

              <label className="sr-only" htmlFor="writing-sort">
                Sort
              </label>
              <select
                id="writing-sort"
                className={styles.select}
                value={sortValue}
                onChange={(e) => setFilter('sort', e.target.value)}
              >
                {/* Relevance only means something once there is a query. */}
                {library.searching && <option value="relevance">Best match</option>}
                <option value="recent">Recent</option>
                <option value="used">Most used</option>
              </select>
            </div>
          </div>
        </div>

        {library.load === 'loading' && (
          <div role="status" aria-live="polite">
            <span className="sr-only">Searching your writing…</span>
            <SkeletonRows count={5} />
          </div>
        )}

        {library.load === 'error' && (
          <div className={styles.error} role="alert">
            <p className={styles.errorTitle}>Couldn’t reach the server</p>
            <p className={styles.errorBody}>
              Check that the backend is running on port 8000, then try again.
            </p>
            <Button variant="secondary" size="sm" onClick={library.reload}>
              Try again
            </Button>
          </div>
        )}

        {library.load === 'ready' && library.searching && (
          <>
            {library.hits.length === 0 ? (
              <p className={styles.none}>
                No lines match “{filters.q.trim()}”
                {filtered ? ' with these filters' : ''}.
              </p>
            ) : (
              <div className={styles.rows}>
                {/* A search result is a LINE: the excerpt leads, and the piece
                    it came from is context underneath it. */}
                {library.hits.map((hit) => (
                  <article key={hit.passage_id} className={styles.hitRow}>
                    <div className={styles.hitBody}>
                      <Excerpt text={hit.excerpt} />
                      <p className={styles.hitMeta}>
                        <Link className={styles.hitSource} to={`/writing/${hit.piece.id}`}>
                          {hit.piece.title}
                        </Link>
                        <TypeTag typeId={hit.piece.type} />
                        {hit.company && <span>{hit.company}</span>}
                        {hit.use_count > 0 && (
                          <span className={styles.uses}>
                            used {hit.use_count}×
                          </span>
                        )}
                      </p>
                    </div>
                    <CopyButton text={hit.text} label="this line" />
                  </article>
                ))}
              </div>
            )}
          </>
        )}

        {library.load === 'ready' && !library.searching && (
          <>
            {library.pieces.length === 0 ? (
              filtered ? (
                <p className={styles.none}>Nothing saved matches these filters.</p>
              ) : (
                /* No CTA: writing is authored on a job page, which does not
                   exist yet, so there is genuinely no next step to offer here
                   and pretending otherwise would be worse. */
                <EmptyState
                  icon={<BookOpen size={22} />}
                  title="Nothing saved yet"
                  message="Your cover letters, blurbs and impact statements will collect here as you write them on a job, so you can pull a line straight out instead of starting from scratch."
                />
              )
            ) : (
              <div className={styles.rows}>
                {library.pieces.map((piece) => (
                  <Link key={piece.id} className={styles.pieceRow} to={`/writing/${piece.id}`}>
                    <TruncatedText text={piece.title} className={styles.pieceTitle} />
                    <TypeTag typeId={piece.type} />
                    <span className={styles.pieceCompany}>{piece.company ?? '—'}</span>
                    <span className={styles.pieceDate}>{formatDate(piece.updated_at)}</span>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </>
  )
}
