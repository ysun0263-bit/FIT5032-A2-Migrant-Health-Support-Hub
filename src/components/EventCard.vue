<script setup>
defineProps({
  event: {
    type: Object,
    required: true,
  },
})
</script>

<template>
  <article class="feature-card">
    <div class="card-meta">
      <span>{{ event.date }}</span>
      <span>{{ event.time }}</span>
    </div>
    <h2>{{ event.title }}</h2>
    <p>{{ event.description }}</p>
    <dl class="compact-list">
      <div>
        <dt>Location</dt>
        <dd>{{ event.location }}</dd>
      </div>
      <div>
        <dt>Language</dt>
        <dd>{{ event.language }}</dd>
      </div>
      <div>
        <dt>Capacity</dt>
        <dd>{{ event.capacity }} people</dd>
      </div>
    </dl>
    <p class="status-pill" :class="{ muted: event.registrationStatus === 'Full' }">
      {{ event.registrationStatus === 'Full' ? 'Full' : 'Registration placeholder' }}
    </p>
    <button type="button" disabled>
      {{ event.registrationStatus === 'Full' ? 'Event full' : 'Register later' }}
    </button>
  </article>
</template>
