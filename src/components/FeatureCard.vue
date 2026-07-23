<script setup>
defineProps({
  title: {
    type: String,
    required: true,
  },
  text: {
    type: String,
    required: true,
  },
  tag: {
    type: String,
    default: '',
  },
})
</script>

<template>
  <article class="feature-card">
    <p v-if="tag" class="card-tag">{{ tag }}</p>
    <h2>{{ title }}</h2>
    <p>{{ text }}</p>
    <slot />
  </article>
</template>
