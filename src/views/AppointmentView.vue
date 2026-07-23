<script setup>
import PlaceholderNotice from '../components/PlaceholderNotice.vue'
import SectionHeading from '../components/SectionHeading.vue'
</script>

<template>
  <section class="content-section page-stack">
    <SectionHeading
      level="h1"
      eyebrow="Appointments"
      title="Request support appointment"
      text="This form is a visual foundation based on the Assessment 1 booking flow. Validation and appointment storage will be added later."
    />

    <form class="form-panel" aria-label="Appointment request placeholder">
      <div class="form-grid">
        <label>
          Full name
          <input type="text" placeholder="Example: Amina Hassan" disabled>
        </label>
        <label>
          Email
          <input type="email" placeholder="name@example.com" disabled>
        </label>
        <label>
          Preferred language
          <select disabled>
            <option>English</option>
          </select>
        </label>
        <label>
          Support topic
          <select disabled>
            <option>Health resource guidance</option>
          </select>
        </label>
        <label>
          Preferred date
          <input type="date" disabled>
        </label>
        <label>
          Preferred time
          <input type="time" disabled>
        </label>
      </div>
      <label>
        Notes
        <textarea rows="4" placeholder="Tell us what kind of support you need" disabled></textarea>
      </label>
      <button type="button" disabled>Booking submission enabled in a later phase</button>
    </form>

    <PlaceholderNotice text="No appointment data is validated, submitted, or saved during Phase 1." />
  </section>
</template>
