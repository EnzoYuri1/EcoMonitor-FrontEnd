<script setup>
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  reactive,
  ref,
  watch,
} from 'vue'

import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

import { RouterLink, useRoute } from 'vue-router'

import EmptyState from '@/components/EmptyState.vue'
import PageHeader from '@/components/PageHeader.vue'
import SeverityBadge from '@/components/SeverityBadge.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import TipoBadge from '@/components/TipoBadge.vue'
import { listarTodasOcorrencias } from '@/services/ocorrencias'
import { useAuthStore } from '@/stores/auth'
import { useDemoStore } from '@/stores/demo'
import { SEVERIDADES, STATUS, TIPOS, UFS } from '@/utils/constants'
import {
  filtrarOcorrencias,
  mesMaisRepresentativo,
} from '@/utils/demo'
import {
  corTipo,
  formatarAreaComUnidade,
  formatarData,
  formatarMesLongo,
  formatarNumero,
  truncar,
} from '@/utils/format'
import {
  MAPA_CENTRO_BRASIL,
  MAPA_PADDING_AJUSTE,
  MAPA_ZOOM_AJUSTE_MAXIMO,
  MAPA_ZOOM_INICIAL,
  calcularLimites,
  contarPorTipo,
  dentroDoBrasil,
  formatarCoordenadas,
  separarOcorrenciasMapeaveis,
} from '@/utils/map'

const route = useRoute()
const auth = useAuthStore()
const demo = useDemoStore()

const filtros = reactive({
  tipo: '',
  estado: '',
  severidade: '',
  status: '',
  data_inicio: '',
  data_fim: '',
  busca: '',
})

const aplicados = reactive({ ...filtros })

const todos = ref([])
const carregando = ref(true)
const erro = ref('')
const aviso = ref('')

const selecionada = ref(null)

const mapaEl = ref(null)
const mapaPronto = ref(false)

let mapa = null
let camadaMarcadores = null

const enriquecidos = computed(() =>
  demo.enriquecerLista(
    todos.value,
    auth.nomeUsuario || 'Equipe de monitoramento',
  ),
)

const filtradas = computed(() =>
  filtrarOcorrencias(enriquecidos.value, aplicados),
)

const separadas = computed(() =>
  separarOcorrenciasMapeaveis(filtradas.value),
)

const mapeaveis = computed(() =>
  separadas.value.comCoordenadas.filter((item) =>
    dentroDoBrasil(item.latitude, item.longitude),
  ),
)

const foraDaArea = computed(
  () => separadas.value.comCoordenadas.length - mapeaveis.value.length,
)

const semCoordenadas = computed(
  () => separadas.value.semCoordenadas.length,
)

const contagens = computed(() => contarPorTipo(mapeaveis.value))

const temFiltrosAtivos = computed(() =>
  Boolean(
    aplicados.tipo ||
      aplicados.estado ||
      aplicados.severidade ||
      aplicados.status ||
      aplicados.data_inicio ||
      aplicados.data_fim ||
      aplicados.busca,
  ),
)

const mesReferencia = computed(() => mesMaisRepresentativo(filtradas.value))

const relacionadas = computed(() => {
  if (!selecionada.value) return []

  return filtradas.value
    .filter(
      (item) =>
        item.id !== selecionada.value.id &&
        item.municipio === selecionada.value.municipio &&
        item.estado === selecionada.value.estado,
    )
    .slice(0, 4)
})

const resumoRecorte = computed(() => {
  if (carregando.value) return 'Consultando as ocorrências da API...'
  if (erro.value) return 'Não foi possível carregar os dados.'

  return `${formatarNumero(mapeaveis.value.length)} de ${formatarNumero(
    filtradas.value.length,
  )} ocorrências no mapa`
})

const tituloVazio = computed(() => {
  if (temFiltrosAtivos.value) return 'Nenhuma ocorrência no mapa'

  if (filtradas.value.length) return 'Ocorrências sem localização válida'

  return 'Nenhuma ocorrência cadastrada'
})

const descricaoVazio = computed(() => {
  if (temFiltrosAtivos.value) {
    return 'Nenhuma ocorrência corresponde aos filtros selecionados. Ajuste ou limpe os filtros para tentar novamente.'
  }

  if (filtradas.value.length) {
    return 'As ocorrências encontradas não possuem coordenadas válidas dentro do território brasileiro. Edite os registros para informar a localização.'
  }

  return 'Cadastre ocorrências com latitude e longitude para visualizá-las no mapa.'
})

