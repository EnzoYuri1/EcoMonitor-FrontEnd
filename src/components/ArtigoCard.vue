<script setup>
import { formatarDataHora, formatarNumero, truncar } from '@/utils/format'

defineProps({
  artigo: {
    type: Object,
    required: true,
  },
})

const ROTULOS_TEMA = {
  queimadas: 'Queimadas',
  desmatamento: 'Desmatamento',
  biodiversidade: 'Biodiversidade',
  clima: 'Mudanças climáticas',
  amazonia: 'Amazônia',
}

function rotuloTema(cat) {
  return ROTULOS_TEMA[cat] || cat || 'Pesquisa ambiental'
}
</script>

<template>
  <article class="central-card artigo-card">
    <div class="central-card-body">
      <div class="central-card-meta">
        <span class="central-badge central-badge-cientifico">
          <i class="bi bi-journal-bookmark me-1" aria-hidden="true"></i>
          {{ artigo.base_origem }}
        </span>
        <span class="central-badge central-badge-cat">
          {{ rotuloTema(artigo.categoria) }}
        </span>
        <span v-if="artigo.pesquisa_brasileira" class="central-badge central-badge-br">
          Brasil / América Latina
        </span>
        <span v-if="artigo.ano_publicacao" class="texto-3 small ms-auto">
          Ano: <strong>{{ artigo.ano_publicacao }}</strong>
        </span>
      </div>

      <h3 class="central-card-title">
        <a
          :href="artigo.url_original"
          target="_blank"
          rel="noopener noreferrer"
          class="central-card-link"
        >
          {{ artigo.titulo }}
        </a>
      </h3>

      <p class="artigo-autores">
        <strong>Autores:</strong> {{ truncar(artigo.autores, 160) }}
      </p>
      <p class="artigo-periodico">
        <strong>Periódico / Instituição:</strong> {{ artigo.instituicao_ou_periodico }}
      </p>

      <p class="central-card-desc">
        {{ truncar(artigo.resumo, 260) }}
      </p>

      <div v-if="artigo.palavras_chave" class="artigo-tags">
        <span
          v-for="tag in String(artigo.palavras_chave).split(',').slice(0, 5)"
          :key="tag"
          class="artigo-tag"
        >
          {{ tag.trim() }}
        </span>
      </div>

      <div class="central-card-footer">
        <div class="central-card-dates">
          <span v-if="artigo.doi">
            <strong>DOI:</strong>
            <a
              :href="`https://doi.org/${artigo.doi}`"
              target="_blank"
              rel="noopener noreferrer"
              class="ms-1"
            >
              {{ artigo.doi }}
            </a>
          </span>
          <span v-else class="texto-3">DOI não informado na base</span>
          <span class="texto-3">
            Citações: {{ formatarNumero(artigo.citacoes) }} · Coletado em {{ formatarDataHora(artigo.coletado_em) }}
          </span>
        </div>

        <a
          :href="artigo.url_original"
          target="_blank"
          rel="noopener noreferrer"
          class="panel-link"
        >
          Acessar publicação
          <i class="bi bi-box-arrow-up-right" aria-hidden="true"></i>
        </a>
      </div>
    </div>
  </article>
</template>
