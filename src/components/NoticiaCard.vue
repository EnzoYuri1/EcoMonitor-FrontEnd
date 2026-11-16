<script setup>
import { computed } from 'vue'

import { formatarData, formatarDataHora, truncar } from '@/utils/format'
import { inferirLocalizacaoNoticia } from '@/utils/noticiaImpacto'

const props = defineProps({
  noticia: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['ver-impacto'])

const ROTULOS_CATEGORIA = {
  queimadas: 'Queimadas',
  desmatamento: 'Desmatamento',
  amazonia: 'Amazônia',
  para: 'Pará',
  clima: 'Mudanças climáticas',
  fiscalizacao: 'Fiscalização ambiental',
  preservacao: 'Preservação',
}

function rotuloCategoria(cat) {
  return ROTULOS_CATEGORIA[cat] || cat || 'Ambiente'
}

const localizacao = computed(() => inferirLocalizacaoNoticia(props.noticia))
</script>

<template>
  <article class="central-card noticia-card">
    <div v-if="noticia.imagem_url" class="noticia-card-media">
      <img
        :src="noticia.imagem_url"
        :alt="noticia.titulo"
        loading="lazy"
        class="noticia-card-img"
      />
    </div>
    <div class="central-card-body">
      <div class="central-card-meta">
        <span class="central-badge central-badge-cat">
          {{ rotuloCategoria(noticia.categoria) }}
        </span>
        <span class="central-badge central-badge-fonte" :title="`Origem: ${noticia.origem_integracao}`">
          <i class="bi bi-newspaper me-1" aria-hidden="true"></i>
          {{ noticia.veiculo }}
        </span>
        <span class="central-badge central-badge-br" :title="localizacao.precisao">
          <i class="bi bi-geo-alt me-1" aria-hidden="true"></i>
          {{ localizacao.rotulo }}
        </span>
      </div>

      <h3 class="central-card-title">
        <a
          :href="noticia.url_original"
          target="_blank"
          rel="noopener noreferrer"
          class="central-card-link"
        >
          {{ noticia.titulo }}
        </a>
      </h3>

      <p v-if="noticia.descricao" class="central-card-desc">
        {{ truncar(noticia.descricao, 190) }}
      </p>

      <div class="central-card-footer">
        <div class="central-card-dates">
          <span v-if="noticia.data_publicacao" title="Data de publicação da matéria">
            <i class="bi bi-calendar3 me-1" aria-hidden="true"></i>
            Publicado: {{ formatarData(noticia.data_publicacao) }}
          </span>
          <span class="texto-3" title="Data de coleta pelo EcoMonitor">
            Coletado: {{ formatarDataHora(noticia.coletado_em) }}
          </span>
        </div>

        <div class="d-flex flex-wrap align-items-center gap-2">
          <button
            type="button"
            class="btn btn-sm btn-outline-secondary central-impacto-btn"
            @click="emit('ver-impacto', noticia)"
          >
            <i class="bi bi-geo-alt-fill me-1" aria-hidden="true"></i>
            Impacto no mapa
          </button>

          <a
            :href="noticia.url_original"
            target="_blank"
            rel="noopener noreferrer"
            class="panel-link"
          >
            Ler matéria original
            <i class="bi bi-box-arrow-up-right" aria-hidden="true"></i>
          </a>
        </div>
      </div>
    </div>
  </article>
</template>
