export const BOOKING_TIME_ZONE = 'Australia/Melbourne'
export const BOOKING_HORIZON_DAYS = 60
export const DAILY_APPOINTMENT_SLOTS = Object.freeze([
  '09:00',
  '10:00',
  '11:00',
  '13:00',
  '14:00',
  '15:00',
  '16:00',
])

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/
const SLOT_KEY_PATTERN = /^(\d{4}-\d{2}-\d{2})__(\d{2}:\d{2})$/
const OCCUPYING_STATUSES = new Set(['pending', 'confirmed', 'completed'])

function plainDateToUtc(date) {
  if (!DATE_PATTERN.test(date)) {
    return null
  }

  const [year, month, day] = date.split('-').map(Number)
  const value = new Date(Date.UTC(year, month - 1, day))

  if (
    value.getUTCFullYear() !== year
    || value.getUTCMonth() !== month - 1
    || value.getUTCDate() !== day
  ) {
    return null
  }

  return value
}

export function getMelbourneDateString(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: BOOKING_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now)
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]))
  return `${values.year}-${values.month}-${values.day}`
}

export function addCalendarDays(date, days) {
  const value = plainDateToUtc(date)

  if (!value || !Number.isInteger(days)) {
    throw new Error('A valid date and whole-day offset are required.')
  }

  value.setUTCDate(value.getUTCDate() + days)
  return value.toISOString().slice(0, 10)
}

export function getBookingWindow(today = getMelbourneDateString()) {
  let minDate = addCalendarDays(today, 1)

  while (!isWeekday(minDate)) {
    minDate = addCalendarDays(minDate, 1)
  }

  return {
    minDate,
    maxDate: addCalendarDays(today, BOOKING_HORIZON_DAYS),
  }
}

export function isWeekday(date) {
  const value = plainDateToUtc(date)
  const day = value?.getUTCDay()
  return day >= 1 && day <= 5
}

export function isBookableDate(date, today = getMelbourneDateString()) {
  const value = plainDateToUtc(date)

  if (!value || !isWeekday(date)) {
    return false
  }

  const { minDate, maxDate } = getBookingWindow(today)
  return date >= minDate && date <= maxDate
}

export function isValidAppointmentTime(time) {
  return DAILY_APPOINTMENT_SLOTS.includes(time)
}

export function buildSlotKey(date, time) {
  if (!plainDateToUtc(date) || !isValidAppointmentTime(time)) {
    throw new Error('Choose a valid appointment date and time.')
  }

  return `${date}__${time}`
}

export function parseSlotKey(slotKey) {
  const match = SLOT_KEY_PATTERN.exec(slotKey)

  if (!match || !plainDateToUtc(match[1]) || !isValidAppointmentTime(match[2])) {
    return null
  }

  return { date: match[1], time: match[2] }
}

export function generateDailySlots(date, occupiedSlotKeys = new Set()) {
  return DAILY_APPOINTMENT_SLOTS.map((time) => {
    const slotKey = buildSlotKey(date, time)
    return {
      date,
      time,
      slotKey,
      available: !occupiedSlotKeys.has(slotKey),
    }
  })
}

export function isOccupyingAppointmentStatus(status) {
  return OCCUPYING_STATUSES.has(status)
}
