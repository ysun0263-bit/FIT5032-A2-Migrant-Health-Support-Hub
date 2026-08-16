import { readonly, ref } from 'vue'

function defaultEventTarget() {
  return typeof window === 'undefined' ? null : window
}

function defaultNavigator() {
  return typeof navigator === 'undefined' ? null : navigator
}

export function createConnectivityState({
  eventTarget = defaultEventTarget(),
  navigatorSource = defaultNavigator(),
} = {}) {
  const isOnlineState = ref(navigatorSource?.onLine !== false)
  let listening = false

  function handleOnline() {
    isOnlineState.value = true
  }

  function handleOffline() {
    isOnlineState.value = false
  }

  function start() {
    if (listening || !eventTarget?.addEventListener) return
    isOnlineState.value = navigatorSource?.onLine !== false
    eventTarget.addEventListener('online', handleOnline)
    eventTarget.addEventListener('offline', handleOffline)
    listening = true
  }

  function stop() {
    if (!listening || !eventTarget?.removeEventListener) return
    eventTarget.removeEventListener('online', handleOnline)
    eventTarget.removeEventListener('offline', handleOffline)
    listening = false
  }

  return {
    isOnline: readonly(isOnlineState),
    start,
    stop,
  }
}

const connectivityState = createConnectivityState()

export function useConnectivity() {
  return connectivityState
}
