<script setup>
import PlaceholderNotice from '../components/PlaceholderNotice.vue'
import SectionHeading from '../components/SectionHeading.vue'
</script>

<template>
  <section class="content-section narrow page-stack">
    <SectionHeading
      level="h1"
      eyebrow="Register"
      title="Create an account"
      text="This form is a visual placeholder for the later registration and validation phase."
    />
    <form class="form-panel" aria-label="Registration placeholder">
      <label>
        Full name
        <input type="text" placeholder="Full name" disabled>
      </label>
      <label>
        Email
        <input type="email" placeholder="name@example.com" disabled>
      </label>
      <label>
        Password
        <input type="password" placeholder="Password" disabled>
      </label>
      <button type="button" disabled>Registration enabled in a later phase</button>
    </form>
    <PlaceholderNotice text="No user data is validated, created, or stored during Phase 1." />
  </section>
</template>
