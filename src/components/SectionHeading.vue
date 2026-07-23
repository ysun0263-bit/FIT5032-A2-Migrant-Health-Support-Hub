<script setup>
defineProps({
  eyebrow: {
    type: String,
    default: '',
  },
  title: {
    type: String,
    required: true,
  },
  text: {
    type: String,
    default: '',
  },
})
</script>

<template>
  <div class="section-heading">
    <p v-if="eyebrow" class="eyebrow">{{ eyebrow }}</p>
    <h1 v-if="$attrs.level === 'h1'">{{ title }}</h1>
    <h2 v-else>{{ title }}</h2>
    <p v-if="text">{{ text }}</p>
  </div>
</template>
