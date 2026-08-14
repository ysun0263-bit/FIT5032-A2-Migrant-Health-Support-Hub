<script setup>
import { ref } from 'vue'
import DataTable from './DataTable.vue'
import { downloadCsv } from '../utils/exportCsv.js'
import { downloadPdfReport } from '../utils/exportPdf.js'

defineProps({
  users: { type: Array, required: true },
  loading: { type: Boolean, default: false },
  error: { type: String, default: '' },
})

const tableRef = ref()
const exportMessage = ref('')
const exportingPdf = ref(false)

const columns = [
  { key: 'fullName', label: 'Full Name', sortable: true, filter: 'text' },
  { key: 'email', label: 'Email', sortable: true, filter: 'text' },
  {
    key: 'role',
    label: 'Role',
    sortable: true,
    filter: 'select',
    options: [
      { label: 'User', value: 'user' },
      { label: 'Admin', value: 'admin' },
    ],
  },
  {
    key: 'active',
    label: 'Active',
    sortable: true,
    filter: 'select',
    value: (user) => (user.active ? 'active' : 'inactive'),
    format: (value) => (value === 'active' ? 'Yes' : 'No'),
    options: [
      { label: 'Active', value: 'active' },
      { label: 'Inactive', value: 'inactive' },
    ],
  },
  { key: 'createdAt', label: 'Created At', sortable: true, globalSearch: false },
]

const csvColumns = [
  { header: 'Full Name', value: (user) => user.fullName },
  { header: 'Email', value: (user) => user.email },
  { header: 'Role', value: (user) => user.role },
  { header: 'Active', value: (user) => (user.active ? 'Yes' : 'No') },
  { header: 'Created At', value: (user) => user.createdAt },
]

function exportRows() {
  return tableRef.value?.getExportRows() ?? []
}

function handleCsvExport() {
  const rows = exportRows()

  if (!rows.length) {
    exportMessage.value = 'No data available to export.'
    return
  }

  downloadCsv(csvColumns, rows, 'users')
  exportMessage.value = `Exported ${rows.length} filtered user records to CSV.`
}

async function handlePdfExport() {
  const rows = exportRows()

  if (!rows.length) {
    exportMessage.value = 'No data available to export.'
    return
  }

  exportingPdf.value = true
  exportMessage.value = ''

  try {
    await downloadPdfReport(
      {
        reportTitle: 'Users Report',
        columns: csvColumns,
        rows,
        filterSummary: tableRef.value.getFilterSummary(),
      },
      'users',
    )
    exportMessage.value = `Exported ${rows.length} filtered user records to PDF.`
  } catch {
    exportMessage.value = 'The users PDF could not be generated.'
  } finally {
    exportingPdf.value = false
  }
}
</script>

<template>
  <section class="summary-panel" aria-labelledby="admin-users-title">
    <div class="table-section-heading">
      <div>
        <p class="card-tag">Interactive table</p>
        <h2 id="admin-users-title">Users</h2>
      </div>
      <div class="action-row" aria-label="Users export options">
        <button
          type="button"
          class="button secondary"
          :disabled="loading || Boolean(error)"
          @click="handleCsvExport"
        >
          Export CSV
        </button>
        <button
          type="button"
          class="button secondary"
          :disabled="loading || Boolean(error) || exportingPdf"
          @click="handlePdfExport"
        >
          {{ exportingPdf ? 'Generating PDF...' : 'Export PDF' }}
        </button>
      </div>
    </div>

    <p v-if="exportMessage" class="export-status" role="status">{{ exportMessage }}</p>

    <DataTable
      ref="tableRef"
      table-id="users"
      :rows="users"
      :columns="columns"
      search-label="Search users"
      :loading="loading"
      :error="error"
      empty-message="No users found."
      no-match-message="No matching users."
    />
  </section>
</template>
