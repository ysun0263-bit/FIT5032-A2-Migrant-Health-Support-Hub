<script setup>
defineProps({
  title: {
    type: String,
    default: 'Phase 1 placeholder',
  },
  text: {
    type: String,
    required: true,
  },
})
</script>

<template>
  <aside class="placeholder-notice">
    <strong>{{ title }}</strong>
    <p>{{ text }}</p>
  </aside>
</template>
