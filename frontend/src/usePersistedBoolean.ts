import { useCallback, useEffect, useState } from 'react'

// Where a persisted view preference lives. Namespaced so the app's keys are
// obvious in devtools and can't collide with anything else on localhost.
const PREFIX = 'rolecall.'

// Read a stored boolean, falling back when it is absent or unreadable.
// localStorage throws rather than returning null in a few real situations —
// Safari's private mode, cookies blocked entirely — so every access is guarded.
function read(key: string, fallback: boolean): boolean {
  try {
    const raw = window.localStorage.getItem(PREFIX + key)
    return raw === null ? fallback : raw === 'true'
  } catch {
    return fallback
  }
}

/** A boolean view preference that survives a reload — the kind of setting that
 *  is annoying to re-make every visit but not worth a row in the database.
 *  Behaves like useState; the write is best-effort, so a browser that refuses
 *  storage simply falls back to per-session state rather than breaking.
 *
 *  The initial read is lazy (inside useState) so it happens once per mount
 *  rather than on every render. */
export function usePersistedBoolean(
  key: string,
  fallback: boolean,
): [boolean, (value: boolean) => void] {
  const [value, setValue] = useState(() => read(key, fallback))

  useEffect(() => {
    try {
      window.localStorage.setItem(PREFIX + key, String(value))
    } catch {
      // Storage unavailable — the preference just won't outlive the session.
    }
  }, [key, value])

  // Stable identity, so it can be handed straight to a component's onChange
  // without re-rendering it on every parent render.
  const set = useCallback((next: boolean) => setValue(next), [])

  return [value, set]
}
