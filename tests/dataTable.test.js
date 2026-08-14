import assert from 'node:assert/strict'
import { test } from 'node:test'
import { nextTick, ref } from 'vue'
import {
  filterTableRows,
  paginateTableRows,
  sortTableRows,
  useDataTable,
} from '../src/composables/useDataTable.js'

const rows = Array.from({ length: 23 }, (_, index) => ({
  id: index + 1,
  fullName: index === 0 ? 'Admin A3' : `User ${String(index + 1).padStart(2, '0')}`,
  email: `person${index + 1}@example.test`,
  role: index % 5 === 0 ? 'admin' : 'user',
}))

const columns = [
  { key: 'fullName', label: 'Full Name', sortable: true, filter: 'text' },
  { key: 'email', label: 'Email', sortable: true, filter: 'text' },
  { key: 'role', label: 'Role', sortable: true, filter: 'select' },
]

test('global search is trimmed and case-insensitive', () => {
  assert.deepEqual(filterTableRows(rows, columns, '  ADMIN A3  ').map((row) => row.id), [1])
})

test('individual column filter matches only its column', () => {
  assert.deepEqual(
    filterTableRows(rows, columns, '', { email: 'person12@' }).map((row) => row.id),
    [12],
  )
})

test('global and column filters combine with AND semantics', () => {
  const filtered = filterTableRows(rows, columns, 'person', { role: 'admin' })
  assert.deepEqual(filtered.map((row) => row.id), [1, 6, 11, 16, 21])
})

test('ascending sort orders text consistently', () => {
  assert.deepEqual(sortTableRows(rows.slice(0, 3), columns, 'fullName', 'asc').map((row) => row.id), [1, 2, 3])
})

test('descending sort reverses the selected ordering', () => {
  assert.deepEqual(sortTableRows(rows.slice(0, 3), columns, 'fullName', 'desc').map((row) => row.id), [3, 2, 1])
})

test('pagination is fixed to ten rows on the first page', () => {
  assert.equal(paginateTableRows(rows, 1).length, 10)
  assert.equal(paginateTableRows(rows, 1)[0].id, 1)
})

test('pagination returns remaining rows on the second page', () => {
  assert.equal(paginateTableRows(rows, 2).length, 10)
  assert.equal(paginateTableRows(rows, 2)[0].id, 11)
})

test('changing a filter resets the current page', async () => {
  const table = useDataTable(ref(rows), columns)
  table.goToPage(3)
  table.setColumnFilter('role', 'admin')
  await nextTick()
  assert.equal(table.currentPage.value, 1)
})

test('empty filter result produces no rows and no pages', () => {
  const table = useDataTable(ref(rows), columns)
  table.searchTerm.value = 'not-present'
  assert.equal(table.totalFilteredRows.value, 0)
  assert.equal(table.totalPages.value, 0)
})
