import { computed, reactive, ref, unref, watch } from 'vue'

export const DEFAULT_PAGE_SIZE = 10

function normalise(value) {
  return String(value ?? '').trim().toLocaleLowerCase()
}

function columnValue(row, column) {
  return column.value ? column.value(row) : row[column.key]
}

export function filterTableRows(rows, columns, searchTerm = '', columnFilters = {}) {
  const globalNeedle = normalise(searchTerm)
  const searchableColumns = columns.filter((column) => column.globalSearch !== false)

  return rows.filter((row) => {
    const matchesGlobal =
      !globalNeedle ||
      searchableColumns.some((column) => normalise(columnValue(row, column)).includes(globalNeedle))

    if (!matchesGlobal) {
      return false
    }

    return columns.every((column) => {
      const filterValue = normalise(columnFilters[column.key])

      if (!filterValue || !column.filter) {
        return true
      }

      const value = normalise(columnValue(row, column))
      return column.filter === 'select' ? value === filterValue : value.includes(filterValue)
    })
  })
}

export function sortTableRows(rows, columns, sortKey = '', sortDirection = 'asc') {
  const column = columns.find((candidate) => candidate.key === sortKey && candidate.sortable)

  if (!column) {
    return [...rows]
  }

  const direction = sortDirection === 'desc' ? -1 : 1

  return [...rows].sort((left, right) => {
    const leftValue = columnValue(left, column)
    const rightValue = columnValue(right, column)

    if (typeof leftValue === 'number' && typeof rightValue === 'number') {
      return (leftValue - rightValue) * direction
    }

    return (
      String(leftValue ?? '').localeCompare(String(rightValue ?? ''), undefined, {
        numeric: true,
        sensitivity: 'base',
      }) * direction
    )
  })
}

export function paginateTableRows(rows, currentPage, pageSize = DEFAULT_PAGE_SIZE) {
  const start = (currentPage - 1) * pageSize
  return rows.slice(start, start + pageSize)
}

export function useDataTable(rowsSource, columns, options = {}) {
  const pageSize = options.pageSize ?? DEFAULT_PAGE_SIZE
  const searchTerm = ref('')
  const columnFilters = reactive(
    Object.fromEntries(columns.filter((column) => column.filter).map((column) => [column.key, ''])),
  )
  const sortKey = ref(options.initialSortKey ?? '')
  const sortDirection = ref(options.initialSortDirection ?? 'asc')
  const currentPage = ref(1)

  const sourceRows = computed(() => unref(rowsSource) ?? [])
  const filteredRows = computed(() =>
    filterTableRows(sourceRows.value, columns, searchTerm.value, columnFilters),
  )
  const sortedRows = computed(() =>
    sortTableRows(filteredRows.value, columns, sortKey.value, sortDirection.value),
  )
  const totalRows = computed(() => sourceRows.value.length)
  const totalFilteredRows = computed(() => sortedRows.value.length)
  const totalPages = computed(() => Math.ceil(totalFilteredRows.value / pageSize))
  const paginatedRows = computed(() =>
    paginateTableRows(sortedRows.value, currentPage.value, pageSize),
  )

  function setSort(key) {
    if (sortKey.value === key) {
      sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
    } else {
      sortKey.value = key
      sortDirection.value = 'asc'
    }
  }

  function setColumnFilter(key, value) {
    if (Object.hasOwn(columnFilters, key)) {
      columnFilters[key] = value
    }
  }

  function goToPage(page) {
    if (!totalPages.value) {
      currentPage.value = 1
      return
    }

    currentPage.value = Math.min(Math.max(1, page), totalPages.value)
  }

  function nextPage() {
    goToPage(currentPage.value + 1)
  }

  function previousPage() {
    goToPage(currentPage.value - 1)
  }

  function clearFilters() {
    searchTerm.value = ''
    Object.keys(columnFilters).forEach((key) => {
      columnFilters[key] = ''
    })
    currentPage.value = 1
  }

  function getFilterSummary() {
    const parts = []
    const globalValue = searchTerm.value.trim()

    if (globalValue) {
      parts.push(`Global search: ${globalValue}`)
    }

    columns.forEach((column) => {
      const value = String(columnFilters[column.key] ?? '').trim()
      if (value) {
        parts.push(`${column.label}: ${value}`)
      }
    })

    if (sortKey.value) {
      const sortColumn = columns.find((column) => column.key === sortKey.value)
      parts.push(`Sorted by ${sortColumn?.label ?? sortKey.value} (${sortDirection.value})`)
    }

    return parts.length ? parts.join('; ') : 'No active filters; source order'
  }

  watch([searchTerm, () => ({ ...columnFilters })], () => {
    currentPage.value = 1
  })

  watch(totalPages, (pages) => {
    if (pages && currentPage.value > pages) {
      currentPage.value = pages
    } else if (!pages) {
      currentPage.value = 1
    }
  })

  return {
    searchTerm,
    columnFilters,
    sortKey,
    sortDirection,
    currentPage,
    pageSize,
    filteredRows,
    sortedRows,
    paginatedRows,
    totalRows,
    totalFilteredRows,
    totalPages,
    setSort,
    setColumnFilter,
    clearFilters,
    nextPage,
    previousPage,
    goToPage,
    getFilterSummary,
  }
}
