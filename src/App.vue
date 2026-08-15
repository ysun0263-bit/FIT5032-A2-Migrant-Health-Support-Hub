<script setup>
import AppFooter from './components/AppFooter.vue'
import AppHeader from './components/AppHeader.vue'

function focusMainContent() {
  const mainContent = document.getElementById('main-content')
  mainContent?.focus({ preventScroll: true })
  mainContent?.scrollIntoView({ block: 'start' })
}
</script>

<template>
  <a class="skip-link" href="#main-content" @click.prevent="focusMainContent">Skip to main content</a>
  <AppHeader />
  <main id="main-content" class="site-main" tabindex="-1" aria-label="Main content">
    <RouterView />
  </main>
  <AppFooter />
</template>
