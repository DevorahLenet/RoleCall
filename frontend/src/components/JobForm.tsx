import { useId, useState } from 'react'
import type { FormEvent } from 'react'
import type { Job, NewJob } from '../types'
import { activeJobStatuses, defaultJobStatusId } from '../design-system/statuses'
import { Button } from './Button'
import { Dialog } from './Dialog'
import styles from './Form.module.css'

interface Props {
  /** Stage the form opens on — the focused column, when the board has one. */
  initialStatusId?: string
  onCreate: (input: NewJob) => Promise<Job>
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

// The New application form, in a dialog. Covers every field a job is born with:
// role, company, pipeline stage, the date it went out and the posting link.
//
// Only *active* stages are offered. A job created straight into a closed stage
// would be saved and counted with nowhere to appear — the board shows active
// stages only, and closed jobs have no surface yet. Closing a job is what the
// card's status pill is for.
export function JobForm({ initialStatusId, onCreate, onClose }: Props) {
  const [role, setRole] = useState('')
  const [company, setCompany] = useState('')
  // Opens on the focused column so adding from a stage lands the card there;
  // anything else (no param, or a closed stage with no column) starts at the
  // pipeline's first stage, which is also the model's default.
  const [status, setStatus] = useState(() =>
    activeJobStatuses.some((s) => s.id === initialStatusId)
      ? (initialStatusId as string)
      : defaultJobStatusId,
  )
  const [appliedOn, setAppliedOn] = useState('')
  const [postingUrl, setPostingUrl] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

  // POST the job and close on success; on failure keep the dialog (and the
  // user's typing) up and explain what happened. Blank optional fields send the
  // empty string or null the API expects — except `company`, which is omitted
  // entirely so the model's "undisclosed" default applies rather than an empty
  // string the model won't take.
  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!canSave) return
    setSaving(true)
    setError(null)

    const input: NewJob = {
      role: role.trim(),
      status,
      posting_url: postingUrl.trim(),
      applied_on: appliedOn || null,
    }
    const trimmedCompany = company.trim()
    if (trimmedCompany) input.company = trimmedCompany

    try {
      await onCreate(input)
      onClose()
    } catch {
      setError('Couldn’t save the application. Check the backend is running, then try again.')
      setSaving(false)
    }
  }

  return (
    <Dialog title="New application" onClose={onClose}>
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
              {activeJobStatuses.map((s) => (
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
            {saving ? 'Saving…' : 'Add application'}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
