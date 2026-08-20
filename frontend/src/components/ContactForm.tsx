import { useEffect, useId, useState } from 'react'
import type { FormEvent } from 'react'
import type { Contact, ContactDraft } from '../types'
import { getContacts } from '../api/client'
import { Button } from './Button'
import { Dialog } from './Dialog'
import form from './Form.module.css'
import styles from './ContactForm.module.css'

interface Props {
  jobId: number
  /** The person being edited; omit to put someone new on this job. */
  contact?: Contact
  /** Already on this job — excluded from the "link someone" picker. */
  linkedIds: number[]
  onSave: (draft: ContactDraft, existing?: Contact) => Promise<void>
  onLink: (contact: Contact) => Promise<void>
  onUnlink: (contact: Contact) => Promise<void>
  onClose: () => void
}

// Add a person to this job, edit one already on it, or link someone who exists
// on another job. That third case is why this is a dialog rather than another
// inline field: one person appears on several applications, and typing them in
// twice would leave you with two records of the same recruiter.
export function ContactForm({
  jobId,
  contact,
  linkedIds,
  onSave,
  onLink,
  onUnlink,
  onClose,
}: Props) {
  const editing = contact !== undefined
  const [firstName, setFirstName] = useState(contact?.first_name ?? '')
  const [lastName, setLastName] = useState(contact?.last_name ?? '')
  const [email, setEmail] = useState(contact?.email ?? '')
  const [phone, setPhone] = useState(contact?.phone ?? '')
  const [description, setDescription] = useState(contact?.description ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // People on other jobs, offered as a picker. Fetched only when adding, and a
  // failure just means no picker — typing someone in still works.
  const [others, setOthers] = useState<Contact[]>([])
  const [pickedId, setPickedId] = useState('')

  const id = useId()
  const fieldId = (name: string) => `${id}-${name}`

  // Depends on the joined ids, not the array: `linkedIds` is a fresh array on
  // every render, and depending on it directly would refetch in a loop.
  const linkedKey = linkedIds.join(',')
  useEffect(() => {
    if (editing) return
    let cancelled = false
    getContacts()
      .then((all) => {
        if (cancelled) return
        const linked = new Set(linkedKey ? linkedKey.split(',').map(Number) : [])
        setOthers(all.filter((c) => !linked.has(c.id)))
      })
      .catch(() => {
        // No picker, no problem — the fields below still work.
      })
    return () => {
      cancelled = true
    }
  }, [editing, linkedKey])

  const linking = pickedId !== ''
  const canSave = (linking || firstName.trim() !== '') && !saving

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!canSave) return
    setSaving(true)
    setError(null)

    try {
      if (linking) {
        const picked = others.find((c) => c.id === Number(pickedId))
        if (picked) await onLink(picked)
      } else {
        await onSave(
          {
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            email: email.trim(),
            phone: phone.trim(),
            description: description.trim(),
            links: contact?.links ?? [],
            // The COMPLETE job list, always: the API replaces it rather than
            // appending, so anything short would detach them from other jobs.
            jobs: contact ? contact.jobs : [jobId],
          },
          contact,
        )
      }
      onClose()
    } catch {
      setError('Couldn’t save that. Check the backend is running, then try again.')
      setSaving(false)
    }
  }

  // Detaches from this job only — unless it was their last, which useJobDetail
  // treats as a delete, since an unlinked person has no surface anywhere.
  async function remove() {
    if (!contact || saving) return
    setSaving(true)
    setError(null)
    try {
      await onUnlink(contact)
      onClose()
    } catch {
      setError('Couldn’t remove them. Check the backend is running, then try again.')
      setSaving(false)
    }
  }

  return (
    <Dialog title={editing ? 'Edit contact' : 'Add a contact'} onClose={onClose}>
      <form className={form.form} onSubmit={onSubmit}>
        {!editing && others.length > 0 && (
          <>
            <div className={form.field}>
              <label className={form.label} htmlFor={fieldId('existing')}>
                Someone you already track
              </label>
              <select
                id={fieldId('existing')}
                className={form.control}
                value={pickedId}
                onChange={(e) => setPickedId(e.target.value)}
              >
                <option value="">Add someone new</option>
                {others.map((c) => (
                  <option key={c.id} value={c.id}>
                    {`${c.first_name} ${c.last_name}`.trim()}
                    {c.description ? ` · ${c.description}` : ''}
                  </option>
                ))}
              </select>
              <p className={form.hint}>
                Linking keeps one record of them across every job they touch.
              </p>
            </div>
            {!linking && <p className={styles.divider}>or</p>}
          </>
        )}

        {/* Picking an existing person replaces the form — there is nothing to
            fill in then, only a link to make. */}
        {!linking && (
          <>
            <div className={form.row}>
              <div className={form.field}>
                <label className={form.label} htmlFor={fieldId('first')}>
                  First name
                </label>
                <input
                  id={fieldId('first')}
                  className={form.control}
                  value={firstName}
                  required
                  maxLength={100}
                  placeholder="Rivka"
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>

              <div className={form.field}>
                <label className={form.label} htmlFor={fieldId('last')}>
                  Last name
                </label>
                <input
                  id={fieldId('last')}
                  className={form.control}
                  value={lastName}
                  maxLength={100}
                  placeholder="Stern"
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
            </div>

            <div className={form.field}>
              <label className={form.label} htmlFor={fieldId('role')}>
                Who they are
              </label>
              <input
                id={fieldId('role')}
                className={form.control}
                value={description}
                placeholder="Recruiter"
                onChange={(e) => setDescription(e.target.value)}
              />
              <p className={form.hint}>
                Describes the person, not this job — it shows wherever they appear.
              </p>
            </div>

            <div className={form.row}>
              <div className={form.field}>
                <label className={form.label} htmlFor={fieldId('email')}>
                  Email
                </label>
                <input
                  id={fieldId('email')}
                  type="email"
                  className={form.control}
                  value={email}
                  placeholder="rivka@example.com"
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className={form.field}>
                <label className={form.label} htmlFor={fieldId('phone')}>
                  Phone
                </label>
                <input
                  id={fieldId('phone')}
                  type="tel"
                  className={form.control}
                  value={phone}
                  maxLength={50}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>
          </>
        )}

        {error && (
          <p className={form.error} role="alert">
            {error}
          </p>
        )}

        <div className={styles.foot}>
          {editing && (
            <Button variant="danger" size="sm" onClick={remove} disabled={saving}>
              Remove from this job
            </Button>
          )}
          <div className={styles.actions}>
            <Button variant="ghost" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={!canSave}>
              {saving ? 'Saving…' : linking ? 'Link to this job' : 'Save'}
            </Button>
          </div>
        </div>
      </form>
    </Dialog>
  )
}
