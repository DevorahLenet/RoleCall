import type { ReactNode } from 'react'
import { BookOpen, Buildings, CalendarBlank } from '@phosphor-icons/react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import type { WritingFilters } from '../types'
import { Button } from '../components/Button'
import { CopyButton } from '../components/CopyButton'
import { EmptyState } from '../components/EmptyState'
import { Excerpt } from '../components/Excerpt'
import { FilterMenu } from '../components/FilterMenu'
import type { FilterOption } from '../components/FilterMenu'
import { SearchField } from '../components/SearchField'
import { SkeletonRows } from '../components/Skeleton'
import { Toolbar } from '../components/Toolbar'
import { TypeGlyph, TypeTag } from '../components/TypeTag'
import { WritingPiecePanel } from '../components/WritingPiecePanel'
import {
  allWritingIcon as AllWritingIcon,
  getWritingTypeIcon,
  pluralWritingType,
  writingTypes,
} from '../design-system/writingTypes'
import { formatDate } from '../format'
import { markPassageUsed } from '../api/client'
import { useTrackerContext } from '../useTracker'
import { useWritingLibrary } from '../useWritingLibrary'
import { useWritingPiece } from '../useWritingPiece'
import styles from './WritingLibrary.module.css'

// "Any time" windows, in days. Short list on purpose: this narrows a pool of
// your own writing, where "roughly recent" is the only question anyone asks.
const TIME_OPTIONS: FilterOption[] = [
  { value: '', label: 'Any time' },
  { value: '30', label: 'Past month' },
  { value: '90', label: 'Past 3 months' },
  { value: '365', label: 'Past year' },
]

