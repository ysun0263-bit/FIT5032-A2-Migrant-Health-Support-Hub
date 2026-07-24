<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  currentScore: {
    type: Number,
    default: null,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['submit'])
const selectedScore = ref(props.currentScore)
const statusMessage = ref('')
const errorMessage = ref('')
const isSubmitting = ref(false)

watch(
  () => props.currentScore,
  (score) => {
    selectedScore.value = score
  },
)

async function handleSubmit() {
  statusMessage.value = ''
  errorMessage.value = ''
  const numericScore = Number(selectedScore.value)

  if (!Number.isInteger(numericScore) || numericScore < 1 || numericScore > 5) {
    errorMessage.value = 'Choose a whole-number rating from 1 to 5.'
    return
  }

  isSubmitting.value = true

  try {
    await emit('submit', numericScore)
    statusMessage.value = 'Your rating has been saved.'
  } catch (error) {
    errorMessage.value = error.message || 'Rating could not be saved.'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <form class="rating-panel" aria-label="Submit resource rating" @submit.prevent="handleSubmit">
    <fieldset class="rating-fieldset" :disabled="disabled || isSubmitting">
      <legend>{{ currentScore ? `Your current rating is ${currentScore} out of 5` : 'Rate this resource' }}</legend>
      <label v-for="score in [1, 2, 3, 4, 5]" :key="score" class="rating-option">
        <input v-model.number="selectedScore" type="radio" name="rating" :value="score">
        <span aria-hidden="true">{{ '★'.repeat(score) }}</span>
        <span class="sr-only">Rate {{ score }} out of 5</span>
      </label>
    </fieldset>
    <button type="submit" :disabled="disabled || isSubmitting">Save rating</button>
    <p v-if="statusMessage" class="form-status success" aria-live="polite">{{ statusMessage }}</p>
    <p v-if="errorMessage" class="form-status error" aria-live="polite">{{ errorMessage }}</p>
  </form>
</template>
