<script setup>
import { computed, ref } from 'vue'
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from 'chart.js'
import { Bar, Doughnut, Line } from 'vue-chartjs'
import {
  buildAppointmentTrend,
  buildRatingDistribution,
  calculatePercentage,
  countAppointmentsByStatus,
} from '../utils/adminAnalytics.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
)

const props = defineProps({
  appointments: { type: Array, required: true },
  ratings: { type: Array, required: true },
  appointmentsLoading: { type: Boolean, default: false },
  ratingsLoading: { type: Boolean, default: false },
  appointmentsError: { type: String, default: '' },
  ratingsError: { type: String, default: '' },
})

const statusDefinitions = [
  { key: 'pending', label: 'Pending', colour: '#9a3412' },
  { key: 'confirmed', label: 'Confirmed', colour: '#1d4ed8' },
  { key: 'completed', label: 'Completed', colour: '#047857' },
  { key: 'cancelled', label: 'Cancelled', colour: '#7e22ce' },
]
const timeRanges = [
  { value: '7', label: '7 days' },
  { value: '30', label: '30 days' },
  { value: '90', label: '90 days' },
  { value: 'all', label: 'All' },
]
const selectedStatus = ref('all')
const selectedRange = ref('30')
const analyticsReferenceDate = new Date()
const prefersReducedMotion = typeof window !== 'undefined'
  && window.matchMedia('(prefers-reduced-motion: reduce)').matches

const loading = computed(() => props.appointmentsLoading || props.ratingsLoading)
const hasError = computed(() => Boolean(props.appointmentsError || props.ratingsError))
const statusCounts = computed(() => countAppointmentsByStatus(props.appointments))
const statusRows = computed(() => {
  const rows = statusDefinitions.map((definition) => ({
    ...definition,
    count: statusCounts.value[definition.key],
  }))
  if (statusCounts.value.unknown) {
    rows.push({ key: 'unknown', label: 'Unknown', colour: '#4b5563', count: statusCounts.value.unknown })
  }
  return rows
})
const selectedStatusRow = computed(() =>
  statusRows.value.find(({ key }) => key === selectedStatus.value) ?? null,
)
const selectedStatusSummary = computed(() => {
  if (!selectedStatusRow.value) {
    return `All statuses — ${statusCounts.value.total} appointments`
  }
  const percentage = calculatePercentage(selectedStatusRow.value.count, statusCounts.value.total)
  return `${selectedStatusRow.value.label} — ${selectedStatusRow.value.count} appointments (${percentage}%)`
})
const appointmentTrend = computed(() =>
  buildAppointmentTrend(props.appointments, {
    range: selectedRange.value,
    referenceDate: analyticsReferenceDate,
  }),
)
const ratingRows = computed(() => buildRatingDistribution(props.ratings))
const validRatingCount = computed(() => ratingRows.value.reduce((sum, row) => sum + row.count, 0))

const statusChartData = computed(() => ({
  labels: statusRows.value.map(({ label }) => label),
  datasets: [{
    label: 'Appointments',
    data: statusRows.value.map(({ count }) => count),
    backgroundColor: statusRows.value.map(({ key, colour }) =>
      selectedStatus.value === 'all' || selectedStatus.value === key ? colour : `${colour}55`,
    ),
    borderColor: '#ffffff',
    borderWidth: statusRows.value.map(({ key }) => selectedStatus.value === key ? 4 : 2),
  }],
}))

const trendChartData = computed(() => ({
  labels: appointmentTrend.value.map(({ label }) => label),
  datasets: [{
    label: 'Bookings created',
    data: appointmentTrend.value.map(({ count }) => count),
    borderColor: '#0f766e',
    backgroundColor: '#0f766e',
    pointBackgroundColor: '#ffffff',
    pointBorderColor: '#0f766e',
    pointBorderWidth: 3,
    pointRadius: 5,
    tension: 0.2,
  }],
}))

const ratingChartData = computed(() => ({
  labels: ratingRows.value.map(({ label }) => label),
  datasets: [{
    label: 'Ratings',
    data: ratingRows.value.map(({ count }) => count),
    backgroundColor: ['#7e22ce', '#1d4ed8', '#0f766e', '#047857', '#9a3412'],
    borderColor: '#1f2933',
    borderWidth: 1,
  }],
}))

const baseOptions = {
  responsive: true,
  maintainAspectRatio: false,
  animation: prefersReducedMotion ? false : { duration: 400 },
  plugins: {
    legend: {
      labels: { color: '#1f2933', usePointStyle: true },
    },
  },
}

const statusChartOptions = {
  ...baseOptions,
  onClick: (_, elements) => {
    if (elements.length) selectedStatus.value = statusRows.value[elements[0].index].key
  },
  plugins: {
    ...baseOptions.plugins,
    tooltip: {
      callbacks: {
        label: (context) => `${context.label}: ${context.parsed} appointments`,
      },
    },
  },
}

