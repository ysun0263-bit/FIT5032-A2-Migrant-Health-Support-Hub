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

const { appointments, updateAppointmentStatus } = useAppointments()
const users = computed(() => getUsers())
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
    { title: 'Total appointments', text: `${appointments.value.length}`, tag: 'Bookings' },
    { title: 'Pending appointments', text: `${statusCount('pending')}`, tag: 'Status' },
    { title: 'Confirmed appointments', text: `${statusCount('confirmed')}`, tag: 'Status' },
    { title: 'Completed appointments', text: `${statusCount('completed')}`, tag: 'Status' },
    { title: 'Total resources', text: `${healthResources.length}`, tag: 'Content' },
    { title: 'Total events', text: `${healthEvents.length}`, tag: 'Events' },
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

    <PlaceholderNotice text="Admin access is role-checked, but this is still a front-end Local Storage course demo, not production administration." />

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
        @update-status="updateAppointmentStatus"
      />
    </div>

    <div v-else class="empty-state">
      <h2>Admin role required</h2>
      <p>Your current account does not have admin dashboard access.</p>
    </div>
  </section>
</template>
