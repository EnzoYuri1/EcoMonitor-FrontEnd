import { Chart, registerables } from 'chart.js'
import { createPinia } from 'pinia'
import { createApp } from 'vue'

import App from './App.vue'
import router from './router'
import { setUnauthorizedHandler } from './services/api'
import { useAuthStore } from './stores/auth'

import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/inter/600.css'
import '@fontsource/inter/700.css'
import '@fontsource/manrope/500.css'
import '@fontsource/manrope/600.css'
import '@fontsource/manrope/700.css'
import '@fontsource/manrope/800.css'
import './assets/styles.css'
import './assets/tailwind.css'
import 'bootstrap-icons/font/bootstrap-icons.css'

Chart.register(...registerables)

Chart.defaults.font.family = "'Inter', system-ui, sans-serif"
Chart.defaults.font.size = 11
Chart.defaults.color = '#A9BAB1'
Chart.defaults.borderColor = 'rgba(38, 58, 48, 0.7)'
Chart.defaults.plugins.legend.labels.color = '#A9BAB1'
Chart.defaults.plugins.legend.labels.usePointStyle = true
Chart.defaults.plugins.legend.labels.boxWidth = 8
Chart.defaults.plugins.legend.labels.padding = 16
Chart.defaults.plugins.tooltip.backgroundColor = '#16241D'
Chart.defaults.plugins.tooltip.borderColor = '#263A30'
Chart.defaults.plugins.tooltip.borderWidth = 1
Chart.defaults.plugins.tooltip.titleColor = '#F3F7F5'
Chart.defaults.plugins.tooltip.bodyColor = '#A9BAB1'
Chart.defaults.plugins.tooltip.padding = 10
Chart.defaults.plugins.tooltip.cornerRadius = 6
Chart.defaults.plugins.tooltip.displayColors = true

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)

const auth = useAuthStore(pinia)
auth.hydrate()

let redirecionando = false

setUnauthorizedHandler(() => {
  const store = useAuthStore(pinia)
  store.handleUnauthorized()

  if (redirecionando) return

  const rotaAtual = router.currentRoute.value
  if (rotaAtual.name === 'login') return

  redirecionando = true
  router
    .push({
      name: 'login',
      query: { redirect: rotaAtual.fullPath },
    })
    .catch(() => {})
    .finally(() => {
      redirecionando = false
    })
})

app.use(router)
app.mount('#app')
