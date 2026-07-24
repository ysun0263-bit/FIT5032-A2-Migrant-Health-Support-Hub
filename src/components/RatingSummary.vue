<script setup>
defineProps({
  average: {
    type: Number,
    default: null,
  },
  count: {
    type: Number,
    required: true,
  },
  compact: {
    type: Boolean,
    default: false,
  },
})
</script>

<template>
  <div class="rating-summary" :class="{ compact }" :aria-label="count ? `Average rating ${average} out of 5 from ${count} ratings` : 'No ratings yet'">
    <span class="star-row" aria-hidden="true">
      {{ count ? '★★★★★'.slice(0, Math.round(average)) : '☆☆☆☆☆' }}
    </span>
    <span v-if="count">
      <strong>{{ average.toFixed(1) }} / 5</strong> from {{ count }} {{ count === 1 ? 'rating' : 'ratings' }}
    </span>
    <span v-else>No ratings yet</span>
  </div>
</template>
