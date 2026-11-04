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
      <div class="brand brand-hero">
        <span class="brand-icon" aria-hidden="true">
          <i class="bi bi-tree-fill"></i>
        </span>
        <span>
          <strong>EcoMonitor</strong>
          <small>Monitoramento ambiental</small>
        </span>
      </div>

      <div class="auth-hero-content">
        <p class="auth-eyebrow">Queimadas e desmatamento</p>
        <h2 class="display-6 fw-bold mb-3">
          Dados ambientais organizados em um só lugar.
        </h2>
        <p class="auth-hero-text mb-4">
          Registre ocorrências, acompanhe indicadores e consulte o histórico
          por município, tipo e período.
        </p>

        <ul class="auth-features">
          <li>
            <i class="bi bi-check-circle-fill" aria-hidden="true"></i>
            Cadastro e consulta de ocorrências ambientais
          </li>
          <li>
            <i class="bi bi-check-circle-fill" aria-hidden="true"></i>
            Dashboard com indicadores e gráficos
          </li>
          <li>
            <i class="bi bi-check-circle-fill" aria-hidden="true"></i>
            Acesso seguro com autenticação JWT
          </li>
        </ul>
      </div>

      <p class="auth-hero-footer mb-0">
        EcoMonitor · Dados reais consumidos da API FastAPI
      </p>
    </section>

    <section class="auth-form-wrap">
      <div class="auth-card card shadow-sm">
        <div class="card-body p-4 p-md-5">
          <RouterLink
            class="brand brand-dark d-lg-none mb-4"
            :to="{ name: 'login' }"
          >
            <span class="brand-icon" aria-hidden="true">
              <i class="bi bi-tree-fill"></i>
            </span>
            <span>
              <strong>EcoMonitor</strong>
              <small>Monitoramento ambiental</small>
            </span>
          </RouterLink>

          <h1 class="h3 fw-bold mb-1">{{ titulo }}</h1>
          <p v-if="subtitulo" class="text-secondary mb-4">
            {{ subtitulo }}
          </p>

          <slot />
        </div>
      </div>
    </section>
  </div>
</template>
