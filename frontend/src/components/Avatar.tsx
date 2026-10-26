import styles from './Avatar.module.css'

interface Props {
  /** Full name; the initials are derived from it. */
  name: string
}

// A person, at a glance. Navy rather than colour-coded: an avatar stands for a
// person, and a person isn't at a pipeline stage — the pipeline hues are the
// only colours in the app allowed to carry meaning. Same tokens as the account
// avatar in the top bar.
//
// Decorative by definition — the name it stands for is always rendered next to
// it, so this is hidden from assistive tech rather than read out twice.
export function Avatar({ name }: Props) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')

  return (
    <span className={styles.avatar} aria-hidden>
      {initials || '?'}
    </span>
  )
}
