<script setup>
import FeatureCard from '../components/FeatureCard.vue'
import PlaceholderNotice from '../components/PlaceholderNotice.vue'
import SectionHeading from '../components/SectionHeading.vue'

const resources = [
  {
    title: 'Understanding Medicare',
    text: 'A simple introduction to Medicare access, GP visits, and common documents new arrivals may need.',
    tag: 'Health system',
  },
  {
    title: 'Finding mental health support',
    text: 'Example guidance for choosing culturally safe counselling, community support, and crisis pathways.',
    tag: 'Wellbeing',
  },
  {
    title: 'Preparing for a clinic visit',
    text: 'A checklist-style resource for language support, questions to ask, and follow-up planning.',
    tag: 'Appointments',
  },
]
</script>

<template>
  <div class="page-stack">
    <section class="content-section">
      <SectionHeading
        level="h1"
        eyebrow="Health Resources"
        title="Search and browse health information"
        text="This Phase 1 page shows the visual structure for resource discovery. Dynamic search and filtering will be implemented in a later phase."
      />

      <div class="search-panel" aria-label="Resource search placeholder">
        <label for="resource-search">Search resources</label>
        <input
          id="resource-search"
          type="search"
          placeholder="Search will be enabled in a later phase"
          disabled
        >
        <div class="filter-row" aria-label="Filter placeholders">
          <button type="button" disabled>Language</button>
          <button type="button" disabled>Topic</button>
          <button type="button" disabled>Service type</button>
        </div>
      </div>

      <PlaceholderNotice text="Dynamic search, filters, and saved resources are intentionally not implemented in Phase 1." />

      <div class="card-grid three">
        <FeatureCard
          v-for="resource in resources"
          :key="resource.title"
          :title="resource.title"
          :text="resource.text"
          :tag="resource.tag"
        >
          <RouterLink class="text-link" to="/resources/medicare-basics">View example detail</RouterLink>
        </FeatureCard>
      </div>
    </section>
  </div>
</template>
