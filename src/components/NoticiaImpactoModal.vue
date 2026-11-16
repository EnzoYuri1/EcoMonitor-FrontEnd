<script setup>
import { computed, ref, watch } from 'vue'

import BaseModal from '@/components/BaseModal.vue'
import KpiCard from '@/components/KpiCard.vue'
import MiniMapa from '@/components/MiniMapa.vue'
import { formatarData, formatarDataHora, formatarNumero } from '@/utils/format'
import { formatarCoordenadas } from '@/utils/map'
import {
  cruzarImpactoComMonitoramento,
  obterRegiaoPorId,
  REGIOES_AREA_AFETADA,
} from '@/utils/noticiaImpacto'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  noticia: {
    type: Object,
    default: null,
  },
  monitoramento: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['update:modelValue'])

const regiaoManualId = ref('')

watch(
  () => props.noticia,
  () => {
    regiaoManualId.value = ''
  },
)

const impacto = computed(() =>
  props.noticia
    ? cruzarImpactoComMonitoramento(props.noticia, props.monitoramento)
    : null,
)

const regiaoAtiva = computed(() => {
  if (regiaoManualId.value) {
    return obterRegiaoPorId(regiaoManualId.value)
  }
  return impacto.value?.poligonoArea?.regiao || REGIOES_AREA_AFETADA[0]
})

const poligonosDoMapa = computed(() => {
  if (!regiaoAtiva.value) return []
  const reg = regiaoAtiva.value
  return [
    {
      id: `modal-area-${reg.id}`,
      rotulo: `Área afetada: ${reg.nome}`,
      subtitulo: reg.descricao,
      cor: reg.cor || '#dc2626',
      preenchimento: reg.preenchimento || '#ef4444',
      opacidade: reg.opacidade || 0.44,
      coordenadas: reg.coordenadas,
    },
  ]
})

const pontosDoMapa = computed(() => {
  if (!impacto.value || !props.noticia) return []
  const loc = impacto.value.localizacao
  const pontoNoticia = {
    id: `noticia-${props.noticia.id}`,
    codigo: 'Local citado na notícia',
    tipo: loc.tipoMapa,
    municipio: loc.municipio || loc.rotulo,
    estado: loc.estado,
    latitude: loc.latitude,
    longitude: loc.longitude,
  }
  return [pontoNoticia, ...impacto.value.pontosOficiaisProximos]
})

const coordenadaDestaque = computed(() => {
  if (regiaoManualId.value && regiaoAtiva.value?.centro) {
    return regiaoAtiva.value.centro
  }
  if (!impacto.value) return null
  return [
    impacto.value.localizacao.latitude,
    impacto.value.localizacao.longitude,
  ]
})
</script>

