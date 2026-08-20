import { useCallback, useEffect, useState } from 'react'
import type { Contact, ContactDraft, JobDetail, JobPatch, Note, Question } from './types'
import {
  ApiError,
  createContact,
  createNote,
  createQuestion,
  deleteContact,
  deleteNote,
  deleteQuestion,
  getJob,
  patchContact,
  patchJob,
  patchQuestion,
} from './api/client'

/** `missing` is a 404 — a real state (a deleted or mistyped job), and a
 *  different screen from `error`, which means the server didn't answer. */
export type DetailLoad = 'loading' | 'ready' | 'error' | 'missing'

export interface JobDetailStore {
  job: JobDetail | null
  load: DetailLoad
  reload: () => void
  /** Mirror an edit the shell already saved (a stage move, the edit dialog), so
   *  the page doesn't refetch to show a change it just made. */
  applyLocal: (patch: Partial<JobDetail>) => void
  onSaveDetails: (patch: JobPatch) => Promise<void>
  onAddNote: (text: string) => Promise<void>
  onDeleteNote: (note: Note) => void
  onAddQuestion: (text: string) => Promise<void>
  onAnswerQuestion: (question: Question, answer: string) => Promise<void>
  onReopenQuestion: (question: Question) => void
  onDeleteQuestion: (question: Question) => void
  onSaveContact: (draft: ContactDraft, existing?: Contact) => Promise<void>
  onLinkContact: (contact: Contact) => Promise<void>
  onUnlinkContact: (contact: Contact) => Promise<void>
}