function criarIcone(tipo, ativo = false) {
  return L.divIcon({
    className: 'mapa-marcador',
    html: `<span class="mapa-marcador-pino${
      ativo ? ' mapa-marcador-pino-ativo' : ''
    }" style="--mapa-cor:${corTipo(tipo)}"></span>`,
    iconSize: ativo ? [22, 22] : [16, 16],
    iconAnchor: ativo ? [11, 11] : [8, 8],
  })
}

function selecionar(item) {
  selecionada.value = item

  if (!mapa || !item) return

  mapa.flyTo(
    [Number(item.latitude), Number(item.longitude)],
    Math.max(mapa.getZoom(), 7),
    { duration: 0.45 },
  )
}

function renderizarMarcadores() {
  if (!mapa || !camadaMarcadores) return

  camadaMarcadores.clearLayers()

  for (const item of mapeaveis.value) {
    const ativo = selecionada.value?.id === item.id

    const marcador = L.marker(
      [Number(item.latitude), Number(item.longitude)],
      {
        icon: criarIcone(item.tipo, ativo),
        title: `${item.codigo} · ${item.municipio}/${item.estado}`,
        zIndexOffset: ativo ? 1000 : 0,
      },
    )

    marcador.bindTooltip(
      `${item.codigo} · ${item.municipio}/${item.estado}`,
      { direction: 'top', offset: [0, -10] },
    )
    marcador.on('click', () => selecionar(item))
    camadaMarcadores.addLayer(marcador)
  }
}

function ajustarAosMarcadores() {
  if (!mapa) return

  const limites = calcularLimites(mapeaveis.value)

  if (!limites) {
    mapa.setView(MAPA_CENTRO_BRASIL, MAPA_ZOOM_INICIAL)
    return
  }

  mapa.fitBounds(limites, {
    padding: MAPA_PADDING_AJUSTE,
    maxZoom: MAPA_ZOOM_AJUSTE_MAXIMO,
  })
}

function centralizarBrasil() {
  if (!mapa) return
  mapa.setView(MAPA_CENTRO_BRASIL, MAPA_ZOOM_INICIAL)
}

function inicializarMapa() {
  if (mapa || !mapaEl.value) return

  mapa = L.map(mapaEl.value, {
    center: MAPA_CENTRO_BRASIL,
    zoom: MAPA_ZOOM_INICIAL,
    minZoom: 3,
    zoomControl: true,
    scrollWheelZoom: true,
  })

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>',
  }).addTo(mapa)

  camadaMarcadores = L.layerGroup().addTo(mapa)
  mapaPronto.value = true
}

async function carregar() {
  carregando.value = true
  erro.value = ''
  aviso.value = ''

  try {
    const resultado = await listarTodasOcorrencias()
    todos.value = resultado.items || []

    await nextTick()

    const idRota = route.query.id
    const alvo = idRota
      ? mapeaveis.value.find(
          (item) => String(item.id) === String(idRota),
        )
      : null

    selecionada.value = alvo || mapeaveis.value[0] || null
    renderizarMarcadores()

    if (alvo) {
      selecionar(alvo)
    } else {
      ajustarAosMarcadores()
    }
  } catch (error) {
    todos.value = []
    selecionada.value = null
    camadaMarcadores?.clearLayers()
    centralizarBrasil()
    erro.value =
      error?.message || 'Não foi possível carregar as ocorrências.'
  } finally {
    carregando.value = false
  }
}

function aplicarFiltros() {
  aviso.value = ''

  if (
    filtros.data_inicio &&
    filtros.data_fim &&
    filtros.data_inicio > filtros.data_fim
  ) {
    aviso.value = 'A data inicial não pode ser posterior à data final.'
    return
  }

  Object.assign(aplicados, filtros)
  selecionada.value = mapeaveis.value[0] || null
}

function limparFiltros() {
  Object.assign(filtros, {
    tipo: '',
    estado: '',
    severidade: '',
    status: '',
    data_inicio: '',
    data_fim: '',
    busca: '',
  })
  Object.assign(aplicados, filtros)
  aviso.value = ''
  selecionada.value = mapeaveis.value[0] || null
}

