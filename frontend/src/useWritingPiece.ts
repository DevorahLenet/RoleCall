import { useCallback, useEffect, useState } from 'react'
import type { WritingPassage, WritingPieceDetail } from './types'
import { ApiError, getWritingPiece, markPassageUsed } from './api/client'

/** `missing` is a 404 — a deleted or mistyped piece, which is a different
 *  screen from `error`, where the server did not answer. */
export type PieceLoad = 'loading' | 'ready' | 'error' | 'missing'

export interface WritingPieceStore {
  piece: WritingPieceDetail | null
  load: PieceLoad
  reload: () => void
  /** Records a copy and folds the new count back into the passage in place. */
  onPassageUsed: (passage: WritingPassage) => void
}

// One saved piece. Modelled on useJobDetail: keyed on the id rather than on
// mounting, since navigating between two pieces remounts nothing.
//
// `null` means no piece is open. The hook still runs — the library mounts it
// unconditionally, as hooks require — it just holds nothing and fetches
// nothing until an id arrives.
export function useWritingPiece(id: number | null): WritingPieceStore {
  const [piece, setPiece] = useState<WritingPieceDetail | null>(null)
  const [load, setLoad] = useState<PieceLoad>('loading')
  const [attempt, setAttempt] = useState(0)

  const reload = useCallback(() => {
    setLoad('loading')
    setAttempt((n) => n + 1)
  }, [])

  useEffect(() => {
    if (id === null) {
      setPiece(null)
      return
    }
    let cancelled = false
    setLoad('loading')
    getWritingPiece(id)
      .then((detail) => {
        if (cancelled) return
        setPiece(detail)
        setLoad('ready')
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setPiece(null)
        setLoad(err instanceof ApiError && err.status === 404 ? 'missing' : 'error')
      })
    return () => {
      cancelled = true
    }
  }, [id, attempt])

  // Optimistic: the count ticks the moment the text is on the clipboard, and a
  // failed POST silently reverts. A copy that worked must never be reported as
  // having failed just because the bookkeeping did.
  const onPassageUsed = useCallback((passage: WritingPassage) => {
    const put = (next: WritingPassage) =>
      setPiece((prev) =>
        prev
          ? { ...prev, passages: prev.passages.map((p) => (p.id === next.id ? next : p)) }
          : prev,
      )

    put({ ...passage, use_count: passage.use_count + 1 })
    markPassageUsed(passage.id)
      .then(put)
      .catch(() => put(passage))
  }, [])

  return { piece, load, reload, onPassageUsed }
}
