<script setup>
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { findResourceById } from '../data/healthResources'
import { findServicesByIds } from '../data/healthServices'
import PlaceholderNotice from '../components/PlaceholderNotice.vue'
import ServiceCard from '../components/ServiceCard.vue'
import SectionHeading from '../components/SectionHeading.vue'

const route = useRoute()

const resource = computed(() => findResourceById(route.params.id))
const relatedServices = computed(() =>
  resource.value ? findServicesByIds(resource.value.relatedServiceIds) : [],
)
</script>

<template>
  <div class="page-stack">
    <article v-if="resource" class="content-section detail-layout">
      <div class="detail-main">
        <SectionHeading
          level="h1"
          eyebrow="Resource detail"
          :title="resource.title"
          :text="resource.summary"
        />

        <div class="tag-row" aria-label="Resource labels">
          <span>{{ resource.topic }}</span>
          <span>{{ resource.language }}</span>
          <span>{{ resource.serviceType }}</span>
          <span>{{ resource.audience }}</span>
        </div>

        <h2>Plain-language explanation</h2>
        <p>{{ resource.fullDescription }}</p>

        <dl class="compact-list detail-facts">
          <div>
            <dt>Last updated</dt>
            <dd>{{ resource.lastUpdated }}</dd>
          </div>
          <div>
            <dt>Featured resource</dt>
            <dd>{{ resource.featured ? 'Yes' : 'No' }}</dd>
          </div>
        </dl>

        <aside class="alert-band-inline">
          <h2>Emergency disclaimer</h2>
          <p>{{ resource.emergencyDisclaimer }}</p>
        </aside>

        <div class="action-row">
          <button type="button" disabled>Save Resource later</button>
          <RouterLink class="button primary" to="/appointments">Book Support Appointment</RouterLink>
        </div>

        <PlaceholderNotice text="Ratings and saved resources are not implemented in Phase 2." />
        <RouterLink class="text-link" to="/resources">Back to all resources</RouterLink>
      </div>

      <aside class="related-panel" aria-labelledby="related-services-title">
        <h2 id="related-services-title">Related services</h2>
        <div class="related-stack">
          <ServiceCard v-for="service in relatedServices" :key="service.id" :service="service" />
        </div>
      </aside>
    </article>

    <section v-else class="content-section narrow page-stack">
      <SectionHeading
        level="h1"
        eyebrow="Resource not found"
        title="Resource not found"
        text="The requested health resource does not exist in the current demonstration data."
      />
      <RouterLink class="button primary" to="/resources">Back to resources</RouterLink>
    </section>
  </div>
</template>
