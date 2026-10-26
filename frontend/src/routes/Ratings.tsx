import { ChartBar } from '@phosphor-icons/react'
import { EmptyState } from '../components/EmptyState'
import { Toolbar } from '../components/Toolbar'
import { useTrackerContext } from '../useTracker'
import styles from './Pane.module.css'

// A placeholder destination so the Ratings nav item leads somewhere honest.
// The chart itself isn't designed yet; a nav item that silently does nothing
// would be worse than a page that says what is coming.
//
// No CTA, for the same reason the Writing Library's empty state has none:
// there is genuinely no next step in the app until the chart exists.
export function Ratings() {
  const { onOpenNav } = useTrackerContext()

  return (
    <>
      <Toolbar title="Ratings" onOpenNav={onOpenNav} />

      <div className={styles.content}>
        <EmptyState
          icon={<ChartBar size={22} />}
          title="Ratings are coming"
          message="Fit scores are already on your applications. The chart that ranks them against each other is the next thing to build here."
        />
      </div>
    </>
  )
}
