import assert from 'node:assert/strict'
import test from 'node:test'
import {
  DAILY_APPOINTMENT_SLOTS,
  buildSlotKey,
  generateDailySlots,
  getMelbourneDateString,
  isBookableDate,
  isValidAppointmentTime,
  parseSlotKey,
} from '../src/utils/bookingSlots.js'

const monday = '2026-08-17'

test('weekday inside the booking window is valid', () => {
  assert.equal(isBookableDate('2026-08-18', monday), true)
})

test('weekend is rejected', () => {
  assert.equal(isBookableDate('2026-08-22', monday), false)
})

test('today and past dates are rejected', () => {
  assert.equal(isBookableDate(monday, monday), false)
  assert.equal(isBookableDate('2026-08-14', monday), false)
})

test('date beyond the sixty-day horizon is rejected', () => {
  assert.equal(isBookableDate('2026-10-19', monday), false)
})

test('daily slots use the central fixed schedule', () => {
  const occupied = new Set(['2026-08-18__10:00'])
  const slots = generateDailySlots('2026-08-18', occupied)
  assert.deepEqual(slots.map(({ time }) => time), DAILY_APPOINTMENT_SLOTS)
  assert.equal(slots.find(({ time }) => time === '10:00').available, false)
  assert.equal(slots.find(({ time }) => time === '11:00').available, true)
})

test('slot key is deterministic and reversible', () => {
  const slotKey = buildSlotKey('2026-08-18', '14:00')
  assert.equal(slotKey, '2026-08-18__14:00')
  assert.deepEqual(parseSlotKey(slotKey), { date: '2026-08-18', time: '14:00' })
})

test('invalid arbitrary minute time is rejected', () => {
  assert.equal(isValidAppointmentTime('10:17'), false)
  assert.throws(() => buildSlotKey('2026-08-18', '10:17'))
})

test('configured appointment time is accepted', () => {
  assert.equal(isValidAppointmentTime('16:00'), true)
})

test('Melbourne business date does not follow the host UTC date', () => {
  const instant = new Date('2026-08-14T14:30:00.000Z')
  assert.equal(getMelbourneDateString(instant), '2026-08-15')
})
