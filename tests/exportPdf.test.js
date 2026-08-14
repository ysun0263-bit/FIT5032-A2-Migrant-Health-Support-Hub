import assert from 'node:assert/strict'
import { test } from 'node:test'
import { buildPdfReport } from '../src/utils/exportPdf.js'

const generatedAt = new Date('2026-08-14T12:00:00.000Z')

test('users PDF is non-empty and contains a data page', async () => {
  const document = await buildPdfReport({
    reportTitle: 'Users Report',
    columns: [
      { header: 'Name', value: (row) => row.name },
      { header: 'Role', value: (row) => row.role },
    ],
    rows: [{ name: 'Community User', role: 'user' }],
    filterSummary: 'Role: user',
    generatedAt,
  })
  const bytes = new Uint8Array(document.output('arraybuffer'))

  assert.equal(new TextDecoder().decode(bytes.slice(0, 5)), '%PDF-')
  assert.ok(bytes.length > 3000)
  assert.equal(document.getNumberOfPages(), 1)
})

test('appointments PDF automatically paginates a long filtered result', async () => {
  const rows = Array.from({ length: 80 }, (_, index) => ({
    name: `Appointment ${index + 1}`,
    date: `2026-09-${String((index % 28) + 1).padStart(2, '0')}`,
    status: 'confirmed',
  }))
  const document = await buildPdfReport({
    reportTitle: 'Appointments Report',
    columns: [
      { header: 'Name', value: (row) => row.name },
      { header: 'Date', value: (row) => row.date },
      { header: 'Status', value: (row) => row.status },
    ],
    rows,
    filterSummary: 'Status: confirmed',
    orientation: 'landscape',
    generatedAt,
  })
  const bytes = new Uint8Array(document.output('arraybuffer'))

  assert.ok(bytes.length > 10_000)
  assert.ok(document.getNumberOfPages() > 1)
})
