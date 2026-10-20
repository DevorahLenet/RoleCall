import { getWritingType } from '../design-system/writingTypes'
import styles from './TypeTag.module.css'

interface Props {
  typeId: string
}

// A writing piece's type, as the design system's general-purpose outline tag —
// deliberately NOT a status badge. Types carry no colour: a row already shows
// its job's company, and four more hues would compete with the pipeline
// palette, which is the only place colour is allowed to mean something.
//
// An unknown id (a type removed from the JSON while rows still reference it)
// renders the raw id rather than vanishing, so the data stays visible.
export function TypeTag({ typeId }: Props) {
  const type = getWritingType(typeId)
  return <span className={styles.tag}>{type?.label ?? typeId}</span>
}
