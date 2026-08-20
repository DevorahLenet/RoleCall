import { useState } from 'react'
import { Plus, Trash } from '@phosphor-icons/react'
import type { Note } from '../types'
import { formatDate } from '../format'
import { Button } from './Button'
import { InlineAdd } from './InlineAdd'
import { JobSection } from './JobSection'
import section from './JobSection.module.css'
import styles from './NoteList.module.css'

interface Props {
  notes: Note[]
  onAdd: (text: string) => Promise<void>
  onDelete: (note: Note) => void
}

// The job's logbook — what happened and when, newest first. The highest-traffic
// section once a job is live.
//
// Each entry leads with its date in a fixed gutter, which is what makes this
// list legible as a *log* at a glance rather than as more rows like the tasks
// above it. Notes arrive newest-first from the API (the model orders by
// -created_at) and new ones are prepended, so no sort is needed here.
export function NoteList({ notes, onAdd, onDelete }: Props) {
  const [adding, setAdding] = useState(false)

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
          {notes.map((note) => (
            <article key={note.id} className={styles.row}>
              <span className={styles.stamp}>{formatDate(note.created_at)}</span>
              <p className={styles.text}>{note.text}</p>
              <button
                type="button"
                className={styles.remove}
                aria-label={`Delete note from ${formatDate(note.created_at)}`}
                onClick={() => onDelete(note)}
              >
                <Trash size={16} aria-hidden />
              </button>
            </article>
          ))}
        </div>
      )}
    </JobSection>
  )
}
