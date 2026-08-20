import { useId, useState } from 'react'
import type { FormEvent } from 'react'
import type { Job, NewTask, Task } from '../types'
import { taskStatuses } from '../design-system/taskStatuses'
import { taskCategories } from '../design-system/categories'
import { priorities } from '../design-system/priorities'
import { Button } from './Button'
import { Dialog } from './Dialog'
import styles from './Form.module.css'

interface Props {
  jobs: Job[]
  onCreate: (input: NewTask) => Promise<Task>
  onClose: () => void
}

// Defaults mirror the model's, derived from the design-system files rather than
// hardcoded: the first task status, and the middle priority rank.
const defaultStatus = taskStatuses[0].id
const defaultPriority = priorities[Math.floor(priorities.length / 2)].id

// The New task form, in a dialog. Covers every field a task is born with —
// completion is deliberately absent, since a task you're creating isn't done.
// Job and category are mutually exclusive (the model's "never both"), so picking
// a job disables and clears the category select.
export function TaskForm({ jobs, onCreate, onClose }: Props) {
  const [title, setTitle] = useState('')
  const [jobId, setJobId] = useState('')
  const [category, setCategory] = useState('')
  const [status, setStatus] = useState(defaultStatus)
  const [priority, setPriority] = useState(defaultPriority)
  const [dueOn, setDueOn] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // One id root per form instance, so every label points at its own control.
  const id = useId()
  const fieldId = (name: string) => `${id}-${name}`

  const hasJob = jobId !== ''
  const canSave = title.trim() !== '' && !saving

  // POST the task and close on success; on failure keep the dialog (and the
  // user's typing) up and explain what happened.
  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!canSave) return
    setSaving(true)
    setError(null)
    try {
      await onCreate({
        title: title.trim(),
        status,
        priority,
        job: hasJob ? Number(jobId) : null,
        // Never both: a job-attached task sends an empty category.
        category: hasJob ? '' : category,
        due_on: dueOn || null,
      })
      onClose()
    } catch {
      setError('Couldn’t save the task. Check the backend is running, then try again.')
      setSaving(false)
    }
  }

  return (
    <Dialog title="New task" onClose={onClose}>
      <form className={styles.form} onSubmit={onSubmit}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor={fieldId('title')}>
            Task
          </label>
          <input
            id={fieldId('title')}
            className={styles.control}
            value={title}
            required
            maxLength={300}
            placeholder="Follow up with the recruiter"
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className={styles.row}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor={fieldId('job')}>
              Job
            </label>
            <select
              id={fieldId('job')}
              className={styles.control}
              value={jobId}
              onChange={(e) => {
                setJobId(e.target.value)
                // Attaching a job takes the chip slot, so the category goes.
                if (e.target.value) setCategory('')
              }}
            >
              <option value="">No job</option>
              {jobs.map((job) => (
                <option key={job.id} value={job.id}>
                  {job.role} · {job.company}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor={fieldId('category')}>
              Category
            </label>
            <select
              id={fieldId('category')}
              className={styles.control}
              value={category}
              disabled={hasJob}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="">No category</option>
              {taskCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
            {hasJob && (
              <p className={styles.hint}>The job takes the chip — no category needed.</p>
            )}
          </div>
        </div>

        <div className={styles.row}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor={fieldId('status')}>
              Status
            </label>
            <select
              id={fieldId('status')}
              className={styles.control}
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              {taskStatuses.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor={fieldId('priority')}>
              Priority
            </label>
            <select
              id={fieldId('priority')}
              className={styles.control}
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
            >
              {priorities.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor={fieldId('due')}>
            Due date
          </label>
          <input
            id={fieldId('due')}
            type="date"
            className={styles.control}
            value={dueOn}
            onChange={(e) => setDueOn(e.target.value)}
          />
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
            {saving ? 'Saving…' : 'Add task'}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
