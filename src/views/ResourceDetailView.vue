<script setup>
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { findResourceById } from '../data/healthResources.js'
import { findServicesByIds } from '../data/healthServices.js'
import PlaceholderNotice from '../components/PlaceholderNotice.vue'
import RatingDistribution from '../components/RatingDistribution.vue'
import RatingInput from '../components/RatingInput.vue'
import RatingSummary from '../components/RatingSummary.vue'
import ServiceCard from '../components/ServiceCard.vue'
import SectionHeading from '../components/SectionHeading.vue'
import { currentUser, isAuthenticated } from '../stores/authStore.js'
import { useRatings } from '../stores/ratingStore.js'

const route = useRoute()

const resource = computed(() => findResourceById(route.params.id))
const relatedServices = computed(() =>
  resource.value ? findServicesByIds(resource.value.relatedServiceIds) : [],
)
const {
  getAverageRating,
  getRatingCount,
  getRatingDistribution,
  getUserRating,
  submitOrUpdateRating,
} = useRatings()
const averageRating = computed(() => (resource.value ? getAverageRating(resource.value.id) : null))
const ratingCount = computed(() => (resource.value ? getRatingCount(resource.value.id) : 0))
const ratingDistribution = computed(() =>
  resource.value ? getRatingDistribution(resource.value.id) : { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
)
const userRating = computed(() =>
  resource.value && currentUser.value ? getUserRating(resource.value.id, currentUser.value.id) : null,
)

function handleRatingSubmit(score) {
  submitOrUpdateRating(resource.value.id, currentUser.value.id, score)
}
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

        <section class="rating-section" aria-labelledby="resource-rating-title">
          <h2 id="resource-rating-title">Resource rating</h2>
          <RatingSummary :average="averageRating" :count="ratingCount" />
          <RatingDistribution :distribution="ratingDistribution" :total="ratingCount" />

          <RatingInput
            v-if="isAuthenticated"
            :current-score="userRating?.score"
            @submit="handleRatingSubmit"
          />
          <div v-else class="placeholder-notice">
            <strong>Login to rate this resource</strong>
            <p>
              You can view ratings as a guest, but you need to login before submitting your own
              rating.
              <RouterLink
                class="text-link"
                :to="{ name: 'login', query: { redirect: route.fullPath } }"
              >
                Login to rate
              </RouterLink>
            </p>
          </div>
        </section>

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
