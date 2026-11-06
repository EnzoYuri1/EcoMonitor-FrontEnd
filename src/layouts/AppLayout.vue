<script setup>
import {
  computed,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from 'vue'
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import { Bell, Menu } from 'lucide-vue-next'

import SidebarContent from '@/components/SidebarContent.vue'
import AssistenteChat from '@/components/AssistenteChat.vue'
import { Button } from '@/components/ui/button'
import { Sheet } from '@/components/ui/sheet'
import { useAppStore } from '@/stores/app'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const app = useAppStore()

const menuAberto = ref(false)
const sidebarRecolhida = ref(false)
const notificacoesAbertas = ref(false)

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

app.marcarAtualizacao(new Date())

onMounted(() => {
  document.addEventListener('click', fecharNotificacoesFora)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', fecharNotificacoesFora)
})
</script>

<template>
  <div class="app-shell">
    <aside
      class="sidebar d-none d-lg-flex flex-column"
      :class="{ 'sidebar-recolhida': sidebarRecolhida }"
    >
      <SidebarContent
        :recolhida="sidebarRecolhida"
        @alternar="sidebarRecolhida = !sidebarRecolhida"
        @sair="sair"
      />
    </aside>

    <div class="app-main">
      <header class="topbar">
        <div class="topbar-esquerda">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            class="icon-btn mobile-menu-button"
            aria-label="Abrir menu lateral"
            @click="menuAberto = true"
          >
            <Menu :size="19" aria-hidden="true" />
          </Button>

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
          <div class="notif-wrap">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              class="icon-btn"
              :aria-expanded="notificacoesAbertas"
              aria-label="Notificações"
              @click.stop="alternarNotificacoes"
            >
              <Bell :size="17" aria-hidden="true" />
              <span v-if="app.naoLidas" class="notif-badge">
                {{ app.naoLidas }}
              </span>
            </Button>

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

    <Sheet v-model:open="menuAberto" side="left">
      <SidebarContent
        @navigate="menuAberto = false"
        @sair="sair"
      />
    </Sheet>

    <AssistenteChat />
  </div>
</template>
