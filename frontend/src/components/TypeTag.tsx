import type { CSSProperties } from 'react'
import { getWritingType, getWritingTypeIcon } from '../design-system/writingTypes'
import styles from './TypeTag.module.css'

interface Props {
  typeId: string
}

// A writing piece's type as the small uppercase eyebrow that opens a tile's
// title line. Deliberately not a badge and not an outline chip: types carry no
// colour, and a tile already shows the piece's company.
//
// An unknown id (a type removed from the JSON while rows still reference it)
// renders the raw id rather than vanishing, so the data stays visible.
export function TypeTag({ typeId }: Props) {
  const type = getWritingType(typeId)
  return <span className={styles.tag}>{type?.label ?? typeId}</span>
}

// The type's bare glyph — an IDENTIFYING icon, so no box and no hover, unlike
// the copy button beside it, which is an action and always sits in a control.
//
// The wrapper sizes itself from the glyph (4px of breathing room) so a tile
// and the piece panel can ask for different glyph sizes without either of them
// restating the box.
export function TypeGlyph({ typeId, size = 20 }: Props & { size?: number }) {
  const Icon = getWritingTypeIcon(typeId)
  return (
    <span
      className={styles.glyph}
      style={{ '--glyph-box': `${size + 4}px` } as CSSProperties}
    >
      <Icon size={size} aria-hidden />
    </span>
  )
}
