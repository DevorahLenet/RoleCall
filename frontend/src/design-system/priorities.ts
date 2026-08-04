// Priority resolver. priorities.json is the single source of truth for the sort
// order (`rank`, 1 sorts first) and maps each level to --priority-* tokens.
// Priority is a RANK, not a status — it never borrows a pipeline colour.
import prioritiesJson from '../../../design-system/priorities.json'

interface PriorityJson {
  id: string
  label: string
  rank: number
  bg: string
  text: string
  border: string | null
}

export interface Priority {
  id: string
  label: string
  rank: number
  /** Ready-to-use CSS values resolving the token names to var() references. */
  bg: string
  text: string
  border: string | null
}

// Wrap a token name (e.g. "--priority-high-bg") as a CSS var() reference.
function toVar(token: string | null): string | null {
  return token ? `var(${token})` : null
}

export const priorities: Priority[] = (
  prioritiesJson.priorities as unknown as PriorityJson[]
).map((p) => ({
  id: p.id,
  label: p.label,
  rank: p.rank,
  bg: toVar(p.bg) ?? 'transparent',
  text: toVar(p.text) ?? 'inherit',
  border: toVar(p.border),
}))

const byId: Record<string, Priority> = Object.fromEntries(
  priorities.map((p) => [p.id, p]),
)

// Resolve a priority id to its record, tolerating unknown ids.
export function getPriority(id: string): Priority {
  // Fall back to the middle rank so an unknown id never crashes a sort.
  return byId[id] ?? byId['med'] ?? priorities[0]
}
