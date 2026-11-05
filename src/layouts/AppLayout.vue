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
import { verificarSaude } from '@/services/api'
import { useAppStore } from '@/stores/app'
import { useAuthStore } from '@/stores/auth'
import { formatarHorario } from '@/utils/format'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const app = useAppStore()

const menuAberto = ref(false)
const notificacoesAbertas = ref(false)
const saude = ref({
  estado: 'verificando',
  mensagem: 'Verificando API...',
})

let intervalo = null
let componenteAtivo = true

const migalhas = computed(() => {
  switch (route.name) {
    case 'visao-geral':
      return [{ rotulo: 'Visão geral' }]
    case 'mapa':
      return [
        { rotulo: 'Monitoramento' },
        { rotulo: 'Mapa de monitoramento' },
      ]
    case 'ocorrencias':
      return [
        { rotulo: 'Monitoramento' },
        { rotulo: 'Ocorrências' },
      ]
    case 'nova-ocorrencia':
      return [
        { rotulo: 'Ocorrências', to: { name: 'ocorrencias' } },
        { rotulo: 'Nova ocorrência' },
      ]
    case 'ocorrencia-detalhe':
      return [
        { rotulo: 'Ocorrências', to: { name: 'ocorrencias' } },
        { rotulo: 'Detalhe' },
      ]
    case 'relatorios':
      return [{ rotulo: 'Análise' }, { rotulo: 'Relatórios' }]
    default:
      return [{ rotulo: route.meta.title || 'EcoMonitor' }]
  }
})

const horaAtualizacao = computed(() =>
  formatarHorario(app.ultimaAtualizacao || new Date()),
)

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

function alternarNotificacoes() {
  notificacoesAbertas.value = !notificacoesAbertas.value
}

function fecharNotificacoesFora(evento) {
  if (!evento.target.closest('.notif-wrap')) {
    notificacoesAbertas.value = false
  }
}

watch(
  () => route.fullPath,
  () => {
    menuAberto.value = false
    notificacoesAbertas.value = false
  },
)

onMounted(() => {
  app.marcarAtualizacao(new Date())
  checarSaude()
  intervalo = window.setInterval(checarSaude, 30000)
  document.addEventListener('click', fecharNotificacoesFora)
})

onBeforeUnmount(() => {
  componenteAtivo = false
  if (intervalo) window.clearInterval(intervalo)
  document.removeEventListener('click', fecharNotificacoesFora)
})
</script>

<template>
  <div class="app-shell">
    <aside class="sidebar d-none d-lg-flex flex-column">
      <SidebarContent :saude="saude" @sair="sair" />
    </aside>

    <div class="app-main">
      <header class="topbar">
        <div class="topbar-esquerda">
          <button
            type="button"
            class="icon-btn d-lg-none"
            aria-label="Abrir menu lateral"
            @click="menuAberto = true"
          >
            <i class="bi bi-list fs-5" aria-hidden="true"></i>
          </button>

          <nav class="breadcrumbs" aria-label="Você está em">
            <template
              v-for="(migalha, indice) in migalhas"
              :key="`${migalha.rotulo}-${indice}`"
            >
              <span v-if="indice > 0" class="breadcrumb-sep" aria-hidden="true">
                /
              </span>
              <RouterLink
                v-if="migalha.to"
                :to="migalha.to"
                class="breadcrumb-link"
              >
                {{ migalha.rotulo }}
              </RouterLink>
              <span v-else class="breadcrumb-atual">
                {{ migalha.rotulo }}
              </span>
            </template>
          </nav>
        </div>

        <div class="topbar-meta">
          <span class="topbar-update">
            <span
              class="status-dot"
              :class="`status-${saude.estado}`"
              aria-hidden="true"
            ></span>
            Atualizado às {{ horaAtualizacao }}
          </span>

          <span class="topbar-divider" aria-hidden="true"></span>

          <div class="notif-wrap">
            <button
              type="button"
              class="icon-btn"
              :aria-expanded="notificacoesAbertas"
              aria-label="Notificações"
              @click.stop="alternarNotificacoes"
            >
              <i class="bi bi-bell" aria-hidden="true"></i>
              <span v-if="app.naoLidas" class="notif-badge">
                {{ app.naoLidas }}
              </span>
            </button>

            <div
              v-if="notificacoesAbertas"
              class="notif-panel"
              role="dialog"
              aria-label="Notificações"
            >
              <div class="notif-panel-header">
                <strong>Notificações</strong>
                <button
                  v-if="app.naoLidas"
                  type="button"
                  class="link-button"
                  @click="app.marcarTodasComoLidas()"
                >
                  Marcar como lidas
                </button>
              </div>
              <ul class="notif-lista">
                <li
                  v-for="item in app.notificacoes"
                  :key="item.id"
                  class="notif-item"
                  :class="{ 'notif-item-lida': item.lida }"
                >
                  <p class="notif-titulo">{{ item.titulo }}</p>
                  <p class="notif-descricao">{{ item.descricao }}</p>
                </li>
              </ul>
            </div>
          </div>

          <span class="timezone-chip" title="Horário de Brasília">
            BRT
          </span>
        </div>
      </header>

      <main class="content">
        <div class="content-inner">
          <RouterView />
        </div>
      </main>
    </div>

    <Teleport to="body">
      <template v-if="menuAberto">
        <div
          class="offcanvas-backdrop fade show"
          @click="menuAberto = false"
        ></div>
        <aside class="eco-offcanvas" aria-label="Menu lateral">
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
