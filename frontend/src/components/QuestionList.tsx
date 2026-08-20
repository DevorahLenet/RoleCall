import { useEffect, useRef, useState } from 'react'
import { CheckCircle, Plus, Question, Trash } from '@phosphor-icons/react'
import type { Question as QuestionType } from '../types'
import { formatDate } from '../format'
import { Button } from './Button'
import { InlineAdd } from './InlineAdd'
import { JobSection } from './JobSection'
import section from './JobSection.module.css'
import styles from './QuestionList.module.css'

interface Props {
  questions: QuestionType[]
  onAdd: (text: string) => Promise<void>
  onAnswer: (question: QuestionType, answer: string) => Promise<void>
  onReopen: (question: QuestionType) => void
  onDelete: (question: QuestionType) => void
}

// Open questions about this job, with the resolved ones folded away beneath.
// Each row leads with a mark in the same gutter the notes use for their date —
// a question mark while open, a tick once answered — so the three lists on the
// page stay tellable apart without three different row shapes.
//
// Answering and resolving are one action: you write what you found out, and the
// question closes. A question with an answer but no stamp would be a state
// nobody means to be in.
export function QuestionList({ questions, onAdd, onAnswer, onReopen, onDelete }: Props) {
  const [answeringId, setAnsweringId] = useState<number | null>(null)
  const [draft, setDraft] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showResolved, setShowResolved] = useState(false)
  const [adding, setAdding] = useState(false)
  const fieldRef = useRef<HTMLTextAreaElement>(null)

  const open = questions.filter((q) => !q.resolved_at)
  const resolved = questions.filter((q) => q.resolved_at)

  // Focus the editor as it opens, so answering is one click and then typing.
  useEffect(() => {
    if (answeringId !== null) fieldRef.current?.focus()
  }, [answeringId])

  // Start answering from whatever is already recorded — reopened questions keep
  // their old answer, and this is where it gets amended rather than retyped.
  function startAnswering(question: QuestionType) {
    setAnsweringId(question.id)
    setDraft(question.answer)
    setError(null)
  }

  function cancel() {
    setAnsweringId(null)
    setDraft('')
    setError(null)
  }

  // Save the answer and resolve in one edit; a failure keeps the editor open
  // with the text still in it.
  async function submitAnswer(question: QuestionType) {
    const answer = draft.trim()
    if (!answer || saving) return
    setSaving(true)
    setError(null)
    try {
      await onAnswer(question, answer)
      cancel()
    } catch {
      setError('Couldn’t save that answer. Check the backend is running, then try again.')
    } finally {
      setSaving(false)
    }
  }

  // One question, in whichever of its three states applies: open, being
  // answered, or resolved with the answer showing.
  function renderQuestion(question: QuestionType) {
    const editing = answeringId === question.id
    const isResolved = Boolean(question.resolved_at)

    return (
      <article
        key={question.id}
        className={isResolved ? `${styles.row} ${styles.rowResolved}` : styles.row}
      >
        <span className={styles.mark} aria-hidden>
          {isResolved ? <CheckCircle size={16} weight="fill" /> : <Question size={16} />}
        </span>

        <div className={styles.body}>
          <p className={styles.text}>{question.text}</p>

          {/* The answer shows whenever there is one — that is the point of
              keeping resolved questions around at all. */}
          {question.answer && !editing && (
            <p className={styles.answer}>
              <span className={styles.answerLabel}>Answer</span>
              {question.answer}
            </p>
          )}

          {isResolved && !editing && (
            <span className={styles.stamp}>
              Resolved {formatDate(question.resolved_at as string)}
            </span>
          )}

          {editing && (
            <div className={styles.editor}>
              <label className="sr-only" htmlFor={`answer-${question.id}`}>
                Answer to “{question.text}”
              </label>
              <textarea
                id={`answer-${question.id}`}
                ref={fieldRef}
                className={styles.field}
                value={draft}
                disabled={saving}
                placeholder="What did you find out?"
                onChange={(e) => setDraft(e.target.value)}
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
                  onClick={() => void submitAnswer(question)}
                >
                  {saving ? 'Saving…' : 'Save answer'}
                </Button>
              </div>
            </div>
          )}
        </div>

        {!editing && (
          <div className={styles.actions}>
            {isResolved ? (
              <Button size="sm" variant="ghost" onClick={() => onReopen(question)}>
                Reopen
              </Button>
            ) : (
              <Button size="sm" variant="ghost" onClick={() => startAnswering(question)}>
                Answer
              </Button>
            )}
            <button
              type="button"
              className={styles.remove}
              aria-label={`Delete question: ${question.text}`}
              onClick={() => onDelete(question)}
            >
              <Trash size={16} aria-hidden />
            </button>
          </div>
        )}
      </article>
    )
  }

  return (
    <JobSection
      title="Questions"
      action={
        !adding && (
          <div className={styles.headActions}>
            {resolved.length > 0 && (
              <Button size="sm" variant="ghost" onClick={() => setShowResolved((v) => !v)}>
                {showResolved ? 'Hide resolved' : 'Show resolved'}
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              icon={<Plus size={14} weight="bold" />}
              onClick={() => setAdding(true)}
            >
              Add question
            </Button>
          </div>
        )
      }
    >
      {adding && (
        <InlineAdd
          label="New question"
          placeholder="What do you need to find out?"
          submitLabel="Add question"
          onAdd={onAdd}
          onDone={() => setAdding(false)}
        />
      )}

      {open.length === 0 ? (
        <p className={section.empty}>
          {resolved.length > 0
            ? 'Nothing open — every question here has an answer.'
            : 'Nothing outstanding. Park what you need to find out here.'}
        </p>
      ) : (
        <div className={section.rows}>{open.map(renderQuestion)}</div>
      )}

      {showResolved && resolved.length > 0 && (
        <div className={styles.resolved}>
          <div className={section.rows}>{resolved.map(renderQuestion)}</div>
        </div>
      )}
    </JobSection>
  )
}
