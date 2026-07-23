<script setup>
import PlaceholderNotice from '../components/PlaceholderNotice.vue'
import SectionHeading from '../components/SectionHeading.vue'
</script>

<template>
  <section class="content-section narrow page-stack">
    <SectionHeading
      level="h1"
      eyebrow="Profile"
      title="User account placeholder"
      text="This page shows the planned account area without implementing login checks or personal data."
    />
    <div class="summary-panel">
      <h2>Future account features</h2>
      <ul class="plain-list">
        <li>Saved resources</li>
        <li>Appointment requests</li>
        <li>Preferred language</li>
      </ul>
    </div>
    <PlaceholderNotice text="Route guards and user-specific account data are intentionally not implemented in Phase 1." />
  </section>
</template>
