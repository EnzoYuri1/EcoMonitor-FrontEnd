<script setup>
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  reactive,
  ref,
} from 'vue'

import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

import { RouterLink } from 'vue-router'

import EmptyState from '@/components/EmptyState.vue'
import { listarOcorrencias } from '@/services/ocorrencias'
import { obterEstatisticas } from '@/services/stats'
import { TIPOS } from '@/utils/constants'
import {
  corTipo,
  dataHojeISO,
  formatarNumero,
  rotuloTipo,
} from '@/utils/format'
import {
  MAPA_CENTRO_BRASIL,
  MAPA_PADDING_AJUSTE,
  MAPA_ZOOM_AJUSTE_MAXIMO,
  MAPA_ZOOM_INICIAL,
  TAMANHO_PAGINA_MAPA,
  calcularLimites,
  contarPorTipo,
  dentroDoBrasil,
  montarConteudoPopup,
  separarOcorrenciasMapeaveis,
} from '@/utils/map'

const hoje = dataHojeISO()

const filtros = reactive({
  tipo: '',
  municipio: '',
  data_inicio: '',
  data_fim: '',
})

const filtrosAplicados = reactive({ ...filtros })

const carregando = ref(true)
const erro = ref('')
const aviso = ref('')

const ocorrencias = ref([])
const semCoordenadas = ref(0)
const foraDaArea = ref(0)
const total = ref(0)

const municipios = ref([])
const carregandoMunicipios = ref(false)
const erroMunicipios = ref('')

const mapaEl = ref(null)
const mapaPronto = ref(false)

let mapa = null
let camadaMarcadores = null
let sequenciaRequisicao = 0

const temFiltrosAtivos = computed(() =>
  Boolean(
    filtrosAplicados.tipo ||
      filtrosAplicados.municipio ||
      filtrosAplicados.data_inicio ||
      filtrosAplicados.data_fim,
  ),
)

const contagens = computed(() => contarPorTipo(ocorrencias.value))

const resumoMapa = computed(() => {
  if (carregando.value) return 'Carregando ocorrências da API...'
  if (erro.value) return 'Não foi possível carregar os dados.'
  if (!total.value) return 'Nenhuma ocorrência encontrada.'

  const partes = [
    `${formatarNumero(ocorrencias.value.length)} de ${formatarNumero(
      total.value,
    )} ocorrências no mapa`,
  ]

  if (semCoordenadas.value) {
    partes.push(
      `${formatarNumero(semCoordenadas.value)} sem coordenadas`,
    )
  }

  if (foraDaArea.value) {
    partes.push(
      `${formatarNumero(foraDaArea.value)} fora da área de cobertura`,
    )
  }

  return partes.join(' · ')
})

const tituloVazio = computed(() => {
  if (temFiltrosAtivos.value) return 'Nenhuma ocorrência no mapa'

  if (total.value > 0) return 'Ocorrências sem localização válida'

  return 'Nenhuma ocorrência cadastrada'
})

const descricaoVazio = computed(() => {
  if (temFiltrosAtivos.value) {
    return 'Nenhuma ocorrência corresponde aos filtros selecionados. Ajuste ou limpe os filtros para tentar novamente.'
  }

  if (total.value > 0) {
    return 'As ocorrências encontradas não possuem coordenadas válidas dentro do território brasileiro. Edite os registros para informar a localização.'
  }

  return 'Cadastre ocorrências com latitude e longitude para visualizá-las no mapa.'
})

function parametrosListagem() {
  return {
    tipo: filtrosAplicados.tipo || undefined,
    municipio: filtrosAplicados.municipio || undefined,
    data_inicio: filtrosAplicados.data_inicio || undefined,
    data_fim: filtrosAplicados.data_fim || undefined,
    page_size: TAMANHO_PAGINA_MAPA,
  }
}

async function buscarTodasOcorrencias() {
  const primeira = await listarOcorrencias({
    ...parametrosListagem(),
    page: 1,
  })

  const totalPaginas = Math.max(1, primeira.pages || 1)
  const itens = [...(primeira.items || [])]

  if (totalPaginas > 1) {
    const respostas = await Promise.all(
      Array.from(
        { length: totalPaginas - 1 },
        (_, indice) =>
          listarOcorrencias({
            ...parametrosListagem(),
            page: indice + 2,
          }),
      ),
    )

    for (const resposta of respostas) {
      itens.push(...(resposta.items || []))
    }
  }

  return {
    itens,
    total: primeira.total || 0,
  }
}

function atualizarMunicipios(itens) {
  const nomes = new Set(municipios.value)

  for (const item of itens) {
    if (item?.municipio) nomes.add(item.municipio)
  }

  municipios.value = [...nomes].sort((a, b) =>
    a.localeCompare(b, 'pt-BR'),
  )
}

