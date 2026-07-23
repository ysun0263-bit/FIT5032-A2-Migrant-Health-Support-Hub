<script setup>
import FeatureCard from '../components/FeatureCard.vue'
import PlaceholderNotice from '../components/PlaceholderNotice.vue'
import SectionHeading from '../components/SectionHeading.vue'

const metrics = [
  { title: 'Users', text: 'Static placeholder for future registered user count.', tag: '0 demo' },
  { title: 'Appointments', text: 'Static placeholder for future booking request count.', tag: '0 demo' },
  { title: 'Resources', text: 'Static placeholder for future managed resource count.', tag: '3 demo' },
]
</script>

<template>
  <section class="content-section page-stack">
    <SectionHeading
      level="h1"
      eyebrow="Admin Dashboard"
      title="Administration placeholder"
      text="This page provides the visual dashboard foundation. It does not implement real permissions or live data in Phase 1."
    />
    <div class="card-grid three">
      <FeatureCard
        v-for="metric in metrics"
        :key="metric.title"
        :title="metric.title"
        :text="metric.text"
        :tag="metric.tag"
      />
    </div>
    <PlaceholderNotice text="Admin role access control and real dashboard data will be implemented in later phases." />
  </section>
</template>
