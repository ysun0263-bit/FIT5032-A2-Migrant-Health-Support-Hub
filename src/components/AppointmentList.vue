<script setup>
defineProps({
  appointments: {
    type: Array,
    required: true,
  },
  emptyText: {
    type: String,
    default: 'No appointments are saved on this device yet.',
  },
  loading: {
    type: Boolean,
    default: false,
  },
  error: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['delete'])

function requestDelete(appointment) {
  const confirmed = window.confirm(
    `Delete appointment ${appointment.id}?`,
  )

  if (confirmed) {
    emit('delete', appointment.id)
  }
}
</script>

<template>
  <section class="content-section" aria-labelledby="saved-appointments-title">
    <div class="section-heading">
      <p class="eyebrow">Your appointments</p>
      <h2 id="saved-appointments-title">Appointment list</h2>
      <p>
        These records are stored in Cloud Firestore and are visible only to their owner and active
        administrators. They are not medical records.
      </p>
    </div>

    <p v-if="loading" class="empty-state" role="status">Loading appointments…</p>
    <p v-else-if="error" class="form-status error" role="alert">{{ error }}</p>
    <div v-else-if="appointments.length" class="appointment-list">
      <article v-for="appointment in appointments" :key="appointment.id" class="summary-panel">
        <div>
          <h3>{{ appointment.supportTopic }}</h3>
          <p>{{ appointment.fullName }} · {{ appointment.preferredLanguage }}</p>
        </div>
        <dl class="compact-list">
          <div>
            <dt>Date</dt>
            <dd>{{ appointment.preferredDate }}</dd>
          </div>
          <div>
            <dt>Time</dt>
            <dd>{{ appointment.preferredTime }}</dd>
          </div>
          <div>
            <dt>Status</dt>
            <dd>{{ appointment.status }}</dd>
          </div>
        </dl>
        <button type="button" @click="requestDelete(appointment)">Delete appointment</button>
      </article>
    </div>

    <p v-else class="empty-state">{{ emptyText }}</p>
  </section>
</template>
