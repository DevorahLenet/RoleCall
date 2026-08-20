import type { JobDetail } from '../types'
import { StatusPill } from './StatusPill'
import styles from './JobHeader.module.css'

interface Props {
  job: JobDetail
  onChangeStatus: (statusId: string) => void
}

// The job's identity line: who it is with, and where it stands. Two facts, set
// large, directly under the role in the Toolbar.
//
// Everything else moved out — the dates, fit and posting into the rail's
// property list, Edit details into the Toolbar. What is left is the pair you
// want at a glance, and stage is inline because it is the page's most frequent
// edit by a distance.
export function JobHeader({ job, onChangeStatus }: Props) {
  return (
    <header className={styles.header}>
      <h2 className={styles.company}>{job.company}</h2>
      <StatusPill statusId={job.status} onChange={onChangeStatus} />
    </header>
  )
}
