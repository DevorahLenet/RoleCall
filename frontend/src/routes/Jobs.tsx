import { Briefcase, Plus } from '@phosphor-icons/react'
import { useSearchParams } from 'react-router-dom'
import { Button } from '../components/Button'
import { Toolbar } from '../components/Toolbar'
import { EmptyState } from '../components/EmptyState'
import { getJobStatus } from '../design-system/statuses'
import { useTrackerContext } from '../useTracker'
import styles from './Pane.module.css'

// Jobs is a stub: the list/board surface isn't designed yet, so this renders the
// filter the sidebar links to and an empty state. Closed jobs are a filter here,
// never a separate destination.
export function Jobs() {
  const { onOpenNav } = useTrackerContext()
  const [params] = useSearchParams()
  const status = getJobStatus(params.get('status'))

  return (
    <>
      <Toolbar
        title={status ? `Jobs · ${status.label}` : 'Jobs'}
        onOpenNav={onOpenNav}
        actions={
          <Button variant="primary" icon={<Plus size={15} weight="bold" />}>
            New application
          </Button>
        }
      />
      <div className={styles.content}>
        <EmptyState
          icon={<Briefcase size={22} />}
          title="The jobs board is coming"
          message="This is where your applications will live — filterable by stage, with closed roles tucked behind a filter rather than shut away in an archive."
          action={
            <Button variant="secondary" icon={<Plus size={15} weight="bold" />}>
              Add an application
            </Button>
          }
        />
      </div>
    </>
  )
}
