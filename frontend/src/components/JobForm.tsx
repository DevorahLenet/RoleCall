import { useId, useState } from 'react'
import type { FormEvent } from 'react'
import type { Job, JobDetail, NewJob } from '../types'
import {
  activeJobStatuses,
  defaultJobStatusId,
  getJobStatus,
} from '../design-system/statuses'
import { Button } from './Button'
import { Dialog } from './Dialog'
import styles from './Form.module.css'

interface Props {
  /** The application being edited. Omit to create a new one. A JobDetail when
   *  it comes from the job page, which is what carries the fit score. */
  job?: Job | JobDetail
  /** Stage a NEW application opens on — the focused column, when the board has
   *  one. Ignored when editing, which starts from the job’s own stage. */
  initialStatusId?: string
  /** Persists the form. Create POSTs, edit PATCHes; either way a rejection
   *  keeps the dialog open with the typing intact. */
  onSave: (input: NewJob) => Promise<unknown>
  onClose: () => void
}

// Today as `YYYY-MM-DD` from the local calendar parts. `toISOString()` converts
// to UTC first and would offer tomorrow as the cap for anyone east of Greenwich
// after their afternoon — the same trap JobCard's date formatting avoids from
// the other direction.
function todayIso(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

// The one form for a job’s own fields — role, company, pipeline stage, the date
// it went out and the posting link. It both creates (from any screen’s toolbar)
// and edits (from the job page), because the fields and their rules are the same
// either way; only the verb and the destination differ.
//
// For a NEW job only active stages are offered: created straight into a closed
// stage, a job would be saved and counted with nowhere to appear, since the
// board shows active stages only. Closing a job is what the status pill is for —
// but an already-closed job keeps its own stage on the list, so editing one
// can’t quietly move it back into the pipeline.
export function JobForm({ job, initialStatusId, onSave, onClose }: Props) {
  const editing = job !== undefined
  const [role, setRole] = useState(job?.role ?? '')
  const [company, setCompany] = useState(job?.company ?? '')
  // A new job opens on the focused column so adding from a stage lands the card
  // there; anything else (no param, or a closed stage with no column) starts at
  // the pipeline’s first stage, which is also the model’s default.
  const [status, setStatus] = useState(() => {
    if (job) return job.status
    return activeJobStatuses.some((s) => s.id === initialStatusId)
      ? (initialStatusId as string)
      : defaultJobStatusId
  })
  const [appliedOn, setAppliedOn] = useState(job?.applied_on ?? '')
  const [postingUrl, setPostingUrl] = useState(job?.posting_url ?? '')
  // Only editing offers a fit score: POST /api/jobs/ answers with the slim
  // serializer, which has no fit_score and would drop it without a word. You
  // rate a role once you know something about it, not as you add it.
  const [fitScore, setFitScore] = useState(() => {
    const score = job && 'fit_score' in job ? job.fit_score : null
    return score === null || score === undefined ? '' : String(score)
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Cheap enough to derive every render, and it keeps a closed job’s own stage
  // selectable without offering closed stages to everything else.
  const current = getJobStatus(job?.status)
  const stageOptions =
    current && current.group !== 'active'
      ? [...activeJobStatuses, current]
      : activeJobStatuses

  // One id root per form instance, so every label points at its own control.
  const id = useId()
  const fieldId = (name: string) => `${id}-${name}`

  const canSave = role.trim() !== '' && !saving

  // What people paste is `acme.com/careers/123`, and a URLField rejects a URL
  // with no scheme. Fixing it on blur rather than at submit means the field
  // shows what will be saved, and type="url" never rejects a value we were
  // about to accept anyway.
  function onUrlBlur() {
    const trimmed = postingUrl.trim()
    const next =
      trimmed && !/^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed)
        ? `https://${trimmed}`
        : trimmed
    if (next !== postingUrl) setPostingUrl(next)
  }

  // Save and close on success; on failure keep the dialog (and the user’s
  // typing) up and explain what happened. Blank optional fields send the empty
  // string or null the API expects — including `company`, which the API reads
  // as "undisclosed", so this form never has to know the default string.
  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!canSave) return
    setSaving(true)
    setError(null)

    // An empty score means unrated (null), not zero — those are different
    // things, and only one of them is a judgement.
    const trimmedScore = fitScore.trim()
    const parsedScore = trimmedScore === '' ? null : Number(trimmedScore)
    if (
      editing &&
      parsedScore !== null &&
      (!Number.isFinite(parsedScore) || parsedScore < 0 || parsedScore > 10)
    ) {
      setError('Fit has to be a number from 0 to 10.')
      setSaving(false)
      return
    }

    try {
      await onSave({
        role: role.trim(),
        company: company.trim(),
        status,
        posting_url: postingUrl.trim(),
        applied_on: appliedOn || null,
        ...(editing ? { fit_score: parsedScore } : {}),
      })
      onClose()
    } catch {
      setError(
        'Couldn’t save the application. Check the backend is running, then try again.',
      )
      setSaving(false)
    }
  }

  return (
    <Dialog title={editing ? 'Edit application' : 'New application'} onClose={onClose}>
      <form className={styles.form} onSubmit={onSubmit}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor={fieldId('role')}>
            Role
          </label>
          <input
            id={fieldId('role')}
            className={styles.control}
            value={role}
            required
            maxLength={200}
            placeholder="Product Designer"
            onChange={(e) => setRole(e.target.value)}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor={fieldId('company')}>
            Company
          </label>
          <input
            id={fieldId('company')}
            className={styles.control}
            value={company}
            maxLength={200}
            autoComplete="organization"
            placeholder="undisclosed"
            onChange={(e) => setCompany(e.target.value)}
          />
          <p className={styles.hint}>Leave blank for a role you can’t name yet.</p>
        </div>

        <div className={styles.row}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor={fieldId('status')}>
              Stage
            </label>
            {/* Options come from statuses.json like every other status surface —
                no label or colour is picked here. */}
            <select
              id={fieldId('status')}
              className={styles.control}
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              {stageOptions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor={fieldId('applied')}>
              Applied on
            </label>
            {/* Optional — a role you're still researching hasn't gone out yet.
                Capped at today: an application can't be sent in the future. */}
            <input
              id={fieldId('applied')}
              type="date"
              className={styles.control}
              value={appliedOn}
              max={todayIso()}
              onChange={(e) => setAppliedOn(e.target.value)}
            />
          </div>
        </div>

        {editing && (
          <div className={styles.field}>
            <label className={styles.label} htmlFor={fieldId('fit')}>
              Fit / 10
            </label>
            <input
              id={fieldId('fit')}
              type="number"
              className={styles.control}
              min={0}
              max={10}
              step={0.5}
              value={fitScore}
              placeholder="Not rated"
              onChange={(e) => setFitScore(e.target.value)}
            />
            <p className={styles.hint}>
              How well the role fits you. Why it fits belongs in the notes.
            </p>
          </div>
        )}

        <div className={styles.field}>
          <label className={styles.label} htmlFor={fieldId('url')}>
            Posting link
          </label>
          <input
            id={fieldId('url')}
            type="url"
            inputMode="url"
            className={styles.control}
            value={postingUrl}
            placeholder="https://…"
            onChange={(e) => setPostingUrl(e.target.value)}
            onBlur={onUrlBlur}
          />
          <p className={styles.hint}>The card’s role links here when it’s set.</p>
        </div>

        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}

        <div className={styles.actions}>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={!canSave}>
            {saving ? 'Saving…' : editing ? 'Save changes' : 'Add application'}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
