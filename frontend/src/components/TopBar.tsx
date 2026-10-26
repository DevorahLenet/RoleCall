import { MagnifyingGlass, Plus } from '@phosphor-icons/react'
import { Button } from './Button'
import styles from './TopBar.module.css'

interface Props {
  /** Opens the shell's New application dialog — the one global action. */
  onNewApplication: () => void
}

// The app-wide top bar: a pale strip that, with the sidebar, frames the page
// sheet below it. GLOBAL actions live here; per-screen actions stay in each
// screen's Toolbar, which is the whole reason this bar exists separately.
//
// Left is the ⌘K search / jump field, right is New application and the account.
export function TopBar({ onNewApplication }: Props) {
  return (
    <div className={styles.bar}>
      {/* Rendered disabled until the palette is designed: aria-disabled rather
          than `disabled` so it stays discoverable to a screen reader, with no
          handler and a not-allowed cursor so it never looks clickable and then
          does nothing. */}
      <button
        type="button"
        className={styles.cmdk}
        aria-disabled="true"
        title="Search is coming soon"
      >
        <MagnifyingGlass className={styles.cmdkIcon} size={16} aria-hidden />
        <span className={styles.cmdkLabel}>Search or jump to…</span>
        <kbd className={styles.key}>⌘K</kbd>
      </button>

      <div className={styles.right}>
        <Button
          variant="primary"
          size="md"
          icon={<Plus size={15} weight="bold" />}
          onClick={onNewApplication}
        >
          New application
        </Button>

        {/* An identity marker, not a control: there is no account menu to open
            yet, and the one thing this pass was firm about is that nothing may
            look clickable and do nothing. It becomes a button when it has a
            menu to show. */}
        <span className={styles.me} role="img" aria-label="Signed in as Devorah">
          D
        </span>
      </div>
    </div>
  )
}
