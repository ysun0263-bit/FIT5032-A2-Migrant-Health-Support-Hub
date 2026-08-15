<script setup>
import { ref } from 'vue'
import DataTable from './DataTable.vue'
import { downloadCsv } from '../utils/exportCsv.js'
import { downloadPdfReport } from '../utils/exportPdf.js'

defineProps({
  appointments: { type: Array, required: true },
  loading: { type: Boolean, default: false },
  error: { type: String, default: '' },
})

defineEmits(['update-status'])

const tableRef = ref()
const exportMessage = ref('')
const exportingPdf = ref(false)
const statuses = ['pending', 'confirmed', 'completed', 'cancelled']

const columns = [
  { key: 'fullName', label: 'Full Name', sortable: true, filter: 'text' },
  { key: 'email', label: 'Email', sortable: true, filter: 'text' },
  { key: 'language', label: 'Language', sortable: true, filter: 'text' },
  { key: 'supportTopic', label: 'Support Topic', sortable: true, filter: 'text' },
  { key: 'preferredDate', label: 'Preferred Date', sortable: true, globalSearch: false },
  { key: 'preferredTime', label: 'Preferred Time', sortable: true, globalSearch: false },
  { key: 'contactPreference', label: 'Contact', sortable: true },
  {
    key: 'status',
    label: 'Status',
    sortable: true,
    filter: 'select',
    options: statuses.map((status) => ({ label: status, value: status })),
  },
  { key: 'createdAt', label: 'Created At', sortable: true, globalSearch: false },
]

const csvColumns = [
  { header: 'Full Name', value: (appointment) => appointment.fullName },
  { header: 'Email', value: (appointment) => appointment.email },
  { header: 'Language', value: (appointment) => appointment.language },
  { header: 'Support Topic', value: (appointment) => appointment.supportTopic },
  { header: 'Preferred Date', value: (appointment) => appointment.preferredDate },
  { header: 'Preferred Time', value: (appointment) => appointment.preferredTime },
  { header: 'Contact Preference', value: (appointment) => appointment.contactPreference },
  { header: 'Status', value: (appointment) => appointment.status },
  { header: 'Created At', value: (appointment) => appointment.createdAt },
  { header: 'Notes', value: (appointment) => appointment.notes },
]

const pdfColumns = [
  { header: 'Name', value: (appointment) => appointment.fullName },
  { header: 'Email', value: (appointment) => appointment.email },
  { header: 'Topic', value: (appointment) => appointment.supportTopic },
  { header: 'Date', value: (appointment) => appointment.preferredDate },
  { header: 'Time', value: (appointment) => appointment.preferredTime },
  { header: 'Status', value: (appointment) => appointment.status },
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

  downloadCsv(csvColumns, rows, 'appointments')
  exportMessage.value = `Exported ${rows.length} filtered appointment records to CSV.`
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
        reportTitle: 'Appointments Report',
        columns: pdfColumns,
        rows,
        filterSummary: tableRef.value.getFilterSummary(),
        orientation: 'landscape',
      },
      'appointments',
    )
    exportMessage.value = `Exported ${rows.length} filtered appointment records to PDF.`
  } catch {
    exportMessage.value = 'The appointments PDF could not be generated.'
  } finally {
    exportingPdf.value = false
  }
}
</script>

<template>
  <section class="summary-panel" aria-labelledby="admin-appointments-title">
    <div class="table-section-heading">
      <div>
        <p class="card-tag">Interactive table</p>
        <h2 id="admin-appointments-title">Appointments</h2>
      </div>
      <div class="action-row" aria-label="Appointments export options">
        <button
          type="button"
          class="button secondary"
          aria-label="Export appointments as CSV"
          :disabled="loading || Boolean(error)"
          @click="handleCsvExport"
        >
          Export CSV
        </button>
        <button
          type="button"
          class="button secondary"
          :aria-label="exportingPdf ? 'Generating appointments PDF' : 'Export appointments as PDF'"
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
      table-id="appointments"
      :rows="appointments"
      :columns="columns"
      search-label="Search appointments"
      :loading="loading"
      :error="error"
      empty-message="No appointments found."
      no-match-message="No matching appointments."
    >
      <template #cell-status="{ row }">
        <label class="sr-only" :for="`status-${row.id}`">Appointment status for {{ row.fullName }}</label>
        <select
          :id="`status-${row.id}`"
          :value="row.status"
          @change="$emit('update-status', row.id, $event.target.value)"
        >
          <option v-for="status in statuses" :key="status" :value="status">{{ status }}</option>
        </select>
      </template>
    </DataTable>
  </section>
</template>
