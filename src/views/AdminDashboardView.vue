<script setup>
import { computed, ref, watch } from 'vue'
import AdminAnalytics from '../components/AdminAnalytics.vue'
import AdminAppointmentList from '../components/AdminAppointmentList.vue'
import AdminEmailPanel from '../components/AdminEmailPanel.vue'
import AdminUserList from '../components/AdminUserList.vue'
import FeatureCard from '../components/FeatureCard.vue'
import SectionHeading from '../components/SectionHeading.vue'
import { useConnectivity } from '../composables/useConnectivity.js'
import { useAppointments } from '../composables/useAppointments.js'
import { healthEvents } from '../data/healthEvents'
import { healthResources } from '../data/healthResources'
import {
  adminUsersError,
  adminUsersLoading,
  getUsers,
  isAdmin,
} from '../stores/authStore.js'
import { useRatings } from '../stores/ratingStore.js'

const {
  appointments,
  appointmentsLoading,
  appointmentsError,
  updateAppointmentStatus,
} = useAppointments()
const { isOnline } = useConnectivity()
const { ratings, ratingsLoading, ratingsError, getAverageRating, getRatingCount } = useRatings()
const users = computed(() => getUsers())
const selectedRecipientIds = ref(new Set())
const selectedUsers = computed(() =>
  users.value.filter((user) => user.active && selectedRecipientIds.value.has(user.uid ?? user.id)),
)

function toggleRecipient(userId) {
  if (!userId) return
  const nextSelection = new Set(selectedRecipientIds.value)
  if (nextSelection.has(userId)) nextSelection.delete(userId)
  else nextSelection.add(userId)
  selectedRecipientIds.value = nextSelection
}

function selectVisibleRecipients(userIds) {
  selectedRecipientIds.value = new Set([...selectedRecipientIds.value, ...userIds])
}

function clearRecipientSelection() {
  selectedRecipientIds.value = new Set()
}

watch(users, (currentUsers) => {
  const activeIds = new Set(
    currentUsers.filter((user) => user.active).map((user) => user.uid ?? user.id),
  )
  selectedRecipientIds.value = new Set(
    [...selectedRecipientIds.value].filter((userId) => activeIds.has(userId)),
  )
})
const ratedResources = computed(() =>
  healthResources.filter((resource) => getRatingCount(resource.id) > 0),
)
const overallAverageRating = computed(() => {
  const validRatings = ratings.value

  if (!validRatings.length) {
    return null
  }

  const total = validRatings.reduce((sum, rating) => sum + rating.score, 0)
  return Math.round((total / validRatings.length) * 10) / 10
})
const highestRatedResource = computed(() => {
  return ratedResources.value
    .map((resource) => ({ resource, average: getAverageRating(resource.id) }))
    .sort((a, b) => b.average - a.average || a.resource.title.localeCompare(b.resource.title))[0]
})
const mostRatedResource = computed(() => {
  return ratedResources.value
    .map((resource) => ({ resource, count: getRatingCount(resource.id) }))
    .sort((a, b) => b.count - a.count || a.resource.title.localeCompare(b.resource.title))[0]
})
const metrics = computed(() => {
  const statusCount = (status) =>
    appointments.value.filter((appointment) => appointment.status === status).length

  return [
    {
      title: 'Total users',
      text: adminUsersLoading.value ? 'Loading...' : `${users.value.length}`,
      tag: 'Accounts',
    },
    {
      title: 'Standard users',
      text: `${users.value.filter((user) => user.role === 'user').length}`,
      tag: 'Users',
    },
    {
      title: 'Admin users',
      text: `${users.value.filter((user) => user.role === 'admin').length}`,
      tag: 'Admins',
    },
    {
      title: 'Total appointments',
      text: appointmentsLoading.value ? 'Loading…' : `${appointments.value.length}`,
      tag: 'Bookings',
    },
    { title: 'Pending appointments', text: `${statusCount('pending')}`, tag: 'Status' },
    { title: 'Confirmed appointments', text: `${statusCount('confirmed')}`, tag: 'Status' },
    { title: 'Completed appointments', text: `${statusCount('completed')}`, tag: 'Status' },
    { title: 'Total resources', text: `${healthResources.length}`, tag: 'Content' },
    { title: 'Total events', text: `${healthEvents.length}`, tag: 'Events' },
    {
      title: 'Total ratings',
      text: ratingsLoading.value ? 'Loading…' : `${ratings.value.length}`,
      tag: 'Ratings',
    },
    { title: 'Rated resources', text: `${ratedResources.value.length}`, tag: 'Ratings' },
    {
      title: 'Overall average rating',
      text: overallAverageRating.value ? `${overallAverageRating.value.toFixed(1)} / 5` : 'No ratings yet',
      tag: 'Ratings',
    },
    {
      title: 'Highest-rated resource',
      text: highestRatedResource.value
        ? `${highestRatedResource.value.resource.title} (${highestRatedResource.value.average.toFixed(1)})`
        : 'No ratings yet',
      tag: 'Ratings',
    },
    {
      title: 'Most-rated resource',
      text: mostRatedResource.value
        ? `${mostRatedResource.value.resource.title} (${mostRatedResource.value.count})`
        : 'No ratings yet',
      tag: 'Ratings',
    },
  ]
})
</script>

<template>
  <section class="content-section page-stack">
    <SectionHeading
      level="h1"
      eyebrow="Admin Dashboard"
      title="Administration"
      text="Admin-only dashboard for viewing demonstration users, appointments, and content statistics."
    />

    <div class="placeholder-notice">
      <strong>Live administration tools</strong>
      <p>
        Users, appointments, and ratings are loaded in real time from Cloud Firestore. Admin
        tables support combined search, sorting, pagination, and filtered CSV/PDF exports.
      </p>
    </div>

    <p v-if="!isOnline" class="offline-feature-message" role="status">
      Live admin data may be unavailable while offline. Previously loaded aggregate information
      can still be reviewed, but remote changes and email delivery are disabled.
    </p>

    <p v-if="ratingsError" class="form-status error" role="alert">{{ ratingsError }}</p>

    <div v-if="isAdmin" class="page-stack">
      <div class="card-grid three">
        <FeatureCard
          v-for="metric in metrics"
          :key="metric.title"
          :title="metric.title"
          :text="metric.text"
          :tag="metric.tag"
        />
      </div>

      <AdminAnalytics
        :appointments="appointments"
        :ratings="ratings"
        :appointments-loading="appointmentsLoading"
        :ratings-loading="ratingsLoading"
        :appointments-error="appointmentsError"
        :ratings-error="ratingsError"
      />

      <AdminUserList
        :users="users"
        :loading="adminUsersLoading"
        :error="adminUsersError"
        :selected-recipient-ids="[...selectedRecipientIds]"
        @toggle-recipient="toggleRecipient"
        @select-visible="selectVisibleRecipients"
        @clear-selection="clearRecipientSelection"
      />
      <AdminEmailPanel
        :selected-users="selectedUsers"
        @clear-selection="clearRecipientSelection"
      />
      <AdminAppointmentList
        :appointments="appointments"
        :loading="appointmentsLoading"
        :error="appointmentsError"
        :network-disabled="!isOnline"
        @update-status="updateAppointmentStatus"
      />
    </div>

    <div v-else class="empty-state">
      <h2>Admin role required</h2>
      <p>Your current account does not have admin dashboard access.</p>
    </div>
  </section>
</template>
