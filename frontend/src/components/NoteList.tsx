import { useEffect, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { PencilSimple, Plus, Trash } from '@phosphor-icons/react'
import type { Note } from '../types'
import { formatDate, splitDate } from '../format'
import { Button } from './Button'
import { InlineAdd } from './InlineAdd'
import { JobSection } from './JobSection'
import section from './JobSection.module.css'
import styles from './NoteList.module.css'

interface Props {
  notes: Note[]
  onAdd: (text: string) => Promise<void>
  onEdit: (note: Note, text: string) => Promise<void>
  onDelete: (note: Note) => void
}

// The job's logbook — what happened and when, newest first. The highest-traffic
// section once a job is live.
//
// Each entry is a QUIET TILE led by a date square — month over day — which is
// what makes this list legible as a *log* at a glance rather than as more rows
// like the tasks above it. Quiet because a note is reference, not an action
// item: an outline and a faint lift, never the task tile's shadow. Notes arrive
// newest-first from the API (the model orders by -created_at) and new ones are
// prepended, so no sort is needed here.
//
// An entry edits in place, in a field shaped like the one that wrote it. The
// date stays the date it was logged: editing a note corrects the record of what
// happened, it doesn't re-file it under today.
export function NoteList({ notes, onAdd, onEdit, onDelete }: Props) {
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [draft, setDraft] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fieldRef = useRef<HTMLTextAreaElement>(null)

  // Focus and place the cursor at the end as the editor opens — an edit is
  // usually an addition to what is already there.
  useEffect(() => {
    const field = fieldRef.current
    if (editingId === null || !field) return
    field.focus()
    field.setSelectionRange(field.value.length, field.value.length)
  }, [editingId])

  function startEditing(note: Note) {
    setEditingId(note.id)
    setDraft(note.text)
    setError(null)
  }

  function cancel() {
    setEditingId(null)
    setDraft('')
    setError(null)
  }

  // Saving an unchanged note is a no-op rather than a needless PATCH. A failure
  // keeps the editor open with the typing still in it.
  async function save(note: Note) {
    const text = draft.trim()
    if (!text || saving) return
    if (text === note.text) {
      cancel()
      return
    }
    setSaving(true)
    setError(null)
    try {
      await onEdit(note, text)
      cancel()
    } catch {
      setError('Couldn’t save that edit. Check the backend is running, then try again.')
    } finally {
      setSaving(false)
    }
  }

  // Escape abandons the edit. Enter has to stay a newline in a textarea, so the
  // shortcut for "done" is the modifier pair — the same one the composer uses.
  function onKeyDown(e: KeyboardEvent, note: Note) {
    if (e.key === 'Escape') {
      e.preventDefault()
      cancel()
      return
    }
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      void save(note)
    }
  }

  return (
    <JobSection
      title="Notes"
      action={
        !adding && (
          <Button
            size="sm"
            variant="ghost"
            icon={<Plus size={14} weight="bold" />}
            onClick={() => setAdding(true)}
          >
            Add note
          </Button>
        )
      }
    >
      {adding && (
        <InlineAdd
          label="New note"
          placeholder="What happened?"
          submitLabel="Add note"
          multiline
          onAdd={onAdd}
          onDone={() => setAdding(false)}
        />
      )}

      {notes.length === 0 ? (
        <p className={section.empty}>
          Nothing logged yet — calls, replies and decisions land here.
        </p>
      ) : (
        <div className={section.rows}>
          {notes.map((note) => {
            const editing = editingId === note.id
            const stamp = formatDate(note.created_at)
            const { month, day } = splitDate(note.created_at)

            return (
              <article key={note.id} className={styles.row}>
                {/* The leading square is the list's signature: a date block
                    here, a "?" on the questions below. Decorative — every
                    action already names the date in its label. */}
                <span className={styles.stamp} aria-hidden>
                  <i className={styles.stampMonth}>{month}</i>
                  <b className={styles.stampDay}>{day}</b>
                </span>

                {editing ? (
                  <div className={styles.editor}>
                    <label className="sr-only" htmlFor={`note-${note.id}`}>
                      Edit the note from {stamp}
                    </label>
                    <textarea
                      id={`note-${note.id}`}
                      ref={fieldRef}
                      className={styles.field}
                      value={draft}
                      disabled={saving}
                      onChange={(e) => setDraft(e.target.value)}
                      onKeyDown={(e) => onKeyDown(e, note)}
                    />
                    {error && (
                      <p className={styles.error} role="alert">
                        {error}
                      </p>
                    )}
                    <div className={styles.editorActions}>
                      <Button size="sm" variant="ghost" onClick={cancel} disabled={saving}>
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        variant="primary"
                        disabled={draft.trim() === '' || saving}
                        onClick={() => void save(note)}
                      >
                        {saving ? 'Saving…' : 'Save'}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className={styles.text}>{note.text}</p>
                )}

                {/* Both actions stay quiet until the row is hovered or one of
                    them takes focus, and they disappear entirely while the entry
                    is open for editing — the editor has its own buttons. */}
                {!editing && (
                  <div className={styles.actions}>
                    <button
                      type="button"
                      className={styles.action}
                      aria-label={`Edit note from ${stamp}`}
                      onClick={() => startEditing(note)}
                    >
                      <PencilSimple size={15} aria-hidden />
                    </button>
                    <button
                      type="button"
                      className={`${styles.action} ${styles.remove}`}
                      aria-label={`Delete note from ${stamp}`}
                      onClick={() => onDelete(note)}
                    >
                      <Trash size={15} aria-hidden />
                    </button>
                  </div>
                )}
              </article>
            )
          })}
        </div>
      )}
    </JobSection>
  )
}
