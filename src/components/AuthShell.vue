<script setup>
import { RouterLink } from 'vue-router'
import { ArrowLeft, Check } from 'lucide-vue-next'

defineProps({
  titulo: {
    type: String,
    required: true,
  },
  subtitulo: {
    type: String,
    default: '',
  },
})
</script>

<template>
  <div class="auth-page">
    <section class="auth-hero">
      <RouterLink class="brand" :to="{ name: 'inicio' }">
        <img class="brand-logo" src="/logo-ecomonitor-original.png" alt="" aria-hidden="true" />
        <span class="brand-name">EcoMonitor</span>
      </RouterLink>

      <div class="auth-hero-content">
        <p class="auth-eyebrow">Observatório ambiental</p>
        <h2>
          Dados de queimadas e desmatamento organizados para decisão.
        </h2>
        <p class="auth-hero-text">
          Registre ocorrências, acompanhe indicadores e consulte o histórico
          por município, tipo e período em uma única base operacional.
        </p>

        <ul class="auth-features">
          <li>
            <Check :size="15" aria-hidden="true" />
            Cadastro e consulta de ocorrências ambientais
          </li>
          <li>
            <Check :size="15" aria-hidden="true" />
            Visão geral com indicadores consolidados
          </li>
          <li>
            <Check :size="15" aria-hidden="true" />
            Mapa de monitoramento e relatórios exportáveis
          </li>
          <li>
            <Check :size="15" aria-hidden="true" />
            Acesso seguro com autenticação JWT
          </li>
        </ul>
      </div>

    </section>

    <section class="auth-form-wrap">
      <div class="auth-card card">
        <div class="card-body">
          <RouterLink
            class="brand d-lg-none mb-4"
            :to="{ name: 'inicio' }"
          >
            <img class="brand-logo" src="/logo-ecomonitor-original.png" alt="" aria-hidden="true" />
            <span class="brand-name">EcoMonitor</span>
          </RouterLink>

          <h1 class="mb-1">{{ titulo }}</h1>
          <p v-if="subtitulo" class="texto-2 mb-4">{{ subtitulo }}</p>

          <slot />
          <RouterLink class="auth-back-link" :to="{ name: 'inicio' }">
            <ArrowLeft :size="14" aria-hidden="true" />
            Voltar ao início
          </RouterLink>
        </div>
      </div>
    </section>
  </div>
</template>