<template>
  <BaseModal
    :model-value="modelValue"
    title="Mapa da área afetada e impacto territorial"
    size="xl"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div v-if="noticia && impacto" class="noticia-impacto-modal">
      <div class="central-aviso-metodologico mb-3">
        <i class="bi bi-geo-alt-fill me-2" aria-hidden="true"></i>
        <div>
          <strong>Mancha da área afetada: {{ regiaoAtiva.nome }}</strong>
          <span class="ms-2 central-badge central-badge-erro">
            Polígono de pressão regional ({{ regiaoAtiva.estado }})
          </span>
          <p class="mb-0 mt-1 small texto-3">
            {{ regiaoAtiva.descricao }} Os indicadores numéricos abaixo são dados oficiais reais do INPE para a Unidade Federativa ({{ impacto.localizacao.estado }}).
          </p>
        </div>
      </div>

      <div class="central-filtros-chips mb-3" role="group" aria-label="Alternar corredor ou região afetada">
        <span class="texto-3 small me-1">Visualizar mancha regional:</span>
        <button
          type="button"
          class="central-chip-btn"
          :class="{ 'central-chip-ativo': !regiaoManualId }"
          @click="regiaoManualId = ''"
        >
          Região da notícia ({{ impacto.localizacao.rotulo }})
        </button>
        <button
          v-for="reg in REGIOES_AREA_AFETADA"
          :key="reg.id"
          type="button"
          class="central-chip-btn"
          :class="{ 'central-chip-ativo': regiaoManualId === reg.id }"
          @click="regiaoManualId = reg.id"
        >
          {{ reg.rotuloCurto }}
        </button>
      </div>

      <div class="row g-3 mb-3">
        <div class="col-12 col-lg-7">
          <div class="panel h-100">
            <div class="panel-header">
              <div>
                <h3 class="panel-title">Mancha territorial da área afetada</h3>
                <p class="panel-subtitle">
                  Centro de referência: {{ formatarCoordenadas(coordenadaDestaque[0], coordenadaDestaque[1]) }}
                </p>
              </div>
              <span class="central-badge central-badge-erro">
                Área afetada destacada em vermelho
              </span>
            </div>
            <div class="panel-body pt-2">
              <MiniMapa
                :pontos="pontosDoMapa"
                :poligonos="poligonosDoMapa"
                :valor="coordenadaDestaque"
                :centro="coordenadaDestaque"
                :zoom="5"
                altura="360px"
                interativo
                mostrar-legenda
                :rotulo="`Mapa da área afetada: ${regiaoAtiva.nome}`"
              />
            </div>
          </div>
        </div>

        <div class="col-12 col-lg-5 d-flex flex-column gap-3">
          <div class="panel">
            <div class="panel-body">
              <div class="central-card-meta mb-2">
                <span class="central-badge central-badge-fonte">
                  <i class="bi bi-newspaper me-1" aria-hidden="true"></i>
                  {{ noticia.veiculo }}
                </span>
                <span v-if="noticia.data_publicacao" class="texto-3 small">
                  Publicado em {{ formatarData(noticia.data_publicacao) }}
                </span>
              </div>
              <h3 class="h6 mb-2">{{ noticia.titulo }}</h3>
              <p class="small texto-2 mb-2">{{ noticia.descricao }}</p>
              <p class="small texto-3 mb-0">
                Coletado em {{ formatarDataHora(noticia.coletado_em) }}
              </p>
            </div>
          </div>

          <div v-if="impacto.ufResumo" class="kpi-grid" style="grid-template-columns: 1fr 1fr">
            <KpiCard
              :titulo="`Focos de calor em ${impacto.localizacao.estado} (INPE)`"
              :valor="formatarNumero(impacto.ufResumo.focos_calor_total)"
              unidade="focos"
              descricao="Consolidado diário oficial BDQueimadas"
              destaque="acento"
            />
            <KpiCard
              :titulo="`Alertas DETER em ${impacto.localizacao.estado}`"
              :valor="formatarNumero(impacto.ufResumo.alertas_deter_km2)"
              unidade="km²"
              descricao="Alertas operacionais WFS TerraBrasilis"
            />
          </div>

          <div v-if="impacto.focosMunicipio.length" class="panel">
            <div class="panel-header">
              <div>
                <h4 class="panel-title">Municípios com pressão oficial na UF ({{ impacto.localizacao.estado }})</h4>
                <p class="panel-subtitle">Dados do INPE exibidos na mancha regional.</p>
              </div>
            </div>
            <div class="table-responsive">
              <table class="table table-sm align-middle mb-0">
                <thead>
                  <tr>
                    <th>Município</th>
                    <th>Métrica INPE</th>
                    <th class="text-end">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="mun in impacto.focosMunicipio.slice(0, 5)" :key="mun.id">
                    <td><strong>{{ mun.municipio }}</strong></td>
                    <td class="small texto-3">{{ mun.periodo_rotulo }}</td>
                    <td class="text-end"><strong>{{ formatarNumero(mun.valor) }} {{ mun.unidade }}</strong></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <a
        v-if="noticia"
        :href="noticia.url_original"
        target="_blank"
        rel="noopener noreferrer"
        class="btn btn-primary"
      >
        Abrir matéria original ({{ noticia.veiculo }})
        <i class="bi bi-box-arrow-up-right ms-1" aria-hidden="true"></i>
      </a>
      <button
        type="button"
        class="btn btn-outline-secondary"
        @click="emit('update:modelValue', false)"
      >
        Fechar mapa
      </button>
    </template>
  </BaseModal>
</template>
