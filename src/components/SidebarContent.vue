<script setup>
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import {
  ExternalLink,
  FileChartColumn,
  Grid2X2,
  Info,
  ListChecks,
  LogOut,
  MapPin,
  LifeBuoy,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-vue-next'

import { DOCS_URL } from '@/config'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores/auth'

defineProps({
  recolhida: {
    type: Boolean,
    default: false,
  },
})

defineEmits(['navigate', 'sair', 'alternar'])

const route = useRoute()
const auth = useAuthStore()

const links = [
  {
    nome: 'visao-geral',
    rotulo: 'Visão geral',
    icone: Grid2X2,
  },
  {
    nome: 'mapa',
    rotulo: 'Mapa de monitoramento',
    icone: MapPin,
  },
  {
    nome: 'ocorrencias',
    rotulo: 'Ocorrências',
    icone: ListChecks,
  },
  {
    nome: 'relatorios',
    rotulo: 'Relatórios',
    icone: FileChartColumn,
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
  <div class="sidebar-content" :class="{ 'sidebar-content-recolhida': recolhida }">
    <div class="sidebar-brand-row">
      <RouterLink
        class="brand"
        :to="{ name: 'visao-geral' }"
        @click="$emit('navigate')"
      >
        <img class="brand-logo" src="/logo-ecomonitor-original.png" alt="" aria-hidden="true" />
        <span class="brand-name">EcoMonitor</span>
      </RouterLink>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        class="sidebar-toggle"
        :aria-label="recolhida ? 'Expandir menu lateral' : 'Recolher menu lateral'"
        :title="recolhida ? 'Expandir menu lateral' : 'Recolher menu lateral'"
        @click.prevent="$emit('alternar')"
      >
        <PanelLeftOpen v-if="recolhida" :size="16" aria-hidden="true" />
        <PanelLeftClose v-else :size="16" aria-hidden="true" />
      </Button>
    </div>

    <div class="workspace">
      <p class="sidebar-label">Área de trabalho</p>
      <div class="workspace-value">
        <Grid2X2 :size="14" aria-hidden="true" />
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
        <component :is="link.icone" :size="17" aria-hidden="true" />
        <span class="sidebar-link-label">{{ link.rotulo }}</span>
      </RouterLink>
    </nav>

    <div class="sidebar-bottom">
      <div class="demo-card">
        <p class="demo-card-title">
          <Info :size="14" aria-hidden="true" />
          <span class="sidebar-link-label">Ambiente demonstrativo</span>
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
        <LifeBuoy :size="15" aria-hidden="true" />
        <span class="sidebar-link-label">Central de ajuda</span>
        <ExternalLink :size="13" aria-hidden="true" />
      </a>

      <div class="sidebar-profile">
        <span class="avatar" aria-hidden="true">{{ iniciais }}</span>
        <div class="sidebar-profile-texto">
          <p class="sidebar-profile-nome">{{ nomeExibicao }}</p>
          <small class="sidebar-profile-cargo">Analista ambiental</small>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          class="sidebar-profile-sair"
          aria-label="Sair da conta"
          title="Sair da conta"
          @click="$emit('sair')"
        >
          <LogOut :size="15" aria-hidden="true" />
        </Button>
      </div>

    </div>
  </div>
</template>
