<script setup>
import {
  computed,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from 'vue'
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'

import SidebarContent from '@/components/SidebarContent.vue'
import { DOCS_URL } from '@/config'
import { verificarSaude } from '@/services/api'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const menuAberto = ref(false)
const saude = ref({
  estado: 'verificando',
  mensagem: 'Verificando API...',
})

let intervalo = null
let componenteAtivo = true

const tituloPagina = computed(() => route.meta.title || 'EcoMonitor')

async function checarSaude() {
  try {
    const ok = await verificarSaude()
    if (!componenteAtivo) return

    saude.value = ok
      ? { estado: 'online', mensagem: 'API online' }
      : { estado: 'offline', mensagem: 'API indisponível' }
  } catch {
    if (!componenteAtivo) return
    saude.value = { estado: 'offline', mensagem: 'API offline' }
  }
}

function sair() {
  menuAberto.value = false
  auth.logout()
  router.push({ name: 'login' })
}

watch(
  () => route.fullPath,
  () => {
    menuAberto.value = false
  },
)

onMounted(() => {
  checarSaude()
  intervalo = window.setInterval(checarSaude, 30000)
})

onBeforeUnmount(() => {
  componenteAtivo = false
  if (intervalo) window.clearInterval(intervalo)
})
</script>

<template>
  <div class="app-shell">
    <aside class="sidebar d-none d-lg-flex flex-column">
      <SidebarContent :saude="saude" @sair="sair" />
    </aside>

    <div class="app-main">
      <header class="topbar px-3 px-lg-4 py-3">
        <div class="d-flex align-items-center gap-2 min-w-0">
          <button
            type="button"
            class="btn btn-light d-lg-none"
            aria-label="Abrir menu"
            @click="menuAberto = true"
          >
            <i class="bi bi-list fs-5" aria-hidden="true"></i>
          </button>

          <div class="min-w-0">
            <p class="topbar-eyebrow mb-0">EcoMonitor</p>
            <h1 class="h5 mb-0 text-truncate">{{ tituloPagina }}</h1>
          </div>
        </div>

        <div class="ms-auto d-flex align-items-center gap-2">
          <span
            class="badge rounded-pill api-pill d-inline-flex d-lg-none"
            :class="`api-pill-${saude.estado}`"
          >
            <span
              class="status-dot me-1"
              :class="`status-${saude.estado}`"
              aria-hidden="true"
            ></span>
            {{ saude.mensagem }}
          </span>

          <RouterLink
            class="btn btn-primary btn-sm d-none d-sm-inline-flex align-items-center"
            :to="{ name: 'nova-ocorrencia' }"
          >
            <i class="bi bi-plus-lg me-1" aria-hidden="true"></i>
            Nova ocorrência
          </RouterLink>
        </div>
      </header>

      <main class="content">
        <RouterView />
      </main>

      <footer
        class="app-footer px-3 px-lg-4 py-3 small text-secondary d-flex flex-wrap justify-content-between gap-2"
      >
        <span>
          EcoMonitor · Monitoramento de queimadas e desmatamento
        </span>
        <a
          :href="DOCS_URL"
          target="_blank"
          rel="noopener noreferrer"
          class="text-decoration-none"
        >
          Documentação da API
          <i class="bi bi-box-arrow-up-right ms-1" aria-hidden="true"></i>
        </a>
      </footer>
    </div>

    <Teleport to="body">
      <template v-if="menuAberto">
        <div
          class="offcanvas-backdrop fade show"
          @click="menuAberto = false"
        ></div>
        <aside class="eco-offcanvas d-lg-none" aria-label="Menu lateral">
          <SidebarContent
            :saude="saude"
            @navigate="menuAberto = false"
            @sair="sair"
          />
        </aside>
      </template>
    </Teleport>
  </div>
</template>
