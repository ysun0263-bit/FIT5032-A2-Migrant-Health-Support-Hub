import assert from 'node:assert/strict'
import { test } from 'node:test'
import { buildCsv, csvCell, datedFilename, safeSpreadsheetText } from '../src/utils/exportCsv.js'

test('CSV formula prefixes are neutralised', () => {
  for (const value of ['=SUM(A1:A2)', '+cmd', '-1+2', '@IMPORT', '\tformula']) {
    assert.equal(safeSpreadsheetText(value), `'${value}`)
  }
  assert.equal(safeSpreadsheetText('Normal name'), 'Normal name')
})

test('CSV cells correctly quote commas, quotes, and newlines', () => {
  assert.equal(csvCell('One, "two"\nthree'), '"One, ""two""\nthree"')
})

test('CSV output includes UTF-8 BOM, header, and every supplied row', () => {
  const csv = buildCsv(
    [{ header: 'Name', value: (row) => row.name }],
    [{ name: 'Ana' }, { name: '李明' }],
  )
  assert.equal(csv.charCodeAt(0), 0xfeff)
  assert.equal(csv.split('\r\n').length, 3)
  assert.match(csv, /李明/)
})

test('export filename uses the supplied current date', () => {
  assert.equal(datedFilename('users', 'csv', new Date(2026, 7, 14)), 'users-2026-08-14.csv')
})
