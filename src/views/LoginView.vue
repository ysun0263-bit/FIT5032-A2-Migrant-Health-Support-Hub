<script setup>
import { RouterLink } from 'vue-router'
import PlaceholderNotice from '../components/PlaceholderNotice.vue'
import SectionHeading from '../components/SectionHeading.vue'
</script>

<template>
  <section class="content-section narrow page-stack">
    <SectionHeading
      level="h1"
      eyebrow="Login"
      title="Account access"
      text="The login interface is prepared for a later authentication phase."
    />
    <form class="form-panel" aria-label="Login placeholder">
      <label>
        Email
        <input type="email" placeholder="name@example.com" disabled>
      </label>
      <label>
        Password
        <input type="password" placeholder="Password" disabled>
      </label>
      <button type="button" disabled>Login enabled in a later phase</button>
    </form>
    <p>Need an account? <RouterLink class="text-link" to="/register">View register page</RouterLink></p>
    <PlaceholderNotice text="No authentication logic, session storage, or user account lookup is implemented in Phase 1." />
  </section>
</template>
