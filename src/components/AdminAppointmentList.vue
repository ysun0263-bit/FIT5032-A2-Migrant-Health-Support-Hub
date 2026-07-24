<script setup>
defineProps({
  appointments: {
    type: Array,
    required: true,
  },
  users: {
    type: Array,
    required: true,
  },
})

defineEmits(['update-status'])

const statuses = ['pending', 'confirmed', 'completed', 'cancelled']

function userLabel(appointment, users) {
  if (!appointment.userId) {
    return 'Unlinked demonstration appointment'
  }

  return users.find((user) => user.id === appointment.userId)?.fullName ?? 'Unknown user'
}
</script>

<template>
  <section class="summary-panel" aria-labelledby="admin-appointments-title">
    <h2 id="admin-appointments-title">Appointments</h2>
    <div class="responsive-table" role="region" aria-label="Appointment list">
      <table>
        <thead>
          <tr>
            <th scope="col">Booking ID</th>
            <th scope="col">User</th>
            <th scope="col">Name</th>
            <th scope="col">Topic</th>
            <th scope="col">Date</th>
            <th scope="col">Time</th>
            <th scope="col">Status</th>
            <th scope="col">Created</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="appointment in appointments" :key="appointment.id">
            <td>{{ appointment.id }}</td>
            <td>{{ userLabel(appointment, users) }}</td>
            <td>{{ appointment.fullName }}</td>
            <td>{{ appointment.supportTopic }}</td>
            <td>{{ appointment.preferredDate }}</td>
            <td>{{ appointment.preferredTime }}</td>
            <td>
              <label class="sr-only" :for="`status-${appointment.id}`">Appointment status</label>
              <select
                :id="`status-${appointment.id}`"
                :value="appointment.status"
                @change="$emit('update-status', appointment.id, $event.target.value)"
              >
                <option v-for="status in statuses" :key="status" :value="status">
                  {{ status }}
                </option>
              </select>
            </td>
            <td>{{ appointment.createdAt }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <p v-if="!appointments.length" class="empty-state">No appointments are saved yet.</p>
  </section>
</template>