watch(
  mapeaveis,
  async () => {
    await nextTick()
    renderizarMarcadores()
    ajustarAosMarcadores()

    if (
      selecionada.value &&
      !mapeaveis.value.some((item) => item.id === selecionada.value.id)
    ) {
      selecionada.value = mapeaveis.value[0] || null
    }
  },
  { deep: true },
)

watch(selecionada, () => {
  renderizarMarcadores()
})

onMounted(async () => {
  await nextTick()
  inicializarMapa()
  carregar()
})

onBeforeUnmount(() => {
  if (mapa) {
    mapa.remove()
    mapa = null
  }

  camadaMarcadores = null
  mapaPronto.value = false
})
</script>

<template>
  <div>
    <PageHeader
      eyebrow="Monitoramento"
      titulo="Mapa de monitoramento"
      descricao="Explore a distribuição geográfica das ocorrências e selecione um ponto para consultar o contexto do registro."
    >
      <template #acoes>
        <RouterLink class="btn btn-outline-secondary" :to="{ name: 'ocorrencias' }">
          <i class="bi bi-list-check me-2" aria-hidden="true"></i>
          Ver lista
        </RouterLink>
        <RouterLink class="btn btn-primary" :to="{ name: 'nova-ocorrencia' }">
          <i class="bi bi-plus-lg me-2" aria-hidden="true"></i>
          Nova ocorrência
        </RouterLink>
      </template>
    </PageHeader>

    <form class="filters-bar mapa-filtros" @submit.prevent="aplicarFiltros">
      <div class="filter-field">
        <label for="mapa-tipo">Tipo</label>
        <select id="mapa-tipo" v-model="filtros.tipo" class="form-select">
          <option value="">Todos</option>
          <option v-for="tipo in TIPOS" :key="tipo.value" :value="tipo.value">
            {{ tipo.label }}
          </option>
        </select>
      </div>

      <div class="filter-field">
        <label for="mapa-estado">Estado</label>
        <select id="mapa-estado" v-model="filtros.estado" class="form-select">
          <option value="">Todas as UF</option>
          <option v-for="uf in UFS" :key="uf" :value="uf">{{ uf }}</option>
        </select>
      </div>

      <div class="filter-field">
        <label for="mapa-severidade">Severidade</label>
        <select
          id="mapa-severidade"
          v-model="filtros.severidade"
          class="form-select"
        >
          <option value="">Todas</option>
          <option
            v-for="opcao in SEVERIDADES"
            :key="opcao.value"
            :value="opcao.value"
          >
            {{ opcao.label }}
          </option>
        </select>
      </div>

      <div class="filter-field">
        <label for="mapa-status">Status</label>
        <select id="mapa-status" v-model="filtros.status" class="form-select">
          <option value="">Todos</option>
          <option
            v-for="opcao in STATUS"
            :key="opcao.value"
            :value="opcao.value"
          >
            {{ opcao.label }}
          </option>
        </select>
      </div>

      <div class="filter-field">
        <label for="mapa-inicio">Data inicial</label>
        <input
          id="mapa-inicio"
          v-model="filtros.data_inicio"
          type="date"
          class="form-control"
        />
      </div>

      <div class="filter-field">
        <label for="mapa-fim">Data final</label>
        <input
          id="mapa-fim"
          v-model="filtros.data_fim"
          type="date"
          class="form-control"
        />
      </div>

      <div class="filter-field filter-field-grow">
        <label for="mapa-busca">Busca</label>
        <div class="search-field">
          <i class="bi bi-search" aria-hidden="true"></i>
          <input
            id="mapa-busca"
            v-model="filtros.busca"
            type="search"
            class="form-control"
            placeholder="Código, município ou UF"
          />
        </div>
      </div>

      <div class="filter-actions d-flex gap-2">
        <button type="submit" class="btn btn-primary">
          <i class="bi bi-funnel me-1" aria-hidden="true"></i>
          Aplicar
        </button>
        <button
          type="button"
          class="btn btn-outline-secondary"
          title="Limpar filtros"
          aria-label="Limpar filtros"
          @click="limparFiltros"
        >
          <i class="bi bi-x-lg" aria-hidden="true"></i>
          <span>Limpar filtros</span>
        </button>
      </div>
    </form>

    <div
      v-if="aviso"
      class="alert alert-warning d-flex align-items-center gap-2"
      role="alert"
    >
      <i class="bi bi-exclamation-triangle" aria-hidden="true"></i>
      {{ aviso }}
    </div>

    <div v-if="erro" class="alert alert-danger d-flex flex-wrap align-items-center gap-2" role="alert">
      <i class="bi bi-wifi-off" aria-hidden="true"></i>
      <span class="flex-grow-1">{{ erro }}</span>
      <button type="button" class="btn btn-sm btn-outline-danger" @click="carregar">
        Tentar novamente
      </button>
    </div>

    <div class="mapa-layout">
      <section class="panel mapa-panel">
        <div class="mapa-toolbar">
          <div class="mapa-contagem">
            <strong>{{ formatarNumero(mapeaveis.length) }}</strong>
            <span>pontos no mapa</span>
            <span class="topbar-divider mx-1" aria-hidden="true"></span>
            <span>{{ resumoRecorte }}</span>
          </div>

          <div class="d-flex flex-wrap gap-2">
            <button
              type="button"
              class="btn btn-sm btn-outline-secondary"
              :disabled="!mapaPronto || !mapeaveis.length"
              @click="ajustarAosMarcadores"
            >
              <i class="bi bi-arrows-fullscreen me-1" aria-hidden="true"></i>
              Ajustar
            </button>
            <button
              type="button"
              class="btn btn-sm btn-outline-secondary"
              :disabled="!mapaPronto"
              @click="centralizarBrasil"
            >
              <i class="bi bi-globe-americas me-1" aria-hidden="true"></i>
              Brasil
            </button>
          </div>
        </div>

        <div class="mapa-wrap">
          <div
            ref="mapaEl"
            class="mapa-canvas"
            role="application"
            aria-label="Mapa interativo de ocorrências ambientais"
          ></div>

          <div class="mapa-legenda" aria-label="Legenda e contagem por tipo">
            <p class="mapa-legenda-titulo">Legenda</p>
            <ul class="mapa-legenda-lista">
              <li
                v-for="tipo in TIPOS"
                :key="tipo.value"
                class="mapa-legenda-item"
              >
                <span
                  class="mapa-legenda-cor"
                  :style="{ backgroundColor: corTipo(tipo.value) }"
                  aria-hidden="true"
                ></span>
                <span class="mapa-legenda-rotulo">{{ tipo.label }}</span>
                <span class="mapa-legenda-contagem">
                  {{ formatarNumero(contagens[tipo.value] || 0) }}
                </span>
              </li>
            </ul>
          </div>

          <div v-if="carregando" class="mapa-overlay">
            <div class="mapa-overlay-card text-center">
              <div class="spinner-border text-primary" role="status" aria-hidden="true"></div>
              <p class="mt-3 mb-1"><strong>Carregando ocorrências</strong></p>
              <p class="texto-3 small mb-0">Consultando a API do EcoMonitor...</p>
            </div>
          </div>

          <div v-else-if="!mapeaveis.length" class="mapa-overlay">
            <div class="mapa-overlay-card">
              <EmptyState
                :titulo="tituloVazio"
                :descricao="descricaoVazio"
                icone="bi-geo-alt"
              >
                <button
                  v-if="temFiltrosAtivos"
                  type="button"
                  class="btn btn-outline-primary"
                  @click="limparFiltros"
                >
                  <i class="bi bi-x-circle me-2" aria-hidden="true"></i>
                  Limpar filtros
                </button>
                <RouterLink
                  v-else
                  class="btn btn-primary"
                  :to="{ name: 'nova-ocorrencia' }"
                >
                  <i class="bi bi-plus-lg me-2" aria-hidden="true"></i>
                  Cadastrar ocorrência
                </RouterLink>
              </EmptyState>
            </div>
          </div>
        </div>

        <div class="mapa-rodape">
          <span>
            <i class="bi bi-info-circle me-1" aria-hidden="true"></i>
            Ocorrências sem coordenadas válidas ou fora do território brasileiro
            não aparecem no mapa.
          </span>
          <span class="d-flex flex-wrap gap-2">
            <span v-if="semCoordenadas" class="badge eco-badge status-badge" style="color: #f6c453; background-color: rgba(246, 196, 83, 0.1); border-color: rgba(246, 196, 83, 0.35)">
              {{ formatarNumero(semCoordenadas) }} sem coordenadas
            </span>
            <span v-if="foraDaArea" class="badge eco-badge status-badge" style="color: #f6c453; background-color: rgba(246, 196, 83, 0.1); border-color: rgba(246, 196, 83, 0.35)">
              {{ formatarNumero(foraDaArea) }} fora da cobertura
            </span>
          </span>
        </div>
      </section>

      <aside class="contexto-panel">
        <template v-if="selecionada">
          <p class="contexto-label">Ocorrência selecionada</p>
          <p class="contexto-codigo">{{ selecionada.codigo }}</p>
          <p class="contexto-local">
            {{ selecionada.municipio }}/{{ selecionada.estado }} ·
            {{ formatarData(selecionada.data_ocorrencia) }}
          </p>

          <div class="contexto-badges">
            <TipoBadge :tipo="selecionada.tipo" />
            <SeverityBadge :severidade="selecionada.severidade" />
            <StatusBadge :status="selecionada.status" />
          </div>

          <dl class="contexto-dados">
            <div>
              <dt>Área estimada</dt>
              <dd>{{ formatarAreaComUnidade(selecionada.area_estimada) }}</dd>
            </div>
            <div>
              <dt>Bioma</dt>
              <dd>{{ selecionada.bioma }}</dd>
            </div>
            <div>
              <dt>Coordenadas</dt>
              <dd class="mono-num">
                {{
                  formatarCoordenadas(
                    selecionada.latitude,
                    selecionada.longitude,
                  )
                }}
              </dd>
            </div>
            <div>
              <dt>Responsável</dt>
              <dd>
                {{
                  Number(selecionada.created_by) === Number(auth.userId)
                    ? 'Você'
                    : 'Outro usuário'
                }}
              </dd>
            </div>
          </dl>

          <p class="contexto-resumo">
            {{ truncar(selecionada.descricao, 220) }}
          </p>

          <RouterLink
            class="btn btn-primary w-100"
            :to="{
              name: 'ocorrencia-detalhe',
              params: { id: selecionada.id },
            }"
          >
            Abrir detalhe
            <i class="bi bi-arrow-right ms-1" aria-hidden="true"></i>
          </RouterLink>

          <div class="contexto-relacionados">
            <h3>No mesmo município</h3>

            <template v-if="relacionadas.length">
              <button
                v-for="item in relacionadas"
                :key="item.id"
                type="button"
                class="contexto-relacionado w-100 text-start"
                @click="selecionar(item)"
              >
                <span>
                  <strong class="d-block">{{ item.codigo }}</strong>
                  <small class="texto-3">
                    {{ formatarData(item.data_ocorrencia) }}
                  </small>
                </span>
                <TipoBadge :tipo="item.tipo" />
              </button>
            </template>

            <p v-else class="texto-3 small mb-0">
              Nenhum outro registro no mesmo município para este recorte.
            </p>
          </div>

          <p class="contexto-nota">
            Severidade, status, área e bioma são metadados demonstrativos.
            Nada é gravado no backend.
          </p>
        </template>

        <template v-else>
          <p class="contexto-label">Resumo do recorte</p>
          <p class="contexto-codigo">
            {{ formatarNumero(filtradas.length) }}
          </p>
          <p class="contexto-local">
            ocorrências encontradas{{ temFiltrosAtivos ? ' nos filtros atuais' : '' }}
          </p>

          <div class="contexto-badges">
            <TipoBadge
              v-for="tipo in TIPOS"
              :key="tipo.value"
              :tipo="tipo.value"
            />
          </div>

          <dl class="contexto-dados">
            <div>
              <dt>Queimadas</dt>
              <dd>{{ formatarNumero(contagens.queimada || 0) }}</dd>
            </div>
            <div>
              <dt>Desmatamentos</dt>
              <dd>{{ formatarNumero(contagens.desmatamento || 0) }}</dd>
            </div>
            <div>
              <dt>No mapa</dt>
              <dd>{{ formatarNumero(mapeaveis.length) }}</dd>
            </div>
            <div>
              <dt>Mês de referência</dt>
              <dd>{{ mesReferencia ? formatarMesLongo(mesReferencia) : '—' }}</dd>
            </div>
          </dl>

          <p class="contexto-nota">
            Selecione um ponto no mapa para consultar o contexto do registro.
          </p>
        </template>
      </aside>
    </div>

    <p class="texto-3 small mt-3 mb-0">
      <i class="bi bi-pin-map me-1" aria-hidden="true"></i>
      Base cartográfica do OpenStreetMap. A seleção no mapa não altera o
      registro original.
    </p>
  </div>
</template>
