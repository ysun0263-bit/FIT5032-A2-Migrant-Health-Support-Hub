import { createRouter, createWebHistory } from 'vue-router'
import AdminDashboardView from '../views/AdminDashboardView.vue'
import AppointmentView from '../views/AppointmentView.vue'
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
  currentUser,
  initialiseAuth,
  isAdmin,
  isAuthenticated,
} from '../stores/authStore.js'

const routes = [
  { path: '/', name: 'home', component: HomeView },
  { path: '/resources', name: 'resources', component: ResourcesView },
  { path: '/resources/:id', name: 'resource-detail', component: ResourceDetailView },
  { path: '/services', name: 'services', component: ServicesView },
  {
    path: '/appointments',
    name: 'appointments',
    component: AppointmentView,
    meta: { requiresAuth: true },
  },
  { path: '/events', name: 'events', component: EventsView },
  { path: '/login', name: 'login', component: LoginView },
  { path: '/register', name: 'register', component: RegisterView },
  { path: '/profile', name: 'profile', component: ProfileView, meta: { requiresAuth: true } },
  {
    path: '/admin',
    name: 'admin',
    component: AdminDashboardView,
    meta: { requiresAuth: true, roles: ['admin'] },
  },
  { path: '/unauthorized', name: 'unauthorized', component: UnauthorizedView },
  { path: '/:pathMatch(.*)*', name: 'not-found', component: NotFoundView },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  },
})

router.beforeEach(async (to) => {
  await initialiseAuth()

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

export default router
