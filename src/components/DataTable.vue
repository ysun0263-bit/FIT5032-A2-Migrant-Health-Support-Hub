<script setup>
import { computed, toRef } from 'vue'
import { useDataTable } from '../composables/useDataTable.js'

const props = defineProps({
  tableId: { type: String, required: true },
  rows: { type: Array, required: true },
  columns: { type: Array, required: true },
  rowKey: { type: String, default: 'id' },
  searchLabel: { type: String, required: true },
  loading: { type: Boolean, default: false },
  error: { type: String, default: '' },
  emptyMessage: { type: String, required: true },
  noMatchMessage: { type: String, required: true },
})

const table = useDataTable(toRef(props, 'rows'), props.columns)
const pageNumbers = computed(() =>
  Array.from({ length: table.totalPages.value }, (_, index) => index + 1),
)
const firstVisibleRow = computed(() =>
  table.totalFilteredRows.value ? (table.currentPage.value - 1) * table.pageSize + 1 : 0,
)
const lastVisibleRow = computed(() =>
  Math.min(table.currentPage.value * table.pageSize, table.totalFilteredRows.value),
)

function displayValue(row, column) {
  const value = column.value ? column.value(row) : row[column.key]
  return column.format ? column.format(value, row) : value
}

function ariaSort(column) {
  if (table.sortKey.value !== column.key) {
    return 'none'
  }
  return table.sortDirection.value === 'asc' ? 'ascending' : 'descending'
}

defineExpose({
  getExportRows: () => [...table.sortedRows.value],
  getFilterSummary: table.getFilterSummary,
  clearFilters: table.clearFilters,
})
</script>

<template>
  <div class="data-table-shell">
    <div class="data-table-toolbar">
      <label :for="`${tableId}-global-search`">
        {{ searchLabel }}
        <input
          :id="`${tableId}-global-search`"
          v-model="table.searchTerm.value"
          type="search"
          placeholder="Search all listed fields"
        />
      </label>
      <button type="button" class="button secondary" @click="table.clearFilters">
        Clear filters
      </button>
    </div>

    <div class="data-table-filters" aria-label="Column filters">
      <label v-for="column in columns.filter((item) => item.filter)" :key="column.key">
        {{ column.label }}
        <select
          v-if="column.filter === 'select'"
          :value="table.columnFilters[column.key]"
          @change="table.setColumnFilter(column.key, $event.target.value)"
        >
          <option value="">All</option>
          <option v-for="option in column.options" :key="String(option.value)" :value="option.value">
            {{ option.label }}
          </option>
        </select>
        <input
          v-else
          :value="table.columnFilters[column.key]"
          type="search"
          :placeholder="`Filter by ${column.label.toLowerCase()}`"
          @input="table.setColumnFilter(column.key, $event.target.value)"
        />
      </label>
    </div>

    <p v-if="loading" class="empty-state" role="status">Loading {{ tableId }}...</p>
    <p v-else-if="error" class="form-status error" role="alert">{{ error }}</p>
    <p v-else-if="!table.totalRows.value" class="empty-state">{{ emptyMessage }}</p>
    <p v-else-if="!table.totalFilteredRows.value" class="empty-state">{{ noMatchMessage }}</p>

    <template v-else>
      <div class="responsive-table" role="region" :aria-label="`${tableId} table`" tabindex="0">
        <table>
          <thead>
            <tr>
              <th
                v-for="column in columns"
                :key="column.key"
                scope="col"
                :aria-sort="column.sortable ? ariaSort(column) : undefined"
              >
                <button
                  v-if="column.sortable"
                  type="button"
                  class="sort-button"
                  @click="table.setSort(column.key)"
                >
                  <span>{{ column.label }}</span>
                  <span aria-hidden="true">
                    {{ table.sortKey.value === column.key ? (table.sortDirection.value === 'asc' ? '↑' : '↓') : '↕' }}
                  </span>
                  <span class="sr-only">
                    {{ table.sortKey.value === column.key ? `Currently sorted ${table.sortDirection.value === 'asc' ? 'ascending' : 'descending'}` : 'Not currently sorted' }}
                  </span>
                </button>
                <span v-else>{{ column.label }}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in table.paginatedRows.value" :key="row[rowKey]">
              <td v-for="column in columns" :key="column.key">
                <slot :name="`cell-${column.key}`" :row="row" :value="displayValue(row, column)">
                  {{ displayValue(row, column) }}
                </slot>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="pagination" aria-label="Table pagination">
        <p>
          Showing {{ firstVisibleRow }}-{{ lastVisibleRow }} of {{ table.totalFilteredRows.value }}
          <span v-if="table.totalFilteredRows.value !== table.totalRows.value">
            ({{ table.totalRows.value }} total)
          </span>
        </p>
        <div class="pagination-controls">
          <button
            type="button"
            class="button secondary"
            :disabled="table.currentPage.value === 1"
            @click="table.previousPage"
          >
            Previous
          </button>
          <button
            v-for="page in pageNumbers"
            :key="page"
            type="button"
            class="page-button"
            :class="{ active: page === table.currentPage.value }"
            :aria-current="page === table.currentPage.value ? 'page' : undefined"
            :aria-label="`Go to page ${page}`"
            @click="table.goToPage(page)"
          >
            {{ page }}
          </button>
          <button
            type="button"
            class="button secondary"
            :disabled="table.currentPage.value === table.totalPages.value"
            @click="table.nextPage"
          >
            Next
          </button>
        </div>
        <p>Page {{ table.currentPage.value }} of {{ table.totalPages.value }}</p>
      </div>
    </template>
  </div>
</template>
