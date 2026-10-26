import type { JobDetail } from '../types'
import { StatusPill } from './StatusPill'
import styles from './JobHeader.module.css'

interface Props {
  job: JobDetail
  onChangeStatus: (statusId: string) => void
}

// The job's qualifying line, rendered as the Toolbar's eyebrow: who the
// application is with, and where it stands — the two facts worth reading
// before the role itself.
//
// Everything rarer moved out: the dates, fit and posting into the rail's
// property list, Edit details into the Toolbar's actions. Stage stays inline
// because it is the page's most frequent edit by a distance.
export function JobHeader({ job, onChangeStatus }: Props) {
  return (
    <div className={styles.eyebrow}>
      <span className={styles.company}>{job.company}</span>
      <StatusPill statusId={job.status} onChange={onChangeStatus} />
    </div>
  )
}
