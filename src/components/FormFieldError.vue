<script setup>
defineProps({
  id: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    default: '',
  },
})
</script>

<template>
  <p v-if="message" :id="id" class="field-error">{{ message }}</p>
</template>
