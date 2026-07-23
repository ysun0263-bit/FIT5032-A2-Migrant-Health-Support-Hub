<script setup>
import { RouterLink } from 'vue-router'
import FeatureCard from '../components/FeatureCard.vue'
import PageHero from '../components/PageHero.vue'
import SectionHeading from '../components/SectionHeading.vue'

const entryPoints = [
  {
    title: 'Search Health Resources',
    text: 'Browse plain-language information about the Australian health system, care pathways, and support options.',
    to: '/resources',
  },
  {
    title: 'Book an Appointment',
    text: 'Preview the appointment pathway for requesting help from support workers or community volunteers.',
    to: '/appointments',
  },
  {
    title: 'Find Nearby Services',
    text: 'Explore example local clinics, interpreter supports, and community health services.',
    to: '/services',
  },
]

const strengths = [
  'Plain-language health guidance for new arrivals',
  'Service pathways designed around migrant community needs',
  'Calm, accessible pages that work on mobile and desktop',
]
</script>

<template>
  <div class="page-stack">
    <PageHero
      eyebrow="Assessment 2 foundation"
      title="Migrant Health Support Hub"
      description="A responsive Vue application foundation for helping migrant communities in Australia find health resources, services, appointments, and events."
    >
      <div class="hero-actions">
        <RouterLink class="button primary" to="/resources">Search resources</RouterLink>
        <RouterLink class="button secondary" to="/services">Find services</RouterLink>
      </div>
    </PageHero>

    <section class="content-section">
      <SectionHeading
        title="Start with the support you need"
        text="These entry points reflect the Assessment 1 design scope while keeping Phase 1 focused on layout and routing."
      />
      <div class="card-grid three">
        <FeatureCard
          v-for="item in entryPoints"
          :key="item.title"
          :title="item.title"
          :text="item.text"
        >
          <RouterLink class="text-link" :to="item.to">Open section</RouterLink>
        </FeatureCard>
      </div>
    </section>

    <section class="alert-band" aria-labelledby="urgent-help-title">
      <div>
        <p class="eyebrow">Urgent help</p>
        <h2 id="urgent-help-title">This website is not an emergency medical service.</h2>
        <p>
          For a life-threatening emergency in Australia, call 000. For health advice, contact a
          qualified health professional or an appropriate local service.
        </p>
      </div>
    </section>

    <section class="content-section split-section">
      <div>
        <SectionHeading
          title="Built for calm and inclusive access"
          text="The first implementation phase establishes a responsive, accessible structure that later phases can extend with real data, validation, accounts, and ratings."
        />
      </div>
      <ul class="check-list" aria-label="Project strengths">
        <li v-for="item in strengths" :key="item">{{ item }}</li>
      </ul>
    </section>
  </div>
</template>