const trendChartOptions = {
  ...baseOptions,
  scales: {
    x: { ticks: { color: '#44514b', maxRotation: 45, minRotation: 0 } },
    y: { beginAtZero: true, ticks: { color: '#44514b', precision: 0 } },
  },
  plugins: {
    ...baseOptions.plugins,
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (context) => `${context.label}: ${context.parsed.y} bookings`,
      },
    },
  },
}

const ratingChartOptions = {
  ...baseOptions,
  scales: {
    x: { ticks: { color: '#44514b' } },
    y: { beginAtZero: true, ticks: { color: '#44514b', precision: 0 } },
  },
  plugins: {
    ...baseOptions.plugins,
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (context) => `${context.label}: ${context.parsed.y} ratings`,
      },
    },
  },
}
</script>

<template>
  <section class="admin-analytics" aria-labelledby="admin-analytics-title">
    <div class="table-section-heading">
      <div>
        <p class="card-tag">Real-time Firestore analytics</p>
        <h2 id="admin-analytics-title">Interactive analytics</h2>
      </div>
      <p class="analytics-live-note">Updates automatically when Firestore data changes.</p>
    </div>

    <p v-if="loading" class="empty-state" role="status">Loading analytics...</p>
    <p v-else-if="hasError" class="form-status error" role="alert">
      Analytics data could not be loaded.
    </p>

    <div v-else class="analytics-grid">
      <article class="analytics-card" aria-labelledby="appointment-status-title">
        <div>
          <h3 id="appointment-status-title">Appointment status</h3>
          <p id="appointment-status-description">
            Current appointment totals by workflow status. Select a status or use the chart legend.
          </p>
        </div>

        <label class="analytics-control">
          Status summary
          <select v-model="selectedStatus">
            <option value="all">All statuses</option>
            <option v-for="row in statusRows" :key="row.key" :value="row.key">
              {{ row.label }}
            </option>
          </select>
        </label>
        <p class="analytics-selection" aria-live="polite">{{ selectedStatusSummary }}</p>

        <p v-if="!appointments.length" class="empty-state">
          No appointment data is available yet.
        </p>
        <div v-else class="chart-container">
          <Doughnut
            :data="statusChartData"
            :options="statusChartOptions"
            role="img"
            aria-label="Appointment status distribution chart"
            aria-describedby="appointment-status-description appointment-status-data"
          />
        </div>

        <table id="appointment-status-data" class="analytics-data-table">
          <caption>Appointment status totals</caption>
          <thead><tr><th scope="col">Status</th><th scope="col">Count</th></tr></thead>
          <tbody>
            <tr v-for="row in statusRows" :key="row.key">
              <th scope="row">{{ row.label }}</th><td>{{ row.count }}</td>
            </tr>
          </tbody>
        </table>
      </article>

      <article class="analytics-card" aria-labelledby="rating-distribution-title">
        <div>
          <h3 id="rating-distribution-title">Rating distribution</h3>
          <p id="rating-distribution-description">
            Current valid Firestore ratings grouped from one to five stars.
          </p>
        </div>

        <p v-if="!validRatingCount" class="empty-state">No ratings are available yet.</p>
        <div v-else class="chart-container">
          <Bar
            :data="ratingChartData"
            :options="ratingChartOptions"
            role="img"
            aria-label="Rating distribution chart"
            aria-describedby="rating-distribution-description rating-distribution-data"
          />
        </div>

        <table id="rating-distribution-data" class="analytics-data-table">
          <caption>Rating totals by star score</caption>
          <thead><tr><th scope="col">Score</th><th scope="col">Count</th></tr></thead>
          <tbody>
            <tr v-for="row in ratingRows" :key="row.score">
              <th scope="row">{{ row.label }}</th><td>{{ row.count }}</td>
            </tr>
          </tbody>
        </table>
      </article>

      <article class="analytics-card analytics-card-wide" aria-labelledby="booking-trend-title">
        <div>
          <h3 id="booking-trend-title">Booking trend</h3>
          <p id="booking-trend-description">
            Appointments grouped by their creation date in Australia/Melbourne time.
          </p>
        </div>

        <fieldset class="analytics-range-control">
          <legend>Booking trend time range</legend>
          <label v-for="range in timeRanges" :key="range.value">
            <input v-model="selectedRange" type="radio" name="analytics-range" :value="range.value" />
            {{ range.label }}
          </label>
        </fieldset>

        <p v-if="!appointmentTrend.length" class="empty-state">
          No bookings were created in this time range.
        </p>
        <div v-else class="chart-container chart-container-wide">
          <Line
            :data="trendChartData"
            :options="trendChartOptions"
            role="img"
            aria-label="Appointment booking trend chart"
            aria-describedby="booking-trend-description booking-trend-data"
          />
        </div>

        <div v-if="appointmentTrend.length" class="analytics-table-scroll">
          <table id="booking-trend-data" class="analytics-data-table">
            <caption>Bookings created in the selected time range</caption>
            <thead><tr><th scope="col">Melbourne date</th><th scope="col">Bookings</th></tr></thead>
            <tbody>
              <tr v-for="point in appointmentTrend" :key="point.date">
                <th scope="row">{{ point.label }}</th><td>{{ point.count }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </article>
    </div>
  </section>
</template>
