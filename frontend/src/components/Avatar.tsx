import styles from './Avatar.module.css'

interface Props {
  /** Full name; the initials are derived from it. */
  name: string
}

// A person, at a glance. Neutral rather than colour-coded: a palette of avatar
// colours would compete with the pipeline hues, which are the only colours in
// the app allowed to carry meaning.
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
