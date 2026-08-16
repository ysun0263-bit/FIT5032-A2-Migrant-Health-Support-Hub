import { readonly, ref } from 'vue'
import { registerSW } from 'virtual:pwa-register'

const offlineReadyState = ref(false)
const updateAvailableState = ref(false)
let registered = false
let updateServiceWorker = async () => {}

export function initialisePwa() {
  if (registered || typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return
  registered = true
  updateServiceWorker = registerSW({
    immediate: true,
    onOfflineReady() {
      offlineReadyState.value = true
    },
    onNeedRefresh() {
      updateAvailableState.value = true
    },
    onRegisterError() {
      // The application remains usable online if service-worker registration is unavailable.
    },
  })
}

export function usePwaLifecycle() {
  return {
    offlineReady: readonly(offlineReadyState),
    updateAvailable: readonly(updateAvailableState),
    dismissOfflineReady() {
      offlineReadyState.value = false
    },
    dismissUpdate() {
      updateAvailableState.value = false
    },
    async applyUpdate() {
      await updateServiceWorker(true)
    },
  }
}
