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
  description: {
    type: String,
    required: true,
  },
})
</script>

<template>
  <section class="page-hero">
    <div class="hero-copy">
      <p v-if="eyebrow" class="eyebrow">{{ eyebrow }}</p>
      <h1>{{ title }}</h1>
      <p>{{ description }}</p>
      <slot />
    </div>
    <div class="hero-visual" aria-hidden="true">
      <div class="visual-panel">
        <span class="visual-dot"></span>
        <span class="visual-line"></span>
        <span class="visual-card"></span>
      </div>
    </div>
  </section>
</template>
