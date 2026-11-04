<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'

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

const auth = useAuthStore()

const links = [
  {
    nome: 'dashboard',
    rotulo: 'Dashboard',
    icone: 'bi-speedometer2',
  },
  {
    nome: 'mapa',
    rotulo: 'Mapa',
    icone: 'bi-geo-alt',
  },
  {
    nome: 'ocorrencias',
    rotulo: 'Ocorrências',
    icone: 'bi-list-ul',
  },
  {
    nome: 'relatorios',
    rotulo: 'Relatórios',
    icone: 'bi-file-earmark-bar-graph',
  },
]

const iniciais = computed(() => {
  const nome = auth.nomeUsuario.trim()
  if (!nome) return 'EM'

  const partes = nome.split(/\s+/).filter(Boolean)
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase()

  return `${partes[0][0]}${partes[partes.length - 1][0]}`.toUpperCase()
})
</script>

<template>
  <div class="sidebar-content d-flex flex-column h-100 p-3 p-xl-4">
    <RouterLink
      class="brand text-decoration-none"
      :to="{ name: 'dashboard' }"
      @click="$emit('navigate')"
    >
      <span class="brand-icon" aria-hidden="true">
        <i class="bi bi-tree-fill"></i>
      </span>
      <span>
        <strong>EcoMonitor</strong>
        <small>Monitoramento ambiental</small>
      </span>
    </RouterLink>

    <RouterLink
      class="btn btn-eco-accent w-100 mt-4"
      :to="{ name: 'nova-ocorrencia' }"
      @click="$emit('navigate')"
    >
      <i class="bi bi-plus-circle me-2" aria-hidden="true"></i>
      Nova ocorrência
    </RouterLink>

    <nav class="nav flex-column mt-4 gap-1" aria-label="Menu principal">
      <RouterLink
        v-for="link in links"
        :key="link.nome"
        class="nav-link sidebar-link"
        :to="{ name: link.nome }"
        @click="$emit('navigate')"
      >
        <i class="bi" :class="link.icone" aria-hidden="true"></i>
        <span>{{ link.rotulo }}</span>
      </RouterLink>
    </nav>

    <div class="mt-auto pt-4">
      <div class="sidebar-user rounded-3 p-3">
        <div class="d-flex align-items-center gap-2">
          <span class="avatar" aria-hidden="true">{{ iniciais }}</span>
          <div class="min-w-0">
            <p class="mb-0 fw-semibold text-truncate">
              {{ auth.nomeUsuario || 'Usuário' }}
            </p>
            <small class="d-block text-truncate">
              {{ auth.emailUsuario }}
            </small>
          </div>
        </div>
      </div>

      <div
        class="d-flex align-items-center justify-content-between gap-2 mt-3 small sidebar-meta"
      >
        <span
          class="d-inline-flex align-items-center gap-2"
          :title="saude.mensagem"
        >
          <span
            class="status-dot"
            :class="`status-${saude.estado}`"
            aria-hidden="true"
          ></span>
          {{ saude.mensagem }}
        </span>

        <a
          :href="DOCS_URL"
          target="_blank"
          rel="noopener noreferrer"
          class="sidebar-docs"
        >
          Docs
          <i class="bi bi-box-arrow-up-right ms-1" aria-hidden="true"></i>
        </a>
      </div>

      <button
        type="button"
        class="btn btn-outline-light btn-sm w-100 mt-3"
        @click="$emit('sair')"
      >
        <i class="bi bi-box-arrow-right me-2" aria-hidden="true"></i>
        Sair
      </button>
    </div>
  </div>
</template>
