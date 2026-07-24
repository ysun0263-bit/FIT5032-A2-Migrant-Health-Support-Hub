<script setup>
const props = defineProps({
  distribution: {
    type: Object,
    required: true,
  },
  total: {
    type: Number,
    required: true,
  },
})

function percentage(score) {
  if (!props.total) {
    return 0
  }

  return Math.round((props.distribution[score] / props.total) * 100)
}
</script>

<template>
  <section class="rating-panel" aria-labelledby="rating-distribution-title">
    <h2 id="rating-distribution-title">Rating distribution</h2>
    <p v-if="!total">No distribution yet because this resource has no ratings.</p>
    <div v-else class="rating-distribution">
      <div v-for="score in [5, 4, 3, 2, 1]" :key="score" class="distribution-row">
        <span>{{ score }} {{ score === 1 ? 'star' : 'stars' }}</span>
        <progress :value="distribution[score]" :max="total">
          {{ percentage(score) }}%
        </progress>
        <strong>{{ distribution[score] }}</strong>
      </div>
    </div>
  </section>
</template>