function criarIcone(tipo) {
  const icone = tipo === 'queimada' ? 'bi-fire' : 'bi-tree'

  return L.divIcon({
    className: 'mapa-marcador',
    html: `<span class="mapa-marcador-pino" style="--mapa-cor:${corTipo(
      tipo,
    )}"><i class="bi ${icone}"></i></span>`,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -26],
  })
}

function renderizarMarcadores() {
  if (!mapa || !camadaMarcadores) return

  camadaMarcadores.clearLayers()

  for (const item of ocorrencias.value) {
    const marcador = L.marker(
      [Number(item.latitude), Number(item.longitude)],
      {
        icon: criarIcone(item.tipo),
        title: `${rotuloTipo(item.tipo)} em ${item.municipio}/${item.estado}`,
      },
    )

    marcador.bindPopup(montarConteudoPopup(item), {
      maxWidth: 320,
      minWidth: 240,
      autoPanPadding: [32, 32],
    })
    camadaMarcadores.addLayer(marcador)
  }
}

function ajustarAosMarcadores() {
  if (!mapa) return

  const limites = calcularLimites(ocorrencias.value)

  if (!limites) {
    centralizarBrasil()
    return
  }

  mapa.closePopup()
  mapa.fitBounds(limites, {
    padding: MAPA_PADDING_AJUSTE,
    maxZoom: MAPA_ZOOM_AJUSTE_MAXIMO,
  })
}

function centralizarBrasil() {
  if (!mapa) return

  mapa.closePopup()
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
  const requisicao = ++sequenciaRequisicao

  carregando.value = true
  erro.value = ''
  aviso.value = ''

  try {
    const resultado = await buscarTodasOcorrencias()

    if (requisicao !== sequenciaRequisicao) return

    atualizarMunicipios(resultado.itens)

    const separadas = separarOcorrenciasMapeaveis(resultado.itens)
    const noBrasil = separadas.comCoordenadas.filter((item) =>
      dentroDoBrasil(item.latitude, item.longitude),
    )

    ocorrencias.value = noBrasil
    semCoordenadas.value = separadas.semCoordenadas.length
    foraDaArea.value =
      separadas.comCoordenadas.length - noBrasil.length
    total.value = resultado.total

    await nextTick()

    if (requisicao !== sequenciaRequisicao) return

    renderizarMarcadores()
    ajustarAosMarcadores()
  } catch (error) {
    if (requisicao !== sequenciaRequisicao) return

    ocorrencias.value = []
    semCoordenadas.value = 0
    foraDaArea.value = 0
    total.value = 0

    camadaMarcadores?.clearLayers()
    centralizarBrasil()

    erro.value =
      error?.message || 'Não foi possível carregar as ocorrências.'
  } finally {
    if (requisicao === sequenciaRequisicao) {
      carregando.value = false
    }
  }
}

