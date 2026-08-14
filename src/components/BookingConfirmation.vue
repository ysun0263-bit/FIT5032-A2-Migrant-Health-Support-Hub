<script setup>
defineProps({
  booking: {
    type: Object,
    required: true,
  },
})
</script>

<template>
  <section class="confirmation-panel" aria-labelledby="booking-confirmation-title" tabindex="-1">
    <h2 id="booking-confirmation-title">Booking confirmation</h2>
    <p>
      Your demonstration booking has been linked to your Firebase account and saved on this
      device. It is not a medical record.
    </p>
    <dl class="confirmation-grid">
      <div>
        <dt>Booking ID</dt>
        <dd>{{ booking.id }}</dd>
      </div>
      <div>
        <dt>Name</dt>
        <dd>{{ booking.fullName }}</dd>
      </div>
      <div>
        <dt>Language</dt>
        <dd>{{ booking.preferredLanguage }}</dd>
      </div>
      <div>
        <dt>Support topic</dt>
        <dd>{{ booking.supportTopic }}</dd>
      </div>
      <div>
        <dt>Date</dt>
        <dd>{{ booking.preferredDate }}</dd>
      </div>
      <div>
        <dt>Time</dt>
        <dd>{{ booking.preferredTime }}</dd>
      </div>
      <div>
        <dt>Status</dt>
        <dd>{{ booking.status }}</dd>
      </div>
    </dl>
  </section>
</template>
