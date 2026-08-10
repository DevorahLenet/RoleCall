import { BookOpen, Plus } from '@phosphor-icons/react'
import { Button } from '../components/Button'
import { Toolbar } from '../components/Toolbar'
import { EmptyState } from '../components/EmptyState'
import { useTrackerContext } from '../useTracker'
import styles from './Pane.module.css'

// Writing Library stub — the reusable pool of cover letters, blurbs and impact
// statements. Not designed yet; this holds the route and sets expectations.
export function WritingLibrary() {
  const { onOpenNav } = useTrackerContext()

  return (
    <>
      <Toolbar
        title="Writing Library"
        onOpenNav={onOpenNav}
        actions={
          <Button variant="primary" icon={<Plus size={15} weight="bold" />}>
            New piece
          </Button>
        }
      />
      <div className={styles.content}>
        <EmptyState
          icon={<BookOpen size={22} />}
          title="Nothing saved yet"
          message="Your reusable cover letters, blurbs and impact statements will collect here, so you can pull from them instead of writing every application from scratch."
          action={
            <Button variant="secondary" icon={<Plus size={15} weight="bold" />}>
              Save your first piece
            </Button>
          }
        />
      </div>
    </>
  )
}
