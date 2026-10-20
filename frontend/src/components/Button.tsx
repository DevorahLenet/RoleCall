import type { ButtonHTMLAttributes, ReactNode } from 'react'
import styles from './Button.module.css'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  /** Leading icon — pass a Phosphor element; it is marked decorative for you. */
  icon?: ReactNode
  children?: ReactNode
}

// The one button in the system. Variants carry intent (primary = the single loud
// action per view; danger = destructive), size carries density. sm/md heights come
// from --control-height(-sm), which grow to the 44px touch minimum on coarse
// pointers; lg is the Toolbar's primary action, 44px everywhere.
export function Button({
  variant = 'secondary',
  size = 'md',
  icon,
  children,
  className,
  type = 'button',
  ...rest
}: Props) {
  const classes = [styles.btn, styles[variant], styles[size], className]
    .filter(Boolean)
    .join(' ')

  return (
    <button type={type} className={classes} {...rest}>
      {icon && (
        <span className={styles.icon} aria-hidden>
          {icon}
        </span>
      )}
      {children}
    </button>
  )
}