// Everything the job page owns: the detail payload (long-form fields, contacts,
// notes, questions) and the edits to it. Tasks are deliberately absent — they
// live in the shell's store so the job page, Today and the sidebar all read one
// list and every existing task handler works here unchanged.
//
// The split runs the same way for the job's own fields: the shell owns what the
// board shows (role, company, stage, dates) and PATCHes those; this hook owns
// the fields only the job page can see, and mirrors the shell's edits locally.
export function useJobDetail(id: number): JobDetailStore {
  const [job, setJob] = useState<JobDetail | null>(null)
  const [load, setLoad] = useState<DetailLoad>('loading')
  const [attempt, setAttempt] = useState(0)

  const reload = useCallback(() => {
    setLoad('loading')
    setAttempt((n) => n + 1)
  }, [])

  // Refetches whenever the id changes — navigating between two job pages
  // remounts nothing, so the id is what drives this, not mounting.
  useEffect(() => {
    let cancelled = false
    setLoad('loading')
    getJob(id)
      .then((detail) => {
        if (cancelled) return
        setJob(detail)
        setLoad('ready')
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setJob(null)
        setLoad(err instanceof ApiError && err.status === 404 ? 'missing' : 'error')
      })
    return () => {
      cancelled = true
    }
  }, [id, attempt])

  // Merge a patch into the local record. Used both to mirror the shell's saves
  // and as the optimistic half of this hook's own.
  const applyLocal = useCallback((patch: Partial<JobDetail>) => {
    setJob((prev) => (prev ? { ...prev, ...patch } : prev))
  }, [])

  // Save the job page's own fields (the role summary and fit). Rejects on
  // failure so the editor can stay open with the typing intact.
  const onSaveDetails = useCallback(
    async (patch: JobPatch) => {
      await patchJob(id, patch)
      applyLocal(patch)
    },
    [id, applyLocal],
  )

  // Notes and questions are prepended: both models sort newest-first, so a new
  // row belongs at the top of the list the server would send back.
  const onAddNote = useCallback(
    async (text: string) => {
      const note = await createNote({ job: id, text })
      setJob((prev) => (prev ? { ...prev, notes: [note, ...prev.notes] } : prev))
    },
    [id],
  )

  // Optimistic delete: drop the row now, re-insert it if the DELETE fails.
  const onDeleteNote = useCallback((note: Note) => {
    setJob((prev) =>
      prev ? { ...prev, notes: prev.notes.filter((n) => n.id !== note.id) } : prev,
    )
    deleteNote(note.id).catch(() =>
      setJob((prev) =>
        prev && !prev.notes.some((n) => n.id === note.id)
          ? { ...prev, notes: [note, ...prev.notes] }
          : prev,
      ),
    )
  }, [])

  const onAddQuestion = useCallback(
    async (text: string) => {
      const question = await createQuestion({ job: id, text })
      setJob((prev) =>
        prev ? { ...prev, questions: [question, ...prev.questions] } : prev,
      )
    },
    [id],
  )

  // Replace one question in place, whatever changed about it.
  const putQuestion = useCallback((next: Question) => {
    setJob((prev) =>
      prev
        ? { ...prev, questions: prev.questions.map((q) => (q.id === next.id ? next : q)) }
        : prev,
    )
  }, [])

  // Answering IS resolving: the answer and the stamp are one edit, so a question
  // can't sit answered-but-open. Awaited, so a failure keeps the editor up.
  const onAnswerQuestion = useCallback(
    async (question: Question, answer: string) => {
      const saved = await patchQuestion(question.id, {
        answer,
        resolved_at: new Date().toISOString(),
      })
      putQuestion(saved)
    },
    [putQuestion],
  )

  // Reopening clears the stamp and keeps the answer — what was learned is still
  // true, the question just isn't closed any more. Optimistic, with revert.
  const onReopenQuestion = useCallback(
    (question: Question) => {
      putQuestion({ ...question, resolved_at: null })
      patchQuestion(question.id, { resolved_at: null }).catch(() =>
        putQuestion(question),
      )
    },
    [putQuestion],
  )

  const onDeleteQuestion = useCallback((question: Question) => {
    setJob((prev) =>
      prev
        ? { ...prev, questions: prev.questions.filter((q) => q.id !== question.id) }
        : prev,
    )
    deleteQuestion(question.id).catch(() =>
      setJob((prev) =>
        prev && !prev.questions.some((q) => q.id === question.id)
          ? { ...prev, questions: [question, ...prev.questions] }
          : prev,
      ),
    )
  }, [])

  // --- Contacts -------------------------------------------------------
  // The M2M lives on Contact, so all three of these write through
  // /api/contacts/ and always send the COMPLETE `jobs` list — the API replaces
  // it, and a partial list would quietly detach the person from other jobs.

  const putContact = useCallback((next: Contact) => {
    setJob((prev) =>
      prev
        ? {
            ...prev,
            contacts: prev.contacts.some((c) => c.id === next.id)
              ? prev.contacts.map((c) => (c.id === next.id ? next : c))
              : [...prev.contacts, next],
          }
        : prev,
    )
  }, [])

  // Create a person on this job, or save an edit to one already on it.
  const onSaveContact = useCallback(
    async (draft: ContactDraft, existing?: Contact) => {
      const saved = existing
        ? await patchContact(existing.id, draft)
        : await createContact(draft)
      putContact(saved)
    },
    [putContact],
  )

  // Attach someone who already exists on another job, keeping their other links.
  const onLinkContact = useCallback(
    async (contact: Contact) => {
      if (contact.jobs.includes(id)) return
      const saved = await patchContact(contact.id, { jobs: [...contact.jobs, id] })
      putContact(saved)
    },
    [id, putContact],
  )

  // Detach from THIS job, leaving the person on their other jobs. If this was
  // their last one, delete them outright: with no contacts screen anywhere, an
  // unlinked person would just be invisible clutter forever.
  const onUnlinkContact = useCallback(
    async (contact: Contact) => {
      const remaining = contact.jobs.filter((jobId) => jobId !== id)
      if (remaining.length === 0) {
        await deleteContact(contact.id)
      } else {
        await patchContact(contact.id, { jobs: remaining })
      }
      setJob((prev) =>
        prev
          ? { ...prev, contacts: prev.contacts.filter((c) => c.id !== contact.id) }
          : prev,
      )
    },
    [id],
  )

  return {
    job,
    load,
    reload,
    applyLocal,
    onSaveDetails,
    onAddNote,
    onDeleteNote,
    onAddQuestion,
    onAnswerQuestion,
    onReopenQuestion,
    onDeleteQuestion,
    onSaveContact,
    onLinkContact,
    onUnlinkContact,
  }
}
