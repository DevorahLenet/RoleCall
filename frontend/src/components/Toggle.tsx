import styles from './Toggle.module.css'

interface Props {
  checked: boolean
  onChange: (checked: boolean) => void
  /** Visible text beside the switch — it labels the control natively. */
  label: string
}

// An on/off switch for a view preference that applies immediately (no Save).
// A real <input type="checkbox" role="switch"> inside its <label>, so it is
// keyboard- and screen-reader-native; the track and knob are only painting.
export function Toggle({ checked, onChange, label }: Props) {
  return (
    <label className={styles.wrap}>
      <input
        type="checkbox"
        role="switch"
        className={styles.input}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className={styles.track} aria-hidden>
        <span className={styles.knob} />
      </span>
      <span className={styles.text}>{label}</span>
    </label>
  )
}
