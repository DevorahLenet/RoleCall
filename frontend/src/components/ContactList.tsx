import { useState } from 'react'
import { EnvelopeSimple, Plus } from '@phosphor-icons/react'
import type { Contact, ContactDraft } from '../types'
import { Avatar } from './Avatar'
import { Button } from './Button'
import { ContactForm } from './ContactForm'
import { JobSection } from './JobSection'
import { TruncatedText } from './TruncatedText'
import section from './JobSection.module.css'
import styles from './ContactList.module.css'

interface Props {
  jobId: number
  contacts: Contact[]
  onSave: (draft: ContactDraft, existing?: Contact) => Promise<void>
  onLink: (contact: Contact) => Promise<void>
  onUnlink: (contact: Contact) => Promise<void>
}

// Who the humans on this application are — story 2's "relevant contacts at a
// glance". A rail block rather than a section: it is context for the work, not
// work in itself.
//
// A person can be on several jobs, so this never owns them outright: adding
// offers to link someone who already exists, and removing detaches from THIS
// job (see useJobDetail for the one case where it deletes).
export function ContactList({ jobId, contacts, onSave, onLink, onUnlink }: Props) {
  const [editing, setEditing] = useState<Contact | null>(null)
  const [adding, setAdding] = useState(false)

  function fullName(contact: Contact): string {
    return `${contact.first_name} ${contact.last_name}`.trim()
  }

  return (
    <JobSection
      title="Contacts"
      variant="rail"
      action={
        <Button
          size="sm"
          variant="ghost"
          icon={<Plus size={14} weight="bold" />}
          aria-label="Add a contact to this job"
          onClick={() => setAdding(true)}
        >
          Add
        </Button>
      }
    >
      {contacts.length === 0 ? (
        <p className={section.emptyRail}>
          No one yet — add the recruiter or hiring manager when you have a name.
        </p>
      ) : (
        <ul className={styles.list}>
          {contacts.map((contact) => {
            const name = fullName(contact)
            return (
              <li key={contact.id} className={styles.item}>
                <button
                  type="button"
                  className={styles.row}
                  onClick={() => setEditing(contact)}
                >
                  <Avatar name={name} />
                  <span className={styles.body}>
                    <TruncatedText text={name} className={styles.name} />
                    {contact.description && (
                      <TruncatedText
                        text={contact.description}
                        className={styles.meta}
                      />
                    )}
                  </span>
                  <span className="sr-only">Edit this contact</span>
                </button>

                {contact.email && (
                  <a
                    className={styles.mail}
                    href={`mailto:${contact.email}`}
                    aria-label={`Email ${name}`}
                  >
                    <EnvelopeSimple size={16} aria-hidden />
                  </a>
                )}
              </li>
            )
          })}
        </ul>
      )}

      {(adding || editing) && (
        <ContactForm
          jobId={jobId}
          contact={editing ?? undefined}
          linkedIds={contacts.map((c) => c.id)}
          onSave={onSave}
          onLink={onLink}
          onUnlink={onUnlink}
          onClose={() => {
            setAdding(false)
            setEditing(null)
          }}
        />
      )}
    </JobSection>
  )
}
