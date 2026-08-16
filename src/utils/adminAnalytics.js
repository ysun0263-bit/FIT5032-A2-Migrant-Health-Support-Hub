export const APPOINTMENT_STATUS_KEYS = ['pending', 'confirmed', 'completed', 'cancelled']
export const ANALYTICS_TIME_RANGES = ['7', '30', '90', 'all']

const melbourneDateFormatter = new Intl.DateTimeFormat('en-AU', {
  timeZone: 'Australia/Melbourne',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

const displayDateFormatter = new Intl.DateTimeFormat('en-AU', {
  timeZone: 'UTC',
  year: 'numeric',
  month: 'short',
  day: 'numeric',
})

function validDate(value) {
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function datePartsToKey(parts) {
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]))
  return `${values.year}-${values.month}-${values.day}`
}

export function toMelbourneDateKey(value) {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value
  }

  const date = validDate(value)
  return date ? datePartsToKey(melbourneDateFormatter.formatToParts(date)) : ''
}

function shiftDateKey(dateKey, days) {
  const [year, month, day] = dateKey.split('-').map(Number)
  const shifted = new Date(Date.UTC(year, month - 1, day + days))
  return shifted.toISOString().slice(0, 10)
}

export function countAppointmentsByStatus(appointments = []) {
  const counts = Object.fromEntries(APPOINTMENT_STATUS_KEYS.map((status) => [status, 0]))
  counts.unknown = 0

  appointments.forEach((appointment) => {
    if (APPOINTMENT_STATUS_KEYS.includes(appointment?.status)) {
      counts[appointment.status] += 1
    } else {
      counts.unknown += 1
    }
  })

  return { ...counts, total: appointments.length }
}

export function buildAppointmentTrend(
  appointments = [],
  { range = '30', referenceDate = new Date() } = {},
) {
  const selectedRange = ANALYTICS_TIME_RANGES.includes(String(range)) ? String(range) : '30'
  const referenceKey = toMelbourneDateKey(referenceDate)
  const startKey = selectedRange === 'all' || !referenceKey
    ? ''
    : shiftDateKey(referenceKey, -(Number(selectedRange) - 1))
  const counts = new Map()

  appointments.forEach((appointment) => {
    const dateKey = toMelbourneDateKey(appointment?.createdAt)
    if (!dateKey) return
    if (startKey && (dateKey < startKey || dateKey > referenceKey)) return
    counts.set(dateKey, (counts.get(dateKey) ?? 0) + 1)
  })

  return [...counts.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([date, count]) => ({
      date,
      count,
      label: displayDateFormatter.format(new Date(`${date}T00:00:00.000Z`)),
    }))
}

export function buildRatingDistribution(ratings = []) {
  const counts = [0, 0, 0, 0, 0]

  ratings.forEach((rating) => {
    if (Number.isInteger(rating?.score) && rating.score >= 1 && rating.score <= 5) {
      counts[rating.score - 1] += 1
    }
  })

  return counts.map((count, index) => ({
    score: index + 1,
    label: `${index + 1} star${index ? 's' : ''}`,
    count,
  }))
}

export function calculatePercentage(count, total) {
  return total > 0 ? Math.round((count / total) * 100) : 0
}
