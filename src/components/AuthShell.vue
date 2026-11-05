<script setup>
import { RouterLink } from 'vue-router'

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
      <RouterLink class="brand" :to="{ name: 'login' }">
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
            <i class="bi bi-check2" aria-hidden="true"></i>
            Cadastro e consulta de ocorrências ambientais
          </li>
          <li>
            <i class="bi bi-check2" aria-hidden="true"></i>
            Visão geral com indicadores consolidados
          </li>
          <li>
            <i class="bi bi-check2" aria-hidden="true"></i>
            Mapa de monitoramento e relatórios exportáveis
          </li>
          <li>
            <i class="bi bi-check2" aria-hidden="true"></i>
            Acesso seguro com autenticação JWT
          </li>
        </ul>
      </div>

      <p class="auth-hero-footer mb-0">
        EcoMonitor · Interface conectada à API FastAPI
      </p>
    </section>

    <section class="auth-form-wrap">
      <div class="auth-card card">
        <div class="card-body">
          <RouterLink
            class="brand d-lg-none mb-4"
            :to="{ name: 'login' }"
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

          <h1 class="mb-1">{{ titulo }}</h1>
          <p v-if="subtitulo" class="texto-2 mb-4">{{ subtitulo }}</p>

          <slot />
        </div>
      </div>
    </section>
  </div>
</template>
