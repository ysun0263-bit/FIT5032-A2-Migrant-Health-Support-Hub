<script setup>
import AppFooter from './components/AppFooter.vue'
import AppHeader from './components/AppHeader.vue'
</script>

<template>
  <a class="skip-link" href="#main-content">Skip to main content</a>
  <AppHeader />
  <main id="main-content" class="site-main" tabindex="-1">
    <RouterView />
  </main>
  <AppFooter />
</template>
