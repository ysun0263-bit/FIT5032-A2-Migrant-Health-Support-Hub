<script setup>
import { usePwaLifecycle } from '../composables/usePwaLifecycle.js'

const {
  offlineReady,
  updateAvailable,
  dismissOfflineReady,
  dismissUpdate,
  applyUpdate,
} = usePwaLifecycle()
</script>

<template>
  <aside
    v-if="offlineReady || updateAvailable"
    class="pwa-notice"
    role="status"
    aria-live="polite"
    aria-atomic="true"
  >
    <div v-if="updateAvailable">
      <strong>A new version is available.</strong>
      <p>Reload when you are ready. Unsaved form content will not be reloaded automatically.</p>
      <div class="action-row">
        <button type="button" class="button primary" @click="applyUpdate">Reload</button>
        <button type="button" class="button secondary" @click="dismissUpdate">Later</button>
      </div>
    </div>
    <div v-else>
      <strong>App is ready for offline use.</strong>
      <button type="button" class="button secondary" @click="dismissOfflineReady">Close</button>
    </div>
  </aside>
</template>
