import { Chart, registerables } from 'chart.js'
import { createPinia } from 'pinia'
import { createApp } from 'vue'

import App from './App.vue'
import router from './router'
import { setUnauthorizedHandler } from './services/api'
import { useAuthStore } from './stores/auth'
import { useTemaStore } from './stores/tema'

import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/inter/600.css'
import '@fontsource/inter/700.css'
import '@fontsource/manrope/500.css'
import '@fontsource/manrope/600.css'
import '@fontsource/manrope/700.css'
import '@fontsource/manrope/800.css'
import 'bootstrap/dist/css/bootstrap.min.css'
import './assets/styles.css'
import './assets/tailwind.css'
import 'bootstrap-icons/font/bootstrap-icons.css'

Chart.register(...registerables)

function configurarChartDefaults(tema) {
  Chart.defaults.font.family = "'Inter', system-ui, sans-serif"
  Chart.defaults.font.size = 11
  Chart.defaults.color = tema.cor('--eco-chart-muted', '#A9BAB1')
  Chart.defaults.borderColor = tema.cor(
    '--eco-chart-border',
    'rgba(38, 58, 48, 0.7)',
  )
  Chart.defaults.plugins.legend.labels.color = tema.cor(
    '--eco-chart-muted',
    '#A9BAB1',
  )
  Chart.defaults.plugins.legend.labels.usePointStyle = true
  Chart.defaults.plugins.legend.labels.boxWidth = 8
  Chart.defaults.plugins.legend.labels.padding = 16
  Chart.defaults.plugins.tooltip.backgroundColor = tema.cor(
    '--eco-chart-tooltip-bg',
    '#16241D',
  )
  Chart.defaults.plugins.tooltip.borderColor = tema.cor(
    '--eco-chart-tooltip-border',
    '#263A30',
  )
  Chart.defaults.plugins.tooltip.borderWidth = 1
  Chart.defaults.plugins.tooltip.titleColor = tema.cor(
    '--eco-chart-tooltip-title',
    '#F3F7F5',
  )
  Chart.defaults.plugins.tooltip.bodyColor = tema.cor(
    '--eco-chart-tooltip-body',
    '#A9BAB1',
  )
  Chart.defaults.plugins.tooltip.padding = 10
  Chart.defaults.plugins.tooltip.cornerRadius = 6
  Chart.defaults.plugins.tooltip.displayColors = true
}

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)

const tema = useTemaStore(pinia)
tema.iniciar()
configurarChartDefaults(tema)

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
