import { useState } from 'react'
import { PencilSimple, Plus } from '@phosphor-icons/react'
import { useNavigate, useParams } from 'react-router-dom'
import type { NewJob, NewTask, Task } from '../types'
import { Button } from '../components/Button'
import { ContactList } from '../components/ContactList'
import { JobFacts } from '../components/JobFacts'
import { JobForm } from '../components/JobForm'
import { JobHeader } from '../components/JobHeader'
import { JobSection } from '../components/JobSection'
import { NoteList } from '../components/NoteList'
import { QuestionList } from '../components/QuestionList'
import { SkeletonRows } from '../components/Skeleton'
import { TaskForm } from '../components/TaskForm'
import { TaskRow } from '../components/TaskRow'
import { Toolbar } from '../components/Toolbar'
import { getPriority } from '../design-system/priorities'
import { useJobDetail } from '../useJobDetail'
import { useTrackerContext } from '../useTracker'
import section from '../components/JobSection.module.css'
import styles from './JobDetail.module.css'

// The per-job workspace: where one application stands, and what is outstanding
// on it. Today is the cross-job "what do I do now"; this page is "what is the
// state of this one".
//
// The page is split by KIND of information, which is what makes it readable:
// the main column is work you act on (tasks, then the log, then open questions)
// and the rail is reference you only read (the facts, the people). Three header
// sizes — 20px role, 15px sections, 11px rail eyebrows — carry the hierarchy.
// No counts anywhere: section headers are labels, not a dashboard.
export function JobDetail() {
  const params = useParams()
  const navigate = useNavigate()
  const id = Number(params.id)
  const {
    jobs,
    tasks,
    onOpenNav,
    onUpdateJob,
    onChangeJobStatus,
    onCreateTask,
    onUpdateTask,
    onToggleDone,
    onChangePriority,
    onDeleteTask,
  } = useTrackerContext()
  const detail = useJobDetail(id)
  const [editOpen, setEditOpen] = useState(false)
  // The task dialog, shared with Today: `new` for the header button, `edit`
  // for a row's menu.
  const [taskForm, setTaskForm] = useState<
    { mode: 'new' } | { mode: 'edit'; task: Task } | null
  >(null)
  const job = detail.job

  // Tasks come from the shell's store rather than this page's fetch, so the
  // sidebar, Today and this list read one set of rows and every existing task
  // handler works here unchanged.
  //
  // Sorted by priority rank alone. Completion is deliberately not a sort key,
  // for the same reason as on Today: a row that jumps the moment you check it
  // pulls itself out from under the cursor. Sort is stable, so tasks at equal
  // rank keep the API's newest-first order.
  const jobTasks = tasks
    .filter((task) => task.job === id)
    .sort((a, b) => getPriority(a.priority).rank - getPriority(b.priority).rank)

  // Both saves go through the dialog's one onSave, exactly as on Today. A task
  // created here is born attached to this job (TaskForm's initialJobId), which
  // also means it carries no category — the model's "never both".
  async function saveTask(input: NewTask) {
    if (taskForm?.mode === 'edit') await onUpdateTask(taskForm.task, input)
    else await onCreateTask(input)
  }

  // Stage is the page's most frequent edit. The shell owns the PATCH so the
  // board, the sidebar counts and the pipeline band all follow; this page only
  // mirrors the change into its own copy of the record.
  function changeStatus(statusId: string) {
    if (!job) return
    onChangeJobStatus(job, statusId)
    detail.applyLocal({ status: statusId })
  }

  // Same split for the rest of the job's fields: one PATCH through the shell,
  // then mirrored locally — from the saved record rather than the submitted one,
  // so any normalising the API did on the way in shows here too. A rejection
  // travels back to the dialog, which stays open with the typing intact.
  async function saveEdit(input: NewJob) {
    if (!job) return
    detail.applyLocal(await onUpdateJob(job, input))
  }

  // The title is the role, so it cannot be known until the job has loaded —
  // these stand in rather than leaving the bar blank.
  const title = job?.role ?? (detail.load === 'missing' ? 'Not found' : 'Loading…')

  return (
    <>
      {/* Edit details lives here rather than in the page body, leaving the
          header to the two facts worth reading first. The writing drawer's
          trigger will join it in this slot when the library lands. */}
      <Toolbar
        title={title}
        backTo={{ to: '/jobs', label: 'Back to the jobs board' }}
        onOpenNav={onOpenNav}
        actions={
          job && (
            <Button
              variant="secondary"
              icon={<PencilSimple size={15} />}
              onClick={() => setEditOpen(true)}
            >
              Edit details
            </Button>
          )
        }
      />

      <div className={styles.content}>
        {detail.load === 'loading' && (
          <div role="status" aria-live="polite">
            <span className="sr-only">Loading this application…</span>
            <div className={styles.skeletonHead}>
              <SkeletonRows count={1} />
            </div>
            <SkeletonRows count={4} />
          </div>
        )}

        {detail.load === 'error' && (
          <div className={styles.error} role="alert">
            <p className={styles.errorTitle}>Couldn’t reach the server</p>
            <p className={styles.errorBody}>
              Check that the backend is running on port 8000, then try again.
            </p>
            <Button variant="secondary" size="sm" onClick={detail.reload}>
              Try again
            </Button>
          </div>
        )}

        {/* A 404 is its own state, not a failure: the job was deleted, or the
            URL was mistyped. It offers the way back rather than a retry. */}
        {detail.load === 'missing' && (
          <div className={styles.error} role="alert">
            <p className={styles.errorTitle}>No such application</p>
            <p className={styles.errorBody}>
              It may have been deleted. The board has everything you are still
              tracking.
            </p>
            <Button variant="secondary" size="sm" onClick={() => navigate('/jobs')}>
              Back to the board
            </Button>
          </div>
        )}

        {detail.load === 'ready' && job && (
          <>
            <JobHeader job={job} onChangeStatus={changeStatus} />

            <div className={styles.body}>
              <div className={styles.main}>
                {/* Tasks lead: they are the part of the page you act on. The row
                    is Today's row component, not a second one — two task rows
                    would drift apart within a month. Its job chip is suppressed
                    because every row here belongs to the job in the title. */}
                <JobSection
                  title="Tasks"
                  action={
                    <Button
                      size="sm"
                      variant="ghost"
                      icon={<Plus size={14} weight="bold" />}
                      onClick={() => setTaskForm({ mode: 'new' })}
                    >
                      Add task
                    </Button>
                  }
                >
                  {jobTasks.length === 0 ? (
                    <p className={section.empty}>Nothing outstanding on this one yet.</p>
                  ) : (
                    <div className={section.rows}>
                      {jobTasks.map((task) => (
                        <TaskRow
                          key={task.id}
                          task={task}
                          showChip={false}
                          onToggleDone={onToggleDone}
                          onChangePriority={onChangePriority}
                          onEdit={(t) => setTaskForm({ mode: 'edit', task: t })}
                          onDeleteTask={onDeleteTask}
                        />
                      ))}
                    </div>
                  )}
                </JobSection>

                {/* The log comes before the open questions: it is the section
                    with traffic on it once a job is live, and a question is
                    usually raised by something that was just logged. */}
                <NoteList
                  notes={job.notes}
                  onAdd={detail.onAddNote}
                  onEdit={detail.onEditNote}
                  onDelete={detail.onDeleteNote}
                />

                <QuestionList
                  questions={job.questions}
                  onAdd={detail.onAddQuestion}
                  onAnswer={detail.onAnswerQuestion}
                  onReopen={detail.onReopenQuestion}
                  onDelete={detail.onDeleteQuestion}
                />
              </div>

              <aside className={styles.rail}>
                <JobFacts job={job} />
                <ContactList
                  jobId={id}
                  contacts={job.contacts}
                  onSave={detail.onSaveContact}
                  onLink={detail.onLinkContact}
                  onUnlink={detail.onUnlinkContact}
                />
              </aside>
            </div>
          </>
        )}
      </div>

      {/* The job's own fields, in the same dialog that creates one — the fields
          and their rules do not change between the two. */}
      {editOpen && job && (
        <JobForm job={job} onSave={saveEdit} onClose={() => setEditOpen(false)} />
      )}

      {/* The same task dialog Today uses — one form for a task's fields, opened
          here already pointed at this job. */}
      {taskForm && (
        <TaskForm
          jobs={jobs}
          task={taskForm.mode === 'edit' ? taskForm.task : undefined}
          initialJobId={id}
          onSave={saveTask}
          onClose={() => setTaskForm(null)}
        />
      )}
    </>
  )
}
