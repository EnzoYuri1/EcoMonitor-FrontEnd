<script setup>
import { RouterLink } from 'vue-router'
</script>

<template>
  <div>
    <div class="mb-4">
      <h2 class="h3 fw-bold mb-1">Relatórios</h2>
      <p class="text-secondary mb-0">
        Análises consolidadas e exportação de dados ambientais.
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
          <i class="bi bi-file-earmark-bar-graph"></i>
        </div>

        <h3 class="h4 fw-bold mt-3">Relatórios ambientais</h3>
        <p class="text-secondary mx-auto placeholder-descricao">
          Esta área vai reunir relatórios com recortes por período, tipo e
          município, além de opções de exportação. A funcionalidade ainda
          não faz parte do escopo atual do EcoMonitor.
        </p>

        <ul class="placeholder-list text-start mx-auto">
          <li>
            <i class="bi bi-calendar-range me-2" aria-hidden="true"></i>
            Resumo de ocorrências por período
          </li>
          <li>
            <i class="bi bi-bar-chart me-2" aria-hidden="true"></i>
            Comparativo entre municípios e tipos
          </li>
          <li>
            <i class="bi bi-download me-2" aria-hidden="true"></i>
            Exportação dos dados em CSV ou PDF
          </li>
        </ul>

        <div class="d-flex flex-wrap justify-content-center gap-2 mt-4">
          <RouterLink
            class="btn btn-primary"
            :to="{ name: 'dashboard' }"
          >
            <i class="bi bi-speedometer2 me-2" aria-hidden="true"></i>
            Ver dashboard
          </RouterLink>
          <RouterLink
            class="btn btn-outline-secondary"
            :to="{ name: 'ocorrencias' }"
          >
            <i class="bi bi-list-ul me-2" aria-hidden="true"></i>
            Ver ocorrências
          </RouterLink>
        </div>
      </div>
    </div>
  </div>
</template>
