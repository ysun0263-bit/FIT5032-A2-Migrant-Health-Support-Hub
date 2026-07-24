<script setup>
import { RouterLink } from 'vue-router'
import { isAuthenticated } from '../stores/authStore.js'
import SectionHeading from '../components/SectionHeading.vue'
</script>

<template>
  <section class="content-section narrow page-stack">
    <SectionHeading
      level="h1"
      eyebrow="Access restricted"
      title="Unauthorized"
      text="Your current account does not have permission to open this page."
    />
    <div class="action-row">
      <RouterLink class="button primary" to="/">Return home</RouterLink>
      <RouterLink v-if="isAuthenticated" class="button secondary" to="/profile">Go to profile</RouterLink>
    </div>
  </section>
</template>
