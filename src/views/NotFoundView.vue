<script setup>
import { RouterLink } from 'vue-router'
import SectionHeading from '../components/SectionHeading.vue'
</script>

<template>
  <section class="content-section narrow page-stack">
    <SectionHeading
      level="h1"
      eyebrow="Not found"
      title="Page not found"
      text="The page you requested is not available in the Migrant Health Support Hub."
    />
    <RouterLink class="button primary" to="/">Return home</RouterLink>
  </section>
</template>
