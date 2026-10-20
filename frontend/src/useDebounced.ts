import { useEffect, useState } from 'react'

/** Trails `value` by `delay`, so a value that changes on every keystroke can
 *  drive something expensive.
 *
 *  The first debounce in this app, and it exists for one reason: the writing
 *  library's search is a server round-trip (SQLite FTS5), where every other
 *  screen narrows an already-fetched array in memory. Without this, typing
 *  "fundraising" would fire eleven queries and race their responses.
 */
export function useDebounced<T>(value: T, delay = 200): T {
  const [settled, setSettled] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setSettled(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return settled
}