// The reusable pool of cover letters, blurbs, resumes and impact statements.
//
// Search-first, because the hard case is the one the screen exists for: you
// don't want "six cover letters mention fundraising", you want the sentence.
// So the row unit flips on the query — no query lists PIECES, a query lists
// PASSAGES — while the filters narrow both the same way, server-side.
//
// One piece opens as a PANEL over the dimmed library rather than as its own
// screen, so the list you were choosing from stays in view. `/writing/:id`
// renders this same route with that panel open, which is what keeps a link to
// a piece working.
//
// Read and copy only. Writing is authored on a job page (still to build), which
// is what keeps the library a view over the data rather than a second place to
// remember to populate.
export function WritingLibrary() {
  const { onOpenNav } = useTrackerContext()
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const routeId = useParams().id

  // The filters live in the URL, like the board's `?status=`, so a search is
  // shareable and survives the Back button.
  const filters: WritingFilters = {
    q: params.get('q') ?? '',
    type: params.get('type') ?? '',
    company: params.get('company') ?? '',
    since: params.get('since') ?? '',
    sort: params.get('sort') ?? '',
  }
  const library = useWritingLibrary(filters)

  // The open piece is the ROUTE, not component state, so the panel survives a
  // reload and a link to it opens the library behind it.
  const openId = routeId ? Number(routeId) : null
  const piece = useWritingPiece(Number.isNaN(openId) ? null : openId)

  const query = params.toString()
  const suffix = query ? `?${query}` : ''

  // Rewrites one filter, dropping empties so the URL never carries `?type=`.
  // Filters stay in place while a piece is open — the panel is a layer over
  // this screen, not a different one.
  function setFilter(key: keyof WritingFilters, value: string) {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    setParams(next, { replace: true })
  }

  const filtered = filters.type !== '' || filters.company !== '' || filters.since !== ''

  const companyOptions: FilterOption[] = [
    { value: '', label: 'Any company' },
    ...library.companies.map((company) => ({ value: company, label: company })),
  ]

  // One tile language for both modes. Left to right: the type's bare glyph,
  // then content FIRST (the preview or the matched line) with the quiet title
  // line under it, then the date (browse only), then copy.
  //
  // The whole tile opens the piece via a link stretched across it rather than
  // a click handler, so middle-click and copy-link keep working; the copy
  // button is raised above that layer because it is a target of its own.
  function tile(key: string, options: {
    id: number
    type: string
    title: string
    company: string | null
    preview: ReactNode
    trailing?: ReactNode
    date?: string
    copyText: string
    copyLabel: string
    onCopied?: () => void
  }) {
    const open = options.id === openId
    return (
      <article key={key} className={open ? `${styles.tile} ${styles.tileOpen}` : styles.tile}>
        <TypeGlyph typeId={options.type} />

        <div className={styles.tileBody}>
          {options.preview}
          <h2 className={styles.tileTitle}>
            <TypeTag typeId={options.type} />
            <span className={styles.tileName}>{options.title}</span>
            {options.company ? (
              <span className={styles.tileCompany}>{options.company}</span>
            ) : (
              options.trailing
            )}
          </h2>
        </div>

        {options.date && <span className={styles.tileDate}>{options.date}</span>}

        <span className={styles.tileCopy}>
          <CopyButton
            text={options.copyText}
            label={options.copyLabel}
            onCopied={options.onCopied}
          />
        </span>

        <Link className={styles.tileOpenLink} to={`/writing/${options.id}${suffix}`}>
          <span className="sr-only">{`Open ${options.title}`}</span>
        </Link>
      </article>
    )
  }

  return (
    <>
      {/* No page action: nothing here creates a piece yet, and a button that
          opens nothing is worse than no button. */}
      <Toolbar title="Ready when you are" accent="Ready" onOpenNav={onOpenNav} />

      <div className={styles.content}>
        {/* The query takes the row; the two filters sit beside it as equals,
            all three at 48px. On this screen narrowing IS the primary task. */}
        <div className={styles.top}>
          <SearchField
            value={filters.q}
            onChange={(value) => setFilter('q', value)}
            label="Search your writing"
            placeholder="Search for a line — fundraising, onboarding, a team you led…"
          />
          <FilterMenu
            label="Filter by company"
            icon={<Buildings size={16} />}
            value={filters.company}
            options={companyOptions}
            onChange={(value) => setFilter('company', value)}
          />
          <FilterMenu
            label="Filter by when it was last updated"
            icon={<CalendarBlank size={16} />}
            value={filters.since}
            options={TIME_OPTIONS}
            onChange={(value) => setFilter('since', value)}
          />
        </div>

        <div className={styles.lib}>
          <div className={styles.libFilters}>
            {/* Type is a pill row rather than a select: four options, always
                worth seeing at once. Single-select, with All as the way out.
                Selection reads as FILL, never hue — types carry no colour. */}
            <div className={styles.types} role="group" aria-label="Filter by writing type">
              <button
                type="button"
                className={filters.type === '' ? styles.typeOn : styles.type}
                aria-pressed={filters.type === ''}
                onClick={() => setFilter('type', '')}
              >
                <AllWritingIcon className={styles.typeIcon} size={14} aria-hidden />
                All writing
              </button>
              {writingTypes.map((type) => {
                const TypeIcon = getWritingTypeIcon(type.id)
                return (
                  <button
                    key={type.id}
                    type="button"
                    className={filters.type === type.id ? styles.typeOn : styles.type}
                    aria-pressed={filters.type === type.id}
                    onClick={() => setFilter('type', type.id)}
                  >
                    <TypeIcon className={styles.typeIcon} size={14} aria-hidden />
                    {pluralWritingType(type)}
                  </button>
                )
              })}
            </div>

            {/* Search says how much it found; browsing doesn't need to. */}
            {library.load === 'ready' && library.searching && (
              <p className={styles.countLine}>
                {library.hits.length} {library.hits.length === 1 ? 'line' : 'lines'} across{' '}
                {new Set(library.hits.map((h) => h.piece.id)).size}{' '}
                {new Set(library.hits.map((h) => h.piece.id)).size === 1
                  ? 'piece'
                  : 'pieces'}
              </p>
            )}
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

          {/* SEARCH MODE — the unit is a line. The matched passage shows in
              full rather than clamped: it is the answer, not a teaser. */}
          {library.load === 'ready' && library.searching && (
            library.hits.length === 0 ? (
              <p className={styles.none}>
                No lines match “{filters.q.trim()}”
                {filtered ? ' with these filters' : ''}.
              </p>
            ) : (
              <div className={styles.list}>
                {library.hits.map((hit) =>
                  tile(`hit-${hit.passage_id}`, {
                    id: hit.piece.id,
                    type: hit.piece.type,
                    title: hit.piece.title,
                    company: hit.company,
                    preview: <Excerpt text={hit.excerpt} />,
                    // With no company to name, the slot says how well the line
                    // has earned its place instead of sitting empty.
                    trailing:
                      hit.use_count > 0 ? (
                        <span className={styles.tileCompany}>Used {hit.use_count}×</span>
                      ) : undefined,
                    copyText: hit.text,
                    copyLabel: 'this line',
                  }),
                )}
              </div>
            )
          )}

          {/* BROWSE MODE — the unit is a piece, previewed by its first line. */}
          {library.load === 'ready' && !library.searching && (
            library.pieces.length === 0 ? (
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
              <div className={styles.list}>
                {library.pieces.map((p) =>
                  tile(`piece-${p.id}`, {
                    id: p.id,
                    type: p.type,
                    title: p.title,
                    company: p.company,
                    preview: <p className={styles.preview}>{p.preview}</p>,
                    date: formatDate(p.updated_at),
                    // A tile can only copy the line it is showing — the body
                    // isn't in the index payload — so the label says so, and
                    // the copy is credited to that passage like any other.
                    copyText: p.preview,
                    copyLabel: 'this piece’s opening line',
                    onCopied: p.preview_passage
                      ? () => void markPassageUsed(p.preview_passage as number).catch(() => {})
                      : undefined,
                  }),
                )}
              </div>
            )
          )}
        </div>
      </div>

      {/* The open piece, over the dimmed library. Closing returns to the list
          with the filters intact — the panel is a layer, not a destination. */}
      {openId !== null && !Number.isNaN(openId) && (
        <WritingPiecePanel
          store={piece}
          onClose={() => navigate(`/writing${suffix}`)}
        />
      )}
    </>
  )
}
