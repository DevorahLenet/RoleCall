import { useEffect, useId, useRef, useState } from 'react'
import type { FormEvent, KeyboardEvent } from 'react'
import { Button } from './Button'
import styles from './InlineAdd.module.css'

interface Props {
  /** Accessible name for the field — visually carried by the placeholder. */
  label: string
  placeholder: string
  submitLabel: string
  /** Notes get a textarea; a task title or a question is a single line. */
  multiline?: boolean
  onAdd: (text: string) => Promise<void>
  /** Closes the composer. The section header's Add button reopens it. */
  onDone: () => void
}

// The composer for a job page list — tasks, questions and notes all use it.
// It is opened from the section header rather than sitting under every list:
// three permanently-open fields made the page read as a form to fill in rather
// than a record to read.
//
// Once open it STAYS open after a successful add, clearing and refocusing, so
// several notes can be logged in one go. Escape or Cancel closes it. The field
// keeps its text when a save fails, so a bad connection never costs the typing.
export function InlineAdd({
  label,
  placeholder,
  submitLabel,
  multiline,
  onAdd,
  onDone,
}: Props) {
  const [text, setText] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fieldRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null)
  const id = useId()

  const canSave = text.trim() !== '' && !saving

  // Opening the composer should land the cursor in it — the click that opened
  // it was already the intent to type.
  useEffect(() => {
    fieldRef.current?.focus()
  }, [])

  async function save() {
    if (!canSave) return
    setSaving(true)
    setError(null)
    try {
      await onAdd(text.trim())
      setText('')
      fieldRef.current?.focus()
    } catch {
      setError('Couldn’t save that. Check the backend is running, then try again.')
    } finally {
      setSaving(false)
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    void save()
  }

  // Escape closes. In a textarea Enter has to insert a newline, so the shortcut
  // for "done" is the usual modifier pair; single-line fields submit on Enter
  // for free, being inside a form.
  function onKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      e.preventDefault()
      onDone()
      return
    }
    if (multiline && e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      void save()
    }
  }

  const controlClass = multiline
    ? `${styles.control} ${styles.multiline}`
    : styles.control

  return (
    <form className={styles.form} onSubmit={onSubmit}>
      <label className="sr-only" htmlFor={id}>
        {label}
      </label>

      {multiline ? (
        <textarea
          id={id}
          ref={fieldRef as React.RefObject<HTMLTextAreaElement>}
          className={controlClass}
          value={text}
          placeholder={placeholder}
          disabled={saving}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKeyDown}
        />
      ) : (
        <input
          id={id}
          ref={fieldRef as React.RefObject<HTMLInputElement>}
          className={controlClass}
          value={text}
          placeholder={placeholder}
          disabled={saving}
          maxLength={300}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKeyDown}
        />
      )}

      <div className={styles.actions}>
        <Button variant="ghost" size="sm" onClick={onDone} disabled={saving}>
          Cancel
        </Button>
        <Button type="submit" size="sm" variant="primary" disabled={!canSave}>
          {saving ? 'Saving…' : submitLabel}
        </Button>
      </div>

      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
    </form>
  )
}
