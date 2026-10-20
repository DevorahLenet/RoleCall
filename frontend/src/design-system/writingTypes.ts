// Writing-piece type resolver. writing-types.json is the single source of truth
// for the library's filter chips, the type tag on a row, and the DB enum.
//
// Types carry NO colour, by design: a piece row already shows its job's company,
// and four more hues would compete with the pipeline palette, which is the only
// place colour is allowed to mean something. A type renders as an outline tag.
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

// Resolve a type id to its record; undefined if unknown, so a stale filter in a
// URL degrades to "no filter" rather than crashing the screen.
export function getWritingType(id: string | null | undefined): WritingType | undefined {
  return id ? byId[id] : undefined
}