async function carregarMunicipios() {
  carregandoMunicipios.value = true
  erroMunicipios.value = ''

  try {
    const estatisticas = await obterEstatisticas()
    const nomes = (estatisticas.por_municipio || [])
      .map((item) => item.municipio)
      .filter(Boolean)

    atualizarMunicipios(nomes.map((municipio) => ({ municipio })))
  } catch {
    erroMunicipios.value =
      'Não foi possível carregar a lista de municípios. Use os filtros de tipo e período.'
  } finally {
    carregandoMunicipios.value = false
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

  Object.assign(filtrosAplicados, filtros)
  carregar()
}

function limparFiltros() {
  Object.assign(filtros, {
    tipo: '',
    municipio: '',
    data_inicio: '',
    data_fim: '',
  })
  Object.assign(filtrosAplicados, filtros)
  aviso.value = ''
  carregar()
}

onMounted(async () => {
  await nextTick()
  inicializarMapa()
  carregarMunicipios()
  carregar()
})

onBeforeUnmount(() => {
  sequenciaRequisicao += 1

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
    <div class="mb-4">
      <h2 class="h3 fw-bold mb-1">Mapa</h2>
      <p class="text-secondary mb-0">
        Visualização geográfica das ocorrências ambientais cadastradas,
        com dados carregados diretamente da API.
      </p>
    </div>

    <form
      class="card filter-card mb-3"
      @submit.prevent="aplicarFiltros"
    >
      <div class="card-body p-3 p-md-4">
        <div class="row g-3 align-items-end">
          <div class="col-sm-6 col-lg-3">
            <label class="form-label" for="mapa-tipo">Tipo</label>
            <select
              id="mapa-tipo"
              v-model="filtros.tipo"
              class="form-select"
            >
              <option value="">Todos os tipos</option>
              <option
                v-for="tipo in TIPOS"
                :key="tipo.value"
                :value="tipo.value"
              >
                {{ tipo.label }}
              </option>
            </select>
          </div>

          <div class="col-sm-6 col-lg-3">
            <label class="form-label" for="mapa-municipio">
              Município
            </label>
            <select
              id="mapa-municipio"
              v-model="filtros.municipio"
              class="form-select"
              :disabled="carregandoMunicipios && !municipios.length"
            >
              <option value="">
                {{
                  carregandoMunicipios && !municipios.length
                    ? 'Carregando municípios...'
                    : 'Todos os municípios'
                }}
              </option>
              <option
                v-for="municipio in municipios"
                :key="municipio"
                :value="municipio"
              >
                {{ municipio }}
              </option>
            </select>
            <div
              v-if="erroMunicipios"
              class="form-text text-warning-emphasis"
            >
              {{ erroMunicipios }}
            </div>
          </div>

          <div class="col-6 col-lg-2">
            <label class="form-label" for="mapa-data-inicio">
              Data inicial
            </label>
            <input
              id="mapa-data-inicio"
              v-model="filtros.data_inicio"
              type="date"
              class="form-control"
              :max="hoje"
            />
          </div>

          <div class="col-6 col-lg-2">
            <label class="form-label" for="mapa-data-fim">
              Data final
            </label>
            <input
              id="mapa-data-fim"
              v-model="filtros.data_fim"
              type="date"
              class="form-control"
              :max="hoje"
            />
          </div>

          <div class="col-lg-2 d-flex gap-2">
            <button
              type="submit"
              class="btn btn-primary flex-grow-1"
              :disabled="carregando"
            >
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
            </button>
          </div>
        </div>

        <div
          v-if="aviso"
          class="alert alert-warning py-2 px-3 small mt-3 mb-0"
          role="alert"
        >
          {{ aviso }}
        </div>
      </div>
    </form>

    <div class="card mapa-card overflow-hidden">
      <div
        class="card-header d-flex flex-wrap align-items-center justify-content-between gap-2"
      >
        <div class="min-w-0">
          <h3 class="h6 fw-bold mb-1">
            Ocorrências georreferenciadas
          </h3>
          <p
            class="small text-secondary mb-0"
            aria-live="polite"
          >
            {{ resumoMapa }}
          </p>
        </div>

        <div class="d-flex flex-wrap align-items-center gap-2">
          <span
            class="badge rounded-pill text-bg-light border"
            aria-label="Ocorrências exibidas no mapa"
          >
            <i class="bi bi-geo-alt me-1" aria-hidden="true"></i>
            {{ formatarNumero(ocorrencias.length) }} no mapa
          </span>
          <button
            type="button"
            class="btn btn-sm btn-outline-secondary"
            :disabled="
              !mapaPronto || carregando || !ocorrencias.length
            "
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

      <div class="mapa-wrapper">
        <div
          ref="mapaEl"
          class="mapa-canvas"
          role="application"
          aria-label="Mapa interativo de ocorrências ambientais"
        ></div>

        <div
          class="mapa-legenda shadow-sm"
          aria-label="Legenda e contagem por tipo"
        >
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
            <div
              class="spinner-border text-success"
              role="status"
              aria-hidden="true"
            ></div>
            <p class="fw-semibold mt-3 mb-1">
              Carregando ocorrências
            </p>
            <p class="small text-secondary mb-0">
              Consultando a API do EcoMonitor...
            </p>
          </div>
        </div>

        <div v-else-if="erro" class="mapa-overlay">
          <div class="mapa-overlay-card">
            <EmptyState
              titulo="API indisponível"
              :descricao="erro"
              icone="bi-cloud-slash"
            >
              <button
                type="button"
                class="btn btn-primary"
                @click="carregar"
              >
                <i
                  class="bi bi-arrow-clockwise me-2"
                  aria-hidden="true"
                ></i>
                Tentar novamente
              </button>
            </EmptyState>
          </div>
        </div>

        <div v-else-if="!ocorrencias.length" class="mapa-overlay">
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
                :to="{ name: 'ocorrencias' }"
              >
                <i class="bi bi-list-ul me-2" aria-hidden="true"></i>
                Ver ocorrências
              </RouterLink>
            </EmptyState>
          </div>
        </div>
      </div>

      <div
        class="card-footer bg-white d-flex flex-wrap align-items-center justify-content-between gap-2"
      >
        <span class="small text-secondary">
          <i class="bi bi-info-circle me-1" aria-hidden="true"></i>
          Ocorrências sem coordenadas válidas ou fora do território
          brasileiro não aparecem no mapa.
        </span>

        <span class="d-flex flex-wrap gap-2">
          <span
            v-if="semCoordenadas"
            class="badge rounded-pill text-bg-warning"
          >
            {{ formatarNumero(semCoordenadas) }} sem coordenadas
          </span>
          <span
            v-if="foraDaArea"
            class="badge rounded-pill text-bg-warning"
            title="Coordenadas fora dos limites do território brasileiro"
          >
            {{ formatarNumero(foraDaArea) }} fora da área de cobertura
          </span>
        </span>
      </div>
    </div>
  </div>
</template>
