<script setup>
import { computed } from 'vue'
import AdminAppointmentList from '../components/AdminAppointmentList.vue'
import AdminUserList from '../components/AdminUserList.vue'
import FeatureCard from '../components/FeatureCard.vue'
import PlaceholderNotice from '../components/PlaceholderNotice.vue'
import SectionHeading from '../components/SectionHeading.vue'
import { useAppointments } from '../composables/useAppointments.js'
import { healthEvents } from '../data/healthEvents'
import { healthResources } from '../data/healthResources'
import { getUsers, isAdmin } from '../stores/authStore.js'
import { useRatings } from '../stores/ratingStore.js'

const {
  appointments,
  appointmentsLoading,
  appointmentsError,
  updateAppointmentStatus,
} = useAppointments()
const { ratings, ratingsLoading, ratingsError, getAverageRating, getRatingCount } = useRatings()
const users = computed(() => getUsers())
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
    { title: 'Total users', text: `${users.value.length}`, tag: 'Accounts' },
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

    <PlaceholderNotice text="Users, appointments, and ratings are loaded in real time from Cloud Firestore. Interactive table controls and exports are planned for Phase 2B." />

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

      <AdminUserList :users="users" />
      <AdminAppointmentList
        :appointments="appointments"
        :users="users"
        :loading="appointmentsLoading"
        :error="appointmentsError"
        @update-status="updateAppointmentStatus"
      />
    </div>

    <div v-else class="empty-state">
      <h2>Admin role required</h2>
      <p>Your current account does not have admin dashboard access.</p>
    </div>
  </section>
</template>
