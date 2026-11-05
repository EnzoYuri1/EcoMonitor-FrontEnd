<script setup>
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'

import { DOCS_URL } from '@/config'
import { useAuthStore } from '@/stores/auth'

defineProps({
  saude: {
    type: Object,
    default: () => ({
      estado: 'verificando',
      mensagem: 'Verificando API...',
    }),
  },
})

defineEmits(['navigate', 'sair'])

const route = useRoute()
const auth = useAuthStore()

const links = [
  {
    nome: 'visao-geral',
    rotulo: 'Visão geral',
    icone: 'bi-grid-1x2',
  },
  {
    nome: 'mapa',
    rotulo: 'Mapa de monitoramento',
    icone: 'bi-geo-alt',
  },
  {
    nome: 'ocorrencias',
    rotulo: 'Ocorrências',
    icone: 'bi-list-check',
  },
  {
    nome: 'relatorios',
    rotulo: 'Relatórios',
    icone: 'bi-file-earmark-bar-graph',
  },
]

const iniciais = computed(() => {
  const nome = (auth.nomeUsuario || 'Marina Costa').trim()
  if (!nome) return 'MC'

  const partes = nome.split(/\s+/).filter(Boolean)
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase()

  return `${partes[0][0]}${partes[partes.length - 1][0]}`.toUpperCase()
})

const nomeExibicao = computed(
  () => auth.nomeUsuario || 'Marina Costa',
)

function ehAtivo(link) {
  if (link.nome === 'ocorrencias') {
    return (
      route.name === 'ocorrencias' ||
      route.name === 'ocorrencia-detalhe' ||
      route.name === 'nova-ocorrencia'
    )
  }

  return route.name === link.nome
}
</script>

<template>
  <div class="sidebar-content">
    <RouterLink
      class="brand"
      :to="{ name: 'visao-geral' }"
      @click="$emit('navigate')"
    >
      <span class="brand-symbol" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="8.5" stroke="currentColor" stroke-width="1.4" />
          <path
            d="M3.5 12h3.2l1.8-4.4 2.6 8.8 2.2-4.4h3.2"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </span>
      <span class="brand-name">EcoMonitor</span>
    </RouterLink>

    <div class="workspace">
      <p class="sidebar-label">Área de trabalho</p>
      <div class="workspace-value">
        <i class="bi bi-grid-1x2" aria-hidden="true"></i>
        <span>Observatório ambiental</span>
      </div>
    </div>

    <p class="sidebar-label sidebar-label-nav">Monitoramento</p>

    <nav class="sidebar-nav" aria-label="Menu principal">
      <RouterLink
        v-for="link in links"
        :key="link.nome"
        class="sidebar-link"
        :class="{ 'sidebar-link-ativo': ehAtivo(link) }"
        :to="{ name: link.nome }"
        :aria-current="ehAtivo(link) ? 'page' : undefined"
        @click="$emit('navigate')"
      >
        <i class="bi" :class="link.icone" aria-hidden="true"></i>
        <span>{{ link.rotulo }}</span>
      </RouterLink>
    </nav>

    <div class="sidebar-bottom">
      <div class="demo-card">
        <p class="demo-card-title">
          <i class="bi bi-info-circle" aria-hidden="true"></i>
          Ambiente demonstrativo
        </p>
        <p class="demo-card-text">
          Dados fictícios para análise. Sem vínculo com fontes reais.
        </p>
      </div>

      <a
        class="sidebar-help"
        :href="DOCS_URL"
        target="_blank"
        rel="noopener noreferrer"
      >
        <i class="bi bi-life-preserver" aria-hidden="true"></i>
        <span>Central de ajuda</span>
        <i class="bi bi-box-arrow-up-right" aria-hidden="true"></i>
      </a>

      <div class="sidebar-profile">
        <span class="avatar" aria-hidden="true">{{ iniciais }}</span>
        <div class="sidebar-profile-texto">
          <p class="sidebar-profile-nome">{{ nomeExibicao }}</p>
          <small class="sidebar-profile-cargo">Analista ambiental</small>
        </div>
        <button
          type="button"
          class="sidebar-profile-sair"
          aria-label="Sair da conta"
          title="Sair da conta"
          @click="$emit('sair')"
        >
          <i class="bi bi-box-arrow-right" aria-hidden="true"></i>
        </button>
      </div>

      <p class="sidebar-health" :title="saude.mensagem">
        <span
          class="status-dot"
          :class="`status-${saude.estado}`"
          aria-hidden="true"
        ></span>
        {{ saude.mensagem }}
      </p>
    </div>
  </div>
</template>
