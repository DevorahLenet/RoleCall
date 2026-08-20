import { useCallback, useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import type { Job, JobDetail, JobPatch, NewJob, NewTask, Task, TaskPatch } from './types'
import {
  createJob,
  createTask,
  deleteTask,
  getJobs,
  getTasks,
  patchJob,
  patchTask,
} from './api/client'

export type LoadState = 'loading' | 'ready' | 'error'

export interface Tracker {
  jobs: Job[]
  tasks: Task[]
  load: LoadState
  reload: () => void
  onCreateJob: (input: NewJob) => Promise<Job>
  onUpdateJob: (job: Job, patch: JobPatch) => Promise<JobDetail>
  onChangeJobStatus: (job: Job, statusId: string) => void
  onCreateTask: (input: NewTask) => Promise<Task>
  onUpdateTask: (task: Task, patch: TaskPatch) => Promise<Task>
  onToggleDone: (task: Task) => void
  onChangePriority: (task: Task, priorityId: string) => void
  onChangeTaskStatus: (task: Task, statusId: string) => void
  onDeleteTask: (task: Task) => void
}

// Owns all app data and the optimistic task edits. Lives in the shell rather than
// on a screen because the sidebar's pipeline counts and the Today list read the
// same jobs/tasks — one fetch feeds both.
export function useTracker(): Tracker {
  const [jobs, setJobs] = useState<Job[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [load, setLoad] = useState<LoadState>('loading')
  // Bumped by reload() to re-run the fetch effect.
  const [attempt, setAttempt] = useState(0)

  const reload = useCallback(() => {
    setLoad('loading')
    setAttempt((n) => n + 1)
  }, [])

  // Load jobs and tasks together; `cancelled` guards against a state update after
  // unmount (StrictMode double-invokes effects in dev).
  useEffect(() => {
    let cancelled = false
    Promise.all([getJobs(), getTasks()])
      .then(([j, t]) => {
        if (cancelled) return
        setJobs(j)
        setTasks(t)
        setLoad('ready')
      })
      .catch(() => {
        if (!cancelled) setLoad('error')
      })
    return () => {
      cancelled = true
    }
  }, [attempt])

  // Add a job from the New application form. Unlike the task edits this is not
  // optimistic: a card needs the id the server assigns before it can key a React
  // list or accept a later PATCH. The promise is returned rather than swallowed
  // so the dialog can stay open and show the failure itself.
  const onCreateJob = useCallback(async (input: NewJob) => {
    const job = await createJob(input)
    setJobs((prev) => [...prev, job])
    return job
  }, [])

  // Save an edit to a job's board-visible fields (the Edit application dialog).
  // Awaited rather than optimistic, like create, so a failure keeps the dialog
  // open with the typing intact.
  //
  // The list is merged from the SAVED record rather than from the patch that was
  // sent, because the API normalises as it writes — a cleared company comes back
  // as "undisclosed" — and only the board-visible keys are taken, so the list
  // keeps its slim shape. The full record is returned for the job page to mirror.
  const onUpdateJob = useCallback(async (job: Job, patch: JobPatch) => {
    const saved = await patchJob(job.id, patch)
    const { role, company, status, applied_on, posting_url } = saved
    setJobs((prev) =>
      prev.map((j) =>
        j.id === job.id ? { ...j, role, company, status, applied_on, posting_url } : j,
      ),
    )
    return saved
  }, [])

  // Move a job to another pipeline stage, optimistically: the card jumps columns
  // immediately and snaps back if the PATCH fails. The sidebar counts and the
  // pipeline band read the same state, so they follow for free.
  const onChangeJobStatus = useCallback((job: Job, statusId: string) => {
    if (statusId === job.status) return
    const previous = job.status
    const setStatus = (status: string) =>
      setJobs((prev) => prev.map((j) => (j.id === job.id ? { ...j, status } : j)))

    setStatus(statusId)
    patchJob(job.id, { status: statusId }).catch(() => setStatus(previous))
  }, [])

  // Add a task from the New task form. Like onCreateJob this is not optimistic:
  // the row needs the server's id, and the job chip needs the company/stage the
  // server resolves from the FK. Prepending matches the API's `-created_at`
  // ordering, so the new task lands where a reload would put it. The promise is
  // returned rather than swallowed so the dialog can show its own failure.
  const onCreateTask = useCallback(async (input: NewTask) => {
    const task = await createTask(input)
    setTasks((prev) => [task, ...prev])
    return task
  }, [])

  // Patch one task in local state only — the optimistic half of an edit.
  const patchLocal = useCallback((id: number, patch: Partial<Task>) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)))
  }, [])

  // Optimistic: update the UI now, PATCH the server, revert the field on failure.
  const onToggleDone = useCallback(
    (task: Task) => {
      const next = !task.is_done
      patchLocal(task.id, { is_done: next })
      patchTask(task.id, { is_done: next }).catch(() =>
        patchLocal(task.id, { is_done: task.is_done }),
      )
    },
    [patchLocal],
  )

  // Optimistic priority change, with the same revert-on-failure pattern.
  const onChangePriority = useCallback(
    (task: Task, priorityId: string) => {
      const previous = task.priority
      patchLocal(task.id, { priority: priorityId })
      patchTask(task.id, { priority: priorityId }).catch(() =>
        patchLocal(task.id, { priority: previous }),
      )
    },
    [patchLocal],
  )

  // Move a task to another status group, optimistically: the row jumps groups
  // under the pointer that dragged it and snaps back if the PATCH fails. This is
  // the drag-and-drop path; the edit dialog's Status select goes through
  // onUpdateTask instead, since a dialog can wait for the server.
  const onChangeTaskStatus = useCallback(
    (task: Task, statusId: string) => {
      if (statusId === task.status) return
      patchLocal(task.id, { status: statusId })
      patchTask(task.id, { status: statusId }).catch(() =>
        patchLocal(task.id, { status: task.status }),
      )
    },
    [patchLocal],
  )

  // Save an edit from the task dialog. Unlike the row's own edits this is
  // awaited rather than optimistic, for the same reason as onUpdateJob: a
  // failure has somewhere to be shown, so the dialog stays open with the typing
  // intact. The list is merged from the SAVED record because the API resolves
  // the job context (`job_company`/`job_status`) the row chip needs — re-pointing
  // a task at another job changes a chip the patch itself never mentions.
  const onUpdateTask = useCallback(async (task: Task, patch: TaskPatch) => {
    const saved = await patchTask(task.id, patch)
    setTasks((prev) => prev.map((t) => (t.id === task.id ? saved : t)))
    return saved
  }, [])

  // Optimistic delete: drop the row now, DELETE the server, re-insert on failure.
  const onDeleteTask = useCallback((task: Task) => {
    setTasks((prev) => prev.filter((t) => t.id !== task.id))
    deleteTask(task.id).catch(() =>
      setTasks((prev) =>
        prev.some((t) => t.id === task.id) ? prev : [...prev, task],
      ),
    )
  }, [])

  return {
    jobs,
    tasks,
    load,
    reload,
    onCreateJob,
    onUpdateJob,
    onChangeJobStatus,
    onCreateTask,
    onUpdateTask,
    onToggleDone,
    onChangePriority,
    onChangeTaskStatus,
    onDeleteTask,
  }
}

/** What the shell hands down: the data hook plus the two app-level actions every
 *  screen's Toolbar can offer — the mobile drawer and the New application form. */
export interface ShellContext extends Tracker {
  onOpenNav: () => void
  /** Opens the New application dialog, which the shell owns so the button works
   *  the same from any screen. */
  onNewApplication: () => void
}

// Typed accessor for the shell context, so screens don't reach for `any`.
export function useTrackerContext(): ShellContext {
  return useOutletContext<ShellContext>()
}
