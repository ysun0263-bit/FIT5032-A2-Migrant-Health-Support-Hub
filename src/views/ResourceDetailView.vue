<script setup>
import { RouterLink } from 'vue-router'
import PlaceholderNotice from '../components/PlaceholderNotice.vue'
import SectionHeading from '../components/SectionHeading.vue'
</script>

<template>
  <div class="page-stack">
    <article class="content-section detail-layout">
      <div class="detail-main">
        <SectionHeading
          level="h1"
          eyebrow="Resource detail"
          title="Understanding Medicare basics"
          text="An example resource detail page showing how plain-language health information will be presented."
        />

        <div class="tag-row" aria-label="Resource labels">
          <span>Health system</span>
          <span>English</span>
          <span>Interpreter support</span>
        </div>

        <h2>Plain-language explanation</h2>
        <p>
          Medicare helps eligible people access many health services in Australia. New arrivals may
          need support understanding eligibility, enrolment steps, and how to book a GP appointment.
        </p>
        <p>
          This example text is original course demonstration content. It does not copy a real
          charity or government website and should be replaced with verified resources in later
          phases if required by the assignment scope.
        </p>

        <div class="action-row">
          <button type="button" disabled>Save Resource</button>
          <RouterLink class="button primary" to="/appointments">Book Support Appointment</RouterLink>
        </div>

        <PlaceholderNotice text="Ratings and saved resources are not implemented in Phase 1." />
      </div>

      <aside class="related-panel" aria-labelledby="related-services-title">
        <h2 id="related-services-title">Related services</h2>
        <ul class="plain-list">
          <li>Community health access desk</li>
          <li>Interpreter booking support</li>
          <li>New arrival health orientation</li>
        </ul>
      </aside>
    </article>
  </div>
</template>
