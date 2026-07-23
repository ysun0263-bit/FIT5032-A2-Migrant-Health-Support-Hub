<script setup>
import FeatureCard from '../components/FeatureCard.vue'
import SectionHeading from '../components/SectionHeading.vue'

const services = [
  {
    title: 'Community clinic support',
    text: 'Example local clinic card for GP referrals, health checks, and care navigation.',
    tag: 'Clinic',
  },
  {
    title: 'Interpreter pathway',
    text: 'Example service card for language support when booking or attending health appointments.',
    tag: 'Language',
  },
  {
    title: 'Settlement health guidance',
    text: 'Example community support card for new arrivals learning how Australian health services work.',
    tag: 'Community',
  },
]
</script>

<template>
  <section class="content-section page-stack">
    <SectionHeading
      level="h1"
      eyebrow="Find Services"
      title="Local service information"
      text="Example cards show the planned service directory layout. Real nearby-service logic is not part of Phase 1."
    />
    <div class="card-grid three">
      <FeatureCard
        v-for="service in services"
        :key="service.title"
        :title="service.title"
        :text="service.text"
        :tag="service.tag"
      />
    </div>
  </section>
</template>
