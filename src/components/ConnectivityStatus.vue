<script setup>
import { onBeforeUnmount, ref, watch } from 'vue'
import { useConnectivity } from '../composables/useConnectivity.js'

const { isOnline } = useConnectivity()
const recovered = ref(false)
let recoveryTimer

watch(isOnline, (online, wasOnline) => {
  window.clearTimeout(recoveryTimer)
  recovered.value = online && wasOnline === false
  if (recovered.value) {
    recoveryTimer = window.setTimeout(() => {
      recovered.value = false
    }, 5000)
  }
})

onBeforeUnmount(() => window.clearTimeout(recoveryTimer))
</script>

<template>
  <div
    v-if="!isOnline || recovered"
    class="connectivity-banner"
    :class="{ recovered }"
    role="status"
    aria-live="polite"
    aria-atomic="true"
  >
    <strong>{{ recovered ? "You're back online." : 'You are offline.' }}</strong>
    <span v-if="!recovered">Some features are temporarily unavailable.</span>
  </div>
</template>
