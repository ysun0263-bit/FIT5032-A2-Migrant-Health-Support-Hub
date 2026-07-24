<script setup>
import RatingSummary from './RatingSummary.vue'
import { useRatings } from '../stores/ratingStore.js'

const props = defineProps({
  resource: {
    type: Object,
    required: true,
  },
})

const { getAverageRating, getRatingCount } = useRatings()
</script>

<template>
  <article class="feature-card resource-card">
    <div class="card-meta">
      <span>{{ resource.topic }}</span>
      <span>{{ resource.language }}</span>
    </div>
    <h2>{{ resource.title }}</h2>
    <p>{{ resource.summary }}</p>
    <RatingSummary
      :average="getAverageRating(props.resource.id)"
      :count="getRatingCount(props.resource.id)"
      compact
    />
    <dl class="compact-list">
      <div>
        <dt>Service type</dt>
        <dd>{{ resource.serviceType }}</dd>
      </div>
      <div>
        <dt>Audience</dt>
        <dd>{{ resource.audience }}</dd>
      </div>
    </dl>
    <RouterLink class="text-link" :to="`/resources/${resource.id}`">View resource detail</RouterLink>
  </article>
</template>
