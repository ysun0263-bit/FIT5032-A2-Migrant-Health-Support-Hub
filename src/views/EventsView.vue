<script setup>
import { computed } from 'vue'
import EventCard from '../components/EventCard.vue'
import PlaceholderNotice from '../components/PlaceholderNotice.vue'
import SectionHeading from '../components/SectionHeading.vue'
import { healthEvents } from '../data/healthEvents'

const sortedEvents = computed(() =>
  [...healthEvents].sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`)),
)
</script>

<template>
  <section class="content-section page-stack">
    <SectionHeading
      level="h1"
      eyebrow="Events"
      title="Community health events"
      text="Events are rendered from JavaScript data and sorted by date. Registration buttons remain disabled because formal registration is not part of Phase 2."
    />
    <div class="card-grid three">
      <EventCard v-for="event in sortedEvents" :key="event.id" :event="event" />
    </div>
    <PlaceholderNotice text="Formal event registration is not implemented in Phase 2." />
  </section>
</template>
