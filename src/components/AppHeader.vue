<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { currentUser, isAdmin, isAuthenticated, logout } from '../stores/authStore.js'

const isMenuOpen = ref(false)
const router = useRouter()

const publicNavItems = [
  { label: 'Home', to: '/' },
  { label: 'Health Resources', to: '/resources' },
  { label: 'Find Services', to: '/services' },
  { label: 'Events', to: '/events' },
]

function toggleMenu() {
  isMenuOpen.value = !isMenuOpen.value
}

function closeMenu() {
  isMenuOpen.value = false
}

function handleLogout() {
  logout()
  closeMenu()
  router.push('/')
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
          v-for="item in publicNavItems"
          :key="item.to"
          :to="item.to"
          class="nav-link"
          @click="closeMenu"
        >
          {{ item.label }}
        </RouterLink>
        <template v-if="isAuthenticated">
          <RouterLink class="nav-link" to="/appointments" @click="closeMenu">
            Appointments
          </RouterLink>
          <RouterLink class="nav-link" to="/profile" @click="closeMenu">
            Profile
          </RouterLink>
          <RouterLink v-if="isAdmin" class="nav-link" to="/admin" @click="closeMenu">
            Admin Dashboard
          </RouterLink>
          <span class="account-chip" :title="currentUser.fullName">
            {{ currentUser.fullName }}
          </span>
          <button class="nav-action" type="button" @click="handleLogout">Logout</button>
        </template>
        <template v-else>
          <RouterLink class="nav-link" to="/login" @click="closeMenu">Login</RouterLink>
          <RouterLink class="nav-link" to="/register" @click="closeMenu">Register</RouterLink>
        </template>
      </div>
    </nav>
  </header>
</template>
