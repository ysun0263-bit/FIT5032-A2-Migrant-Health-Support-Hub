<script setup>
defineProps({
  appointments: {
    type: Array,
    required: true,
  },
})

const emit = defineEmits(['delete'])

function requestDelete(appointment) {
  const confirmed = window.confirm(
    `Delete demonstration booking ${appointment.id} from this device?`,
  )

  if (confirmed) {
    emit('delete', appointment.id)
  }
}
</script>

<template>
  <section class="content-section" aria-labelledby="saved-appointments-title">
    <div class="section-heading">
      <p class="eyebrow">Appointments saved on this device</p>
      <h2 id="saved-appointments-title">Demonstration appointment list</h2>
      <p>
        These records are stored only in this browser's Local Storage for coursework demonstration.
        They are not a secure personal medical account.
      </p>
    </div>

    <div v-if="appointments.length" class="appointment-list">
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
        <button type="button" @click="requestDelete(appointment)">Delete demo booking</button>
      </article>
    </div>

    <p v-else class="empty-state">No appointments are saved on this device yet.</p>
  </section>
</template>
