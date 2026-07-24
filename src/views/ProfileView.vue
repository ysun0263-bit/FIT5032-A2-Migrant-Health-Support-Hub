<script setup>
import { computed } from 'vue'
import AppointmentList from '../components/AppointmentList.vue'
import PlaceholderNotice from '../components/PlaceholderNotice.vue'
import SectionHeading from '../components/SectionHeading.vue'
import { useAppointments } from '../composables/useAppointments.js'
import { currentUser } from '../stores/authStore.js'

const { appointments, deleteAppointment } = useAppointments()
const userAppointments = computed(() =>
  appointments.value.filter((appointment) => appointment.userId === currentUser.value?.id),
)
const pendingAppointments = computed(
  () => userAppointments.value.filter((appointment) => appointment.status === 'pending').length,
)

function handleDelete(id) {
  deleteAppointment(id, currentUser.value.id)
}
</script>

<template>
  <div class="page-stack">
    <section class="content-section narrow page-stack">
      <SectionHeading
        level="h1"
        eyebrow="Profile"
        title="Your account"
        text="This page shows the current authenticated user's demonstration account information."
      />

      <PlaceholderNotice text="This is not a secure personal medical account. User and appointment records are stored in this browser's Local Storage for coursework demonstration." />

      <div class="summary-panel">
        <h2>Account details</h2>
        <dl class="confirmation-grid">
          <div>
            <dt>Name</dt>
            <dd>{{ currentUser.fullName }}</dd>
          </div>
          <div>
            <dt>Email</dt>
            <dd>{{ currentUser.email }}</dd>
          </div>
          <div>
            <dt>Role</dt>
            <dd>{{ currentUser.role }}</dd>
          </div>
          <div>
            <dt>Created</dt>
            <dd>{{ currentUser.createdAt }}</dd>
          </div>
          <div>
            <dt>Your appointments</dt>
            <dd>{{ userAppointments.length }}</dd>
          </div>
          <div>
            <dt>Pending appointments</dt>
            <dd>{{ pendingAppointments }}</dd>
          </div>
        </dl>
      </div>
    </section>

    <AppointmentList
      :appointments="userAppointments"
      empty-text="You do not have any appointments linked to this account yet."
      @delete="handleDelete"
    />
  </div>
</template>
