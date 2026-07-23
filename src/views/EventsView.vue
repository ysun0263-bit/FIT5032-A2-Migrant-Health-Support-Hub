<script setup>
import FeatureCard from '../components/FeatureCard.vue'
import PlaceholderNotice from '../components/PlaceholderNotice.vue'
import SectionHeading from '../components/SectionHeading.vue'

const events = [
  {
    title: 'Health system orientation',
    text: 'A sample workshop for new arrivals learning how to access GPs, pharmacies, and interpreters.',
    tag: 'Workshop',
  },
  {
    title: 'Wellbeing conversation circle',
    text: 'A sample community event focused on social connection and mental wellbeing support pathways.',
    tag: 'Community',
  },
  {
    title: 'Preparing for appointments',
    text: 'A sample session about questions to ask, documents to bring, and follow-up planning.',
    tag: 'Information',
  },
]
</script>

<template>
  <section class="content-section page-stack">
    <SectionHeading
      level="h1"
      eyebrow="Events"
      title="Community health events"
      text="This page displays example event cards only. Event registration will be considered in a later phase."
    />
    <div class="card-grid three">
      <FeatureCard
        v-for="event in events"
        :key="event.title"
        :title="event.title"
        :text="event.text"
        :tag="event.tag"
      />
    </div>
    <PlaceholderNotice text="Formal event registration is not implemented in Phase 1." />
  </section>
</template>
