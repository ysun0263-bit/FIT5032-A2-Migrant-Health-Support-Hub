import { createRouter, createWebHistory } from 'vue-router'
import { nextTick } from 'vue'
import AdminDashboardView from '../views/AdminDashboardView.vue'
import EventsView from '../views/EventsView.vue'
import HomeView from '../views/HomeView.vue'
import LoginView from '../views/LoginView.vue'
import NotFoundView from '../views/NotFoundView.vue'
import ProfileView from '../views/ProfileView.vue'
import RegisterView from '../views/RegisterView.vue'
import ResourceDetailView from '../views/ResourceDetailView.vue'
import ResourcesView from '../views/ResourcesView.vue'
import ServicesView from '../views/ServicesView.vue'
import UnauthorizedView from '../views/UnauthorizedView.vue'
import {
  authReady,
  currentUser,
  initialiseAuth,
  isAdmin,
  isAuthenticated,
} from '../stores/authStore.js'

const routes = [
  { path: '/', name: 'home', component: HomeView, meta: { title: 'Home' } },
  { path: '/resources', name: 'resources', component: ResourcesView, meta: { title: 'Health Resources' } },
  { path: '/resources/:id', name: 'resource-detail', component: ResourceDetailView, meta: { title: 'Resource Details' } },
  { path: '/services', name: 'services', component: ServicesView, meta: { title: 'Find Services' } },
  {
    path: '/appointments',
    name: 'appointments',
    component: () => import('../views/AppointmentView.vue'),
    meta: { requiresAuth: true, title: 'Appointments' },
  },
  { path: '/events', name: 'events', component: EventsView, meta: { title: 'Events' } },
  { path: '/login', name: 'login', component: LoginView, meta: { title: 'Login' } },
  { path: '/register', name: 'register', component: RegisterView, meta: { title: 'Register' } },
  { path: '/profile', name: 'profile', component: ProfileView, meta: { requiresAuth: true, title: 'Profile' } },
  {
    path: '/admin',
    name: 'admin',
    component: AdminDashboardView,
    meta: { requiresAuth: true, roles: ['admin'], title: 'Admin Dashboard' },
  },
  { path: '/unauthorized', name: 'unauthorized', component: UnauthorizedView, meta: { title: 'Unauthorized' } },
  { path: '/:pathMatch(.*)*', name: 'not-found', component: NotFoundView, meta: { title: 'Page Not Found' } },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  },
})

router.beforeEach(async (to) => {
  if (!authReady.value) {
    await initialiseAuth()
  }

  if (['login', 'register'].includes(to.name) && isAuthenticated.value) {
    return isAdmin.value ? { name: 'admin' } : { name: 'profile' }
  }

  if (to.meta.requiresAuth && !isAuthenticated.value) {
    return {
      name: 'login',
      query: { redirect: to.fullPath },
    }
  }

  if (to.meta.roles?.length && !to.meta.roles.includes(currentUser.value?.role)) {
    return { name: 'unauthorized' }
  }

  return true
})

let hasCompletedInitialNavigation = false

router.afterEach(async (to) => {
  document.title = `${to.meta.title || 'Migrant Health Support Hub'} | Migrant Health Support Hub`
  if (!hasCompletedInitialNavigation) {
    hasCompletedInitialNavigation = true
    return
  }
  await nextTick()
  window.setTimeout(() => {
    const heading = document.querySelector('#main-content h1')
    if (heading) {
      heading.setAttribute('tabindex', '-1')
      heading.focus({ preventScroll: true })
    } else {
      document.querySelector('#main-content')?.focus({ preventScroll: true })
    }
  }, 0)
})

export default router
