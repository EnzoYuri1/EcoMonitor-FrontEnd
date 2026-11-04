import { createPinia } from 'pinia'
import { createApp } from 'vue'

import App from './App.vue'
import router from './router'
import { setUnauthorizedHandler } from './services/api'
import { useAuthStore } from './stores/auth'

import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap-icons/font/bootstrap-icons.css'
import './assets/styles.css'

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
