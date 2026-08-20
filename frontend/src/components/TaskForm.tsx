import { useId, useState } from 'react'
import type { FormEvent } from 'react'
import type { Job, NewTask, Task } from '../types'
import { defaultTaskStatusId, taskStatuses } from '../design-system/taskStatuses'
import { taskCategories } from '../design-system/categories'
import { defaultPriorityId, priorities } from '../design-system/priorities'
import { Button } from './Button'
import { Dialog } from './Dialog'
import { Toggle } from './Toggle'
import styles from './Form.module.css'

interface Props {
  jobs: Job[]
  /** The task being edited. Omit to create a new one. */
  task?: Task
  /** Job a NEW task is created against, so a task added from a job page is born
   *  attached to it. Ignored when editing, which starts from the task's own job. */
  initialJobId?: number
  /** Persists the form. Create POSTs, edit PATCHes; either way a rejection keeps
   *  the dialog open with the typing intact. */
  onSave: (input: NewTask) => Promise<unknown>
  onClose: () => void
}

// The one form for a task's own fields — title, the job or category it belongs
// to, status, priority and a due date. It both creates (from Today's header or
// its empty state) and edits (from a row's menu), because the fields and their
// rules are the same either way; only the verb differs.
//
// Job and category are mutually exclusive (the model's "never both"), so picking
// a job disables and clears the category select.
//
// Completion appears only when editing. A task you are creating isn't done, so
// there is nothing to switch; an existing one has a state worth correcting from
// here as well as from the row's checkbox.
export function TaskForm({ jobs, task, initialJobId, onSave, onClose }: Props) {
  const editing = task !== undefined
  const [title, setTitle] = useState(task?.title ?? '')
  const [jobId, setJobId] = useState(String(task?.job ?? initialJobId ?? ''))
  const [category, setCategory] = useState(task?.category ?? '')
  const [status, setStatus] = useState(task?.status ?? defaultTaskStatusId)
  const [priority, setPriority] = useState(task?.priority ?? defaultPriorityId)
  const [dueOn, setDueOn] = useState(task?.due_on ?? '')
  const [isDone, setIsDone] = useState(task?.is_done ?? false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // One id root per form instance, so every label points at its own control.
  const id = useId()
  const fieldId = (name: string) => `${id}-${name}`

  const hasJob = jobId !== ''
  const canSave = title.trim() !== '' && !saving

  // Save and close on success; on failure keep the dialog (and the user's
  // typing) up and explain what happened.
  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!canSave) return
    setSaving(true)
    setError(null)
    try {
      await onSave({
        title: title.trim(),
        status,
        priority,
        job: hasJob ? Number(jobId) : null,
        // Never both: a job-attached task sends an empty category.
        category: hasJob ? '' : category,
        due_on: dueOn || null,
        // Only an edit carries completion — see the note on the component.
        ...(editing ? { is_done: isDone } : {}),
      })
      onClose()
    } catch {
      setError('Couldn’t save the task. Check the backend is running, then try again.')
      setSaving(false)
    }
  }

  return (
    <Dialog title={editing ? 'Edit task' : 'New task'} onClose={onClose}>
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

        {editing && (
          <div className={styles.field}>
            <span className={styles.label}>Completion</span>
            <Toggle checked={isDone} onChange={setIsDone} label="Task is done" />
          </div>
        )}

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
            {saving ? 'Saving…' : editing ? 'Save changes' : 'Add task'}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
