import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  buildAppointmentTrend,
  buildRatingDistribution,
  countAppointmentsByStatus,
  toMelbourneDateKey,
} from '../src/utils/adminAnalytics.js'

const referenceDate = new Date('2026-08-20T02:00:00.000Z')

test('appointment statuses are counted correctly', () => {
  assert.deepEqual(
    countAppointmentsByStatus([
      { status: 'pending' },
      { status: 'confirmed' },
      { status: 'confirmed' },
      { status: 'completed' },
      { status: 'cancelled' },
    ]),
    { pending: 1, confirmed: 2, completed: 1, cancelled: 1, unknown: 0, total: 5 },
  )
})

test('empty appointments produce zero status counts', () => {
  assert.deepEqual(
    countAppointmentsByStatus([]),
    { pending: 0, confirmed: 0, completed: 0, cancelled: 0, unknown: 0, total: 0 },
  )
})

test('unknown and missing statuses are reported without breaking totals', () => {
  const result = countAppointmentsByStatus([{ status: 'legacy' }, {}, null])
  assert.equal(result.unknown, 3)
  assert.equal(result.total, 3)
})

test('appointment trend groups bookings by Melbourne creation date', () => {
  const trend = buildAppointmentTrend([
    { createdAt: '2026-08-19T15:30:00.000Z' },
    { createdAt: '2026-08-19T18:30:00.000Z' },
    { createdAt: '2026-08-18T23:00:00.000Z' },
  ], { range: 'all', referenceDate })
  assert.deepEqual(trend.map(({ date, count }) => ({ date, count })), [
    { date: '2026-08-19', count: 1 },
    { date: '2026-08-20', count: 2 },
  ])
})

test('appointment trend applies a deterministic date range', () => {
  const appointments = [
    { createdAt: '2026-08-13T02:00:00.000Z' },
    { createdAt: '2026-08-14T02:00:00.000Z' },
    { createdAt: '2026-08-20T02:00:00.000Z' },
    { createdAt: '2026-08-21T02:00:00.000Z' },
  ]
  assert.deepEqual(
    buildAppointmentTrend(appointments, { range: '7', referenceDate }).map(({ date }) => date),
    ['2026-08-14', '2026-08-20'],
  )
})

test('empty appointments produce an empty trend', () => {
  assert.deepEqual(buildAppointmentTrend([], { range: '30', referenceDate }), [])
})

test('invalid and missing timestamps are ignored safely', () => {
  assert.deepEqual(
    buildAppointmentTrend([{ createdAt: '' }, {}, { createdAt: 'not-a-date' }], {
      range: 'all',
      referenceDate,
    }),
    [],
  )
})

test('trend output is chronological regardless of source order', () => {
  const result = buildAppointmentTrend([
    { createdAt: '2026-08-20T02:00:00.000Z' },
    { createdAt: '2026-08-18T02:00:00.000Z' },
    { createdAt: '2026-08-19T02:00:00.000Z' },
  ], { range: 'all', referenceDate })
  assert.deepEqual(result.map(({ date }) => date), ['2026-08-18', '2026-08-19', '2026-08-20'])
})

test('Melbourne date boundary differs from UTC at midnight crossover', () => {
  assert.equal(toMelbourneDateKey('2026-08-14T14:30:00.000Z'), '2026-08-15')
})

test('rating scores one through five are counted correctly', () => {
  assert.deepEqual(
    buildRatingDistribution([1, 2, 3, 4, 5, 5].map((score) => ({ score })))
      .map(({ count }) => count),
    [1, 1, 1, 1, 2],
  )
})

test('invalid rating scores are ignored', () => {
  assert.deepEqual(
    buildRatingDistribution([{ score: 0 }, { score: 6 }, { score: 4.5 }, {}, null])
      .map(({ count }) => count),
    [0, 0, 0, 0, 0],
  )
})

test('empty ratings produce a zero distribution', () => {
  assert.deepEqual(buildRatingDistribution([]).map(({ count }) => count), [0, 0, 0, 0, 0])
})
