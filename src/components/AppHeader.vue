<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'

const isMenuOpen = ref(false)

const navItems = [
  { label: 'Home', to: '/' },
  { label: 'Health Resources', to: '/resources' },
  { label: 'Find Services', to: '/services' },
  { label: 'Appointments', to: '/appointments' },
  { label: 'Events', to: '/events' },
  { label: 'Login', to: '/login' },
]

function toggleMenu() {
  isMenuOpen.value = !isMenuOpen.value
}

function closeMenu() {
  isMenuOpen.value = false
}

function handleKeydown(event) {
  if (event.key === 'Escape') {
    closeMenu()
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <header class="site-header">
    <nav class="nav-shell" aria-label="Main navigation">
      <RouterLink class="brand" to="/" @click="closeMenu">
        <span class="brand-mark" aria-hidden="true">M</span>
        <span>
          <span class="brand-name">Migrant Health</span>
          <span class="brand-subtitle">Support Hub</span>
        </span>
      </RouterLink>

      <button
        class="menu-toggle"
        type="button"
        aria-label="Toggle navigation menu"
        :aria-expanded="isMenuOpen"
        aria-controls="primary-navigation"
        @click="toggleMenu"
      >
        <span aria-hidden="true"></span>
        <span aria-hidden="true"></span>
        <span aria-hidden="true"></span>
      </button>

      <div id="primary-navigation" class="nav-links" :class="{ 'is-open': isMenuOpen }">
        <RouterLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="nav-link"
          @click="closeMenu"
        >
          {{ item.label }}
        </RouterLink>
      </div>
    </nav>
  </header>
</template>
