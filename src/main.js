import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './assets/styles/main.css'
import { initialiseAuth } from './stores/authStore.js'
import { initialiseAppointments } from './composables/useAppointments.js'
import { initialiseRatings } from './stores/ratingStore.js'

await initialiseAuth()
initialiseAppointments()
initialiseRatings()

createApp(App).use(router).mount('#app')
