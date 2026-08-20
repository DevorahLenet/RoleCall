// Date formatting for the whole UI, so "Mar 12" means the same thing on a card,
// a note and a job header rather than drifting apart in three components.

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

/** Short month + day (`Mar 12`), with the year appended when it isn't the
 *  current one — a two-year-old note shouldn't read as this week's.
 *
 *  Bare `YYYY-MM-DD` dates are split as text, never passed through
 *  `new Date(iso)`: the constructor reads a date-only string as UTC midnight,
 *  which renders as the previous day for anyone west of Greenwich. ISO
 *  *datetimes* carry a real instant, so those do convert to local time. */
export function formatDate(value: string): string {
  let year: number
  let month: number
  let day: number

  if (value.includes('T')) {
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return value
    year = d.getFullYear()
    month = d.getMonth() + 1
    day = d.getDate()
  } else {
    ;[year, month, day] = value.split('-').map(Number)
  }

  if (!year || !month || !day || month > 12) return value
  const stamp = `${MONTHS[month - 1]} ${day}`
  return year === new Date().getFullYear() ? stamp : `${stamp}, ${year}`
}
