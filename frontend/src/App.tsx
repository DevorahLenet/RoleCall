import { useCallback, useEffect, useState } from 'react'
import type { Job, Task } from './types'
import { deleteTask, getJobs, getTasks, patchTask } from './api/client'
import { TopNav } from './components/TopNav'
import { PipelineBand } from './components/PipelineBand'
import { TodaySection } from './components/TodaySection'
import styles from './App.module.css'

type LoadState = 'loading' | 'ready' | 'error'

// Root screen: loads jobs + tasks once, then renders the pipeline band and the
// Today list. Task edits are optimistic (see the handlers below).
export default function App() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [load, setLoad] = useState<LoadState>('loading')

  // Load jobs and tasks together on mount; `cancelled` guards against a state
  // update after unmount (StrictMode double-invokes effects in dev).
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

  // Optimistic title rename; revert to the old title if the PATCH fails.
  const onEditTitle = useCallback(
    (task: Task, title: string) => {
      const previous = task.title
      patchLocal(task.id, { title })
      patchTask(task.id, { title }).catch(() =>
        patchLocal(task.id, { title: previous }),
      )
    },
    [patchLocal],
  )

  // Optimistic delete: drop the row now, DELETE the server, re-insert on failure.
  const onDeleteTask = useCallback((task: Task) => {
    setTasks((prev) => prev.filter((t) => t.id !== task.id))
    deleteTask(task.id).catch(() =>
      setTasks((prev) =>
        prev.some((t) => t.id === task.id) ? prev : [...prev, task],
      ),
    )
  }, [])

  return (
    <>
      <TopNav />
      {load === 'ready' && (
        <>
          <PipelineBand jobs={jobs} />
          <TodaySection
            tasks={tasks}
            onToggleDone={onToggleDone}
            onChangePriority={onChangePriority}
            onEditTitle={onEditTitle}
            onDeleteTask={onDeleteTask}
          />
        </>
      )}
      {load === 'loading' && <p className={styles.message}>Loading your day…</p>}
      {load === 'error' && (
        <p className={styles.message}>
          Couldn’t reach the server. Is the backend running on port 8000?
        </p>
      )}
    </>
  )
}
