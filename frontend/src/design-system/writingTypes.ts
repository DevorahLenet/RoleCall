// Writing-piece type resolver. writing-types.json is the single source of truth
// for the library's filter pills, the glyph and eyebrow on a tile, and the DB
// enum.
//
// Types carry NO colour, by design: a tile already shows its job's company, and
// four more hues would compete with the pipeline palette, which is the only
// place colour is allowed to mean something. A type reads as a bare glyph plus
// an uppercase eyebrow — identification, never a badge.
import {
  ChatCenteredText,
  EnvelopeSimple,
  IdentificationCard,
  SquaresFour,
  Star,
} from '@phosphor-icons/react'
import type { Icon } from '@phosphor-icons/react'
import writingTypesJson from '../../../design-system/writing-types.json'

export interface WritingType {
  id: string
  label: string
  description: string
}

export const writingTypes = writingTypesJson.types as unknown as WritingType[]

const byId: Record<string, WritingType> = Object.fromEntries(
  writingTypes.map((t) => [t.id, t]),
)

// The Phosphor glyph per type, from design-system/icons.md. Kept here beside
// the resolver rather than in the JSON: the JSON is shared with the backend,
// which has no business knowing about icon components.
const icons: Record<string, Icon> = {
  resume: IdentificationCard,
  cover_letter: EnvelopeSimple,
  blurb: ChatCenteredText,
  impact_statement: Star,
}

/** The glyph for the "no type filter" pill — every type at once. */
export const allWritingIcon: Icon = SquaresFour

// Resolve a type id to its record; undefined if unknown, so a stale filter in a
// URL degrades to "no filter" rather than crashing the screen.
export function getWritingType(id: string | null | undefined): WritingType | undefined {
  return id ? byId[id] : undefined
}

/** The glyph for a type id, falling back to the all-writing mark so a type
 *  removed from the JSON while rows still reference it still draws something. */
export function getWritingTypeIcon(id: string | null | undefined): Icon {
  return (id && icons[id]) || allWritingIcon
}

/** The plural the filter pills use ("Resumes", "Cover letters"). A display
 *  transform of the JSON label, not a second place labels are written. */
export function pluralWritingType(type: WritingType): string {
  return `${type.label}s`
}
