<script setup>
import { onBeforeUnmount, onMounted } from 'vue'
import AppFooter from './components/AppFooter.vue'
import AppHeader from './components/AppHeader.vue'
import ConnectivityStatus from './components/ConnectivityStatus.vue'
import PwaStatus from './components/PwaStatus.vue'
import { useConnectivity } from './composables/useConnectivity.js'

const { start, stop } = useConnectivity()

onMounted(start)
onBeforeUnmount(stop)

function focusMainContent() {
  const mainContent = document.getElementById('main-content')
  mainContent?.focus({ preventScroll: true })
  mainContent?.scrollIntoView({ block: 'start' })
}
</script>

<template>
  <a class="skip-link" href="#main-content" @click.prevent="focusMainContent">Skip to main content</a>
  <AppHeader />
  <ConnectivityStatus />
  <PwaStatus />
  <main id="main-content" class="site-main" tabindex="-1" aria-label="Main content">
    <RouterView />
  </main>
  <AppFooter />
</template>
