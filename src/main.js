import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './assets/styles/main.css'
import { initialiseAuth } from './stores/authStore.js'

await initialiseAuth()

createApp(App).use(router).mount('#app')
