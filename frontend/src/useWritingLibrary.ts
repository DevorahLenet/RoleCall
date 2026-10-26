import { useCallback, useEffect, useState } from 'react'
import type { PassageHit, WritingFilters, WritingPiece } from './types'
import { getWritingPieces, searchPassages } from './api/client'
import { useDebounced } from './useDebounced'

export type LibraryLoad = 'loading' | 'ready' | 'error'

export interface WritingLibraryStore {
  /** Browse mode: the pieces matching the filters. Empty while searching. */
  pieces: WritingPiece[]
  /** Search mode: the matching lines. Empty while browsing. */
  hits: PassageHit[]
  /** True once a query has settled — this is what flips the row unit. */
  searching: boolean
  load: LibraryLoad
  reload: () => void
  /** Every company that has writing attached, for the filter select. */
  companies: string[]
}

// The library index's data. Route-local rather than in the shell: nothing
// outside /writing reads pieces, so putting them in useTracker would make every
// screen in the app pay for a fetch only this one needs — and the shell's
// LoadState has no `missing`, which the piece page does need.
//
// Two result modes share one hook because they share their filters. The query
// decides the unit: filters narrow documents, search returns lines.
export function useWritingLibrary(filters: WritingFilters): WritingLibraryStore {
  const [pieces, setPieces] = useState<WritingPiece[]>([])
  const [hits, setHits] = useState<PassageHit[]>([])
  const [load, setLoad] = useState<LibraryLoad>('loading')
  const [attempt, setAttempt] = useState(0)

  // The query trails the keystrokes; the other filters are click-driven and
  // apply at once.
  const query = useDebounced(filters.q).trim()
  const searching = query !== ''
  const { type, company, since, sort } = filters

  const reload = useCallback(() => {
    setLoad('loading')
    setAttempt((n) => n + 1)
  }, [])

  // `cancelled` guards against a slow response landing after a newer one — with
  // search-as-you-type that is the normal case, not an edge one.
  useEffect(() => {
    let cancelled = false
    setLoad('loading')

    const request = searching
      ? searchPassages({ q: query, type, company, since, sort }).then((rows) => {
          if (cancelled) return
          setHits(rows)
          setPieces([])
        })
      : getWritingPieces({ type, company, since, sort }).then((rows) => {
          if (cancelled) return
          setPieces(rows)
          setHits([])
        })

    request
      .then(() => {
        if (!cancelled) setLoad('ready')
      })
      .catch(() => {
        if (!cancelled) setLoad('error')
      })

    return () => {
      cancelled = true
    }
  }, [query, searching, type, company, since, sort, attempt])

  // The company filter's options come from the writing itself, so it never
  // offers a company with nothing to show. Derived from the browse results,
  // which means it is stable while searching rather than shrinking to whatever
  // the current query happens to match.
  const [companies, setCompanies] = useState<string[]>([])
  useEffect(() => {
    let cancelled = false
    getWritingPieces()
      .then((all) => {
        if (cancelled) return
        const named = all
          .map((piece) => piece.company)
          .filter((name): name is string => Boolean(name))
        setCompanies([...new Set(named)].sort())
      })
      .catch(() => {
        // No options rather than a broken screen — the filter just stays empty.
      })
    return () => {
      cancelled = true
    }
  }, [attempt])

  return { pieces, hits, searching, load, reload, companies }
}
