<script setup>
import { RouterLink } from 'vue-router'
</script>

<template>
  <div>
    <div class="mb-4">
      <h2 class="h3 fw-bold mb-1">Mapa</h2>
      <p class="text-secondary mb-0">
        Visualização geográfica das ocorrências ambientais.
      </p>
    </div>

    <div class="card placeholder-card">
      <div class="card-body p-4 p-md-5 text-center">
        <span
          class="badge rounded-pill bg-warning-subtle text-warning-emphasis mb-3"
        >
          Em breve
        </span>

        <div class="placeholder-icon" aria-hidden="true">
          <i class="bi bi-map"></i>
        </div>

        <h3 class="h4 fw-bold mt-3">Mapa de ocorrências</h3>
        <p class="text-secondary mx-auto placeholder-descricao">
          Esta área vai exibir as ocorrências em um mapa interativo, usando
          as coordenadas informadas no cadastro. A funcionalidade ainda não
          faz parte do escopo atual do EcoMonitor.
        </p>

        <ul class="placeholder-list text-start mx-auto">
          <li>
            <i class="bi bi-geo-alt me-2" aria-hidden="true"></i>
            Marcadores por ocorrência com latitude e longitude
          </li>
          <li>
            <i class="bi bi-funnel me-2" aria-hidden="true"></i>
            Filtros por tipo, município e período
          </li>
          <li>
            <i class="bi bi-collection me-2" aria-hidden="true"></i>
            Agrupamento de registros por região
          </li>
        </ul>

        <div class="d-flex flex-wrap justify-content-center gap-2 mt-4">
          <RouterLink
            class="btn btn-primary"
            :to="{ name: 'ocorrencias' }"
          >
            <i class="bi bi-list-ul me-2" aria-hidden="true"></i>
            Ver ocorrências
          </RouterLink>
          <RouterLink
            class="btn btn-outline-secondary"
            :to="{ name: 'dashboard' }"
          >
            <i class="bi bi-speedometer2 me-2" aria-hidden="true"></i>
            Voltar ao dashboard
          </RouterLink>
        </div>
      </div>
    </div>
  </div>
</template>
