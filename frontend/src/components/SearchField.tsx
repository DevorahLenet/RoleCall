import { MagnifyingGlass, X } from '@phosphor-icons/react'
import styles from './SearchField.module.css'

interface Props {
  value: string
  onChange: (value: string) => void
  label: string
  placeholder: string
}

// The app's first search input. A native <input type="search"> so the platform's
// own affordances (Escape to clear, the on-screen keyboard's Search key) come
// for free; the icon and the clear button are only painting on top.
//
// It is set larger than a form field on purpose: on this screen the query is the
// primary control, not one input among several.
export function SearchField({ value, onChange, label, placeholder }: Props) {
  return (
    <div className={styles.wrap}>
      <MagnifyingGlass className={styles.icon} size={18} aria-hidden />
      <input
        type="search"
        className={styles.input}
        value={value}
        placeholder={placeholder}
        aria-label={label}
        autoComplete="off"
        onChange={(e) => onChange(e.target.value)}
      />
      {/* Only there when there is something to clear, so it never sits as a
          dead control. Escape does the same thing natively. */}
      {value !== '' && (
        <button
          type="button"
          className={styles.clear}
          aria-label="Clear the search"
          onClick={() => onChange('')}
        >
          <X size={15} aria-hidden />
        </button>
      )}
    </div>
  )
}
