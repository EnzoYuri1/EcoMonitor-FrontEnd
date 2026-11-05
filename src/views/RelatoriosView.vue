<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip,
} from 'chart.js'
import { Bar } from 'vue-chartjs'
import { RouterLink } from 'vue-router'

import EmptyState from '@/components/EmptyState.vue'
import KpiCard from '@/components/KpiCard.vue'
import { listarTodasOcorrencias } from '@/services/ocorrencias'
import { obterEstatisticas } from '@/services/stats'
import { TIPOS } from '@/utils/constants'
import { corTipo, dataHojeISO, formatarNumero } from '@/utils/format'
import {
  agruparMensal,
  agruparPorMunicipio,
  descreverPeriodo,
  formatarPercentual,
  gerarCsv,
  linhasCsvOcorrencias,
  linhasCsvResumo,
  resumirOcorrencias,
} from '@/utils/reports'

ChartJS.register(
  BarElement,
  CategoryScale,
  Legend,
  LinearScale,
  Tooltip,
)

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
const itens = ref([])

const municipios = ref([])
const carregandoMunicipios = ref(false)
const erroMunicipios = ref('')

let sequenciaRequisicao = 0

const temFiltrosAtivos = computed(() =>
  Boolean(
    filtrosAplicados.tipo ||
      filtrosAplicados.municipio ||
      filtrosAplicados.data_inicio ||
      filtrosAplicados.data_fim,
  ),
)

const resumo = computed(() => resumirOcorrencias(itens.value))
const porMunicipio = computed(() => agruparPorMunicipio(itens.value))
const topMunicipios = computed(() => porMunicipio.value.slice(0, 10))
const mensal = computed(() => agruparMensal(itens.value))
const periodoAnalisado = computed(() =>
  descreverPeriodo(resumo.value.dataMinima, resumo.value.dataMaxima),
)

const tituloVazio = computed(() =>
  temFiltrosAtivos.value
    ? 'Nenhuma ocorrência no período'
    : 'Nenhuma ocorrência cadastrada',
)

const descricaoVazio = computed(() =>
  temFiltrosAtivos.value
    ? 'Não há registros para os filtros selecionados. Ajuste o recorte ou limpe os filtros para consultar todos os dados.'
    : 'Cadastre ocorrências para gerar os relatórios consolidados.',
)

const dadosMensais = computed(() => ({
  labels: mensal.value.labels,
  datasets: [
    {
      label: 'Queimadas',
      data: mensal.value.queimadas,
      backgroundColor: corTipo('queimada'),
      borderRadius: 4,
      maxBarThickness: 28,
      stack: 'total',
    },
    {
      label: 'Desmatamentos',
      data: mensal.value.desmatamentos,
      backgroundColor: corTipo('desmatamento'),
      borderRadius: 4,
      maxBarThickness: 28,
      stack: 'total',
    },
  ],
}))

const opcoesMensais = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'index', intersect: false },
  plugins: {
    legend: {
      position: 'bottom',
      labels: {
        usePointStyle: true,
        pointStyle: 'circle',
        padding: 16,
        color: '#1F2937',
      },
    },
    tooltip: {
      callbacks: {
        label: (contexto) =>
          `${contexto.dataset.label}: ${formatarNumero(
            contexto.parsed.y,
          )}`,
      },
    },
  },
  scales: {
    x: {
      stacked: true,
      grid: { display: false },
      ticks: {
        color: '#6B7280',
        maxRotation: 0,
        autoSkip: true,
        maxTicksLimit: 12,
      },
    },
    y: {
      stacked: true,
      beginAtZero: true,
      ticks: { precision: 0, color: '#6B7280' },
      grid: { color: 'rgba(20, 83, 45, 0.08)' },
    },
  },
}

const dadosMunicipios = computed(() => ({
  labels: topMunicipios.value.map(
    (linha) =>
      `${linha.municipio}${linha.estado ? `/${linha.estado}` : ''}`,
  ),
  datasets: [
    {
      label: 'Queimadas',
      data: topMunicipios.value.map((linha) => linha.queimadas),
      backgroundColor: corTipo('queimada'),
      borderRadius: 4,
      stack: 'total',
    },
    {
      label: 'Desmatamentos',
      data: topMunicipios.value.map((linha) => linha.desmatamentos),
      backgroundColor: corTipo('desmatamento'),
      borderRadius: 4,
      stack: 'total',
    },
  ],
}))

const opcoesMunicipios = {
  indexAxis: 'y',
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'index', intersect: false },
  plugins: {
    legend: {
      position: 'bottom',
      labels: {
        usePointStyle: true,
        pointStyle: 'circle',
        padding: 12,
        color: '#1F2937',
      },
    },
    tooltip: {
      callbacks: {
        label: (contexto) =>
          `${contexto.dataset.label}: ${formatarNumero(
            contexto.parsed.x,
          )}`,
      },
    },
  },
  scales: {
    x: {
      stacked: true,
      beginAtZero: true,
      ticks: { precision: 0, color: '#6B7280' },
      grid: { color: 'rgba(20, 83, 45, 0.08)' },
    },
    y: {
      stacked: true,
      grid: { display: false },
      ticks: { color: '#1F2937', autoSkip: false },
    },
  },
}

function parametrosListagem() {
  return {
    tipo: filtrosAplicados.tipo || undefined,
    municipio: filtrosAplicados.municipio || undefined,
    data_inicio: filtrosAplicados.data_inicio || undefined,
    data_fim: filtrosAplicados.data_fim || undefined,
  }
}

function atualizarMunicipios(ocorrencias) {
  const nomes = new Set(municipios.value)

  for (const item of ocorrencias) {
    if (item?.municipio) nomes.add(item.municipio)
  }

  municipios.value = [...nomes].sort((a, b) =>
    a.localeCompare(b, 'pt-BR'),
  )
}

async function carregar() {
  const requisicao = ++sequenciaRequisicao

  carregando.value = true
  erro.value = ''
  aviso.value = ''

  try {
    const resultado = await listarTodasOcorrencias(
      parametrosListagem(),
    )

    if (requisicao !== sequenciaRequisicao) return

    itens.value = resultado.items || []
    atualizarMunicipios(itens.value)
  } catch (error) {
    if (requisicao !== sequenciaRequisicao) return

    itens.value = []
    erro.value =
      error?.message || 'Não foi possível carregar os relatórios.'
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

    atualizarMunicipios(
      nomes.map((municipio) => ({ municipio })),
    )
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

function baixarCsv(nomeArquivo, conteudo) {
  const blob = new Blob([conteudo], {
    type: 'text/csv;charset=utf-8;',
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = nomeArquivo
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function exportarOcorrencias() {
  if (!itens.value.length) return

  baixarCsv(
    `ecomonitor-ocorrencias-${hoje}.csv`,
    gerarCsv(linhasCsvOcorrencias(itens.value)),
  )
}

function exportarResumo() {
  if (!porMunicipio.value.length) return

  baixarCsv(
    `ecomonitor-resumo-municipios-${hoje}.csv`,
    gerarCsv(linhasCsvResumo(porMunicipio.value)),
  )
}

onMounted(() => {
  carregarMunicipios()
  carregar()
})
</script>

<template>
  <div>
    <div
      class="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-4"
    >
      <div>
        <h2 class="h3 fw-bold mb-1">Relatórios</h2>
        <p class="text-secondary mb-0">
          Análises consolidadas das ocorrências ambientais, com filtros e
          exportação em CSV.
        </p>
      </div>

      <div class="d-flex flex-wrap gap-2">
        <button
          type="button"
          class="btn btn-outline-primary"
          :disabled="carregando"
          @click="carregar"
        >
          <span
            v-if="carregando"
            class="spinner-border spinner-border-sm me-2"
            aria-hidden="true"
          ></span>
          <i
            v-else
            class="bi bi-arrow-clockwise me-2"
            aria-hidden="true"
          ></i>
          Atualizar
        </button>
        <button
          type="button"
          class="btn btn-primary"
          :disabled="carregando || !itens.length"
          @click="exportarOcorrencias"
        >
          <i class="bi bi-download me-2" aria-hidden="true"></i>
          Exportar CSV
        </button>
      </div>
    </div>

    <form
      class="card filter-card mb-3"
      @submit.prevent="aplicarFiltros"
    >
      <div class="card-body p-3 p-md-4">
        <div class="row g-3 align-items-end">
          <div class="col-sm-6 col-lg-3">
            <label class="form-label" for="relatorio-tipo">
              Tipo
            </label>
            <select
              id="relatorio-tipo"
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
            <label class="form-label" for="relatorio-municipio">
              Município
            </label>
            <select
              id="relatorio-municipio"
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
            <label class="form-label" for="relatorio-data-inicio">
              Data inicial
            </label>
            <input
              id="relatorio-data-inicio"
              v-model="filtros.data_inicio"
              type="date"
              class="form-control"
              :max="hoje"
            />
          </div>

          <div class="col-6 col-lg-2">
            <label class="form-label" for="relatorio-data-fim">
              Data final
            </label>
            <input
              id="relatorio-data-fim"
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

    <div
      v-if="erro"
      class="alert alert-danger d-flex flex-wrap align-items-center gap-2"
      role="alert"
    >
      <i class="bi bi-wifi-off" aria-hidden="true"></i>
      <span class="flex-grow-1">{{ erro }}</span>
      <button
        type="button"
        class="btn btn-sm btn-outline-danger"
        @click="carregar"
      >
        Tentar novamente
      </button>
    </div>

    <div v-if="carregando" class="card">
      <div class="card-body text-center py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">
            Carregando relatórios...
          </span>
        </div>
        <p class="text-secondary mt-3 mb-0">
          Consultando as ocorrências na API...
        </p>
      </div>
    </div>

    <div v-else-if="!itens.length" class="card">
      <div class="card-body">
        <EmptyState
          :titulo="tituloVazio"
          :descricao="descricaoVazio"
          icone="bi-file-earmark-bar-graph"
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
            <i class="bi bi-plus-circle me-2" aria-hidden="true"></i>
            Cadastrar ocorrência
          </RouterLink>
        </EmptyState>
      </div>
    </div>

    <template v-else>
      <div class="row g-3 mb-3">
        <div class="col-12 col-sm-6 col-xl-3">
          <KpiCard
            titulo="Total de ocorrências"
            :valor="resumo.total"
            icone="bi-clipboard2-data"
            cor="#15803D"
            descricao="No recorte selecionado"
          />
        </div>
        <div class="col-12 col-sm-6 col-xl-3">
          <KpiCard
            titulo="Queimadas"
            :valor="resumo.queimadas"
            icone="bi-fire"
            cor="#EA580C"
            descricao="Registros de queimada"
          />
        </div>
        <div class="col-12 col-sm-6 col-xl-3">
          <KpiCard
            titulo="Desmatamentos"
            :valor="resumo.desmatamentos"
            icone="bi-tree"
            cor="#166534"
            descricao="Registros de desmatamento"
          />
        </div>
        <div class="col-12 col-sm-6 col-xl-3">
          <KpiCard
            titulo="Municípios atingidos"
            :valor="resumo.municipios"
            icone="bi-geo-alt"
            cor="#0F766E"
            descricao="Com ocorrências no recorte"
          />
        </div>
      </div>

      <div
        class="report-period d-flex flex-wrap align-items-center gap-2 px-3 py-2 mb-3"
        role="status"
      >
        <i class="bi bi-calendar-range" aria-hidden="true"></i>
        <span>
          Período analisado:
          <strong>{{ periodoAnalisado }}</strong>
        </span>
        <span class="text-secondary ms-auto small">
          {{ formatarNumero(resumo.total) }}
          {{ resumo.total === 1 ? 'ocorrência' : 'ocorrências' }}
          no recorte
        </span>
      </div>

      <div class="row g-3 mb-3">
        <div class="col-12 col-xl-7">
          <div class="card chart-card h-100">
            <div class="card-header">
              <h3 class="h6 mb-0">Evolução mensal</h3>
              <p class="text-secondary small mb-0 mt-1">
                Ocorrências agrupadas pelo mês da data do registro.
              </p>
            </div>
            <div class="card-body">
              <div v-if="mensal.labels.length" class="chart-box">
                <Bar
                  :data="dadosMensais"
                  :options="opcoesMensais"
                />
              </div>
              <p v-else class="text-secondary text-center py-4 mb-0">
                Não há datas válidas para montar a evolução mensal.
              </p>
            </div>
          </div>
        </div>

        <div class="col-12 col-xl-5">
          <div class="card chart-card h-100">
            <div class="card-header">
              <h3 class="h6 mb-0">Municípios com mais ocorrências</h3>
              <p class="text-secondary small mb-0 mt-1">
                Os 10 municípios com maior total no recorte.
              </p>
            </div>
            <div class="card-body">
              <div
                v-if="topMunicipios.length"
                class="chart-box"
              >
                <Bar
                  :data="dadosMunicipios"
                  :options="opcoesMunicipios"
                />
              </div>
              <p v-else class="text-secondary text-center py-4 mb-0">
                Não há dados para comparar municípios.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div class="card">
        <div
          class="card-header d-flex flex-wrap justify-content-between align-items-start gap-2"
        >
          <div>
            <h3 class="h6 mb-0">Resumo por município</h3>
            <p class="text-secondary small mb-0 mt-1">
              Totais por tipo e participação no recorte selecionado.
            </p>
          </div>
          <button
            type="button"
            class="btn btn-sm btn-outline-secondary"
            :disabled="!porMunicipio.length"
            @click="exportarResumo"
          >
            <i class="bi bi-filetype-csv me-1" aria-hidden="true"></i>
            Exportar resumo
          </button>
        </div>

        <div class="table-responsive report-table-wrap">
          <table class="table table-hover align-middle">
            <thead>
              <tr>
                <th scope="col">Município</th>
                <th scope="col">UF</th>
                <th scope="col" class="text-end">Queimadas</th>
                <th scope="col" class="text-end">
                  Desmatamentos
                </th>
                <th scope="col" class="text-end">Total</th>
                <th scope="col" class="text-end">Participação</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="linha in porMunicipio"
                :key="`${linha.municipio}-${linha.estado}`"
              >
                <td class="fw-semibold">{{ linha.municipio }}</td>
                <td>
                  <span class="badge text-bg-light border">
                    {{ linha.estado || '—' }}
                  </span>
                </td>
                <td class="text-end">
                  {{ formatarNumero(linha.queimadas) }}
                </td>
                <td class="text-end">
                  {{ formatarNumero(linha.desmatamentos) }}
                </td>
                <td class="text-end fw-bold">
                  {{ formatarNumero(linha.total) }}
                </td>
                <td class="text-end">
                  <div
                    class="d-inline-flex align-items-center gap-2"
                  >
                    <div
                      class="progress report-progress"
                      role="progressbar"
                      :aria-valuenow="linha.percentual"
                      aria-valuemin="0"
                      aria-valuemax="100"
                      :aria-label="`Participação de ${linha.municipio}`"
                    >
                      <div
                        class="progress-bar"
                        :style="{
                          width: `${linha.percentual}%`,
                          backgroundColor: '#15803D',
                        }"
                      ></div>
                    </div>
                    <span class="small text-secondary report-percentual">
                      {{ formatarPercentual(linha.percentual) }}
                    </span>
                  </div>
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr class="fw-bold">
                <td>Total</td>
                <td></td>
                <td class="text-end">
                  {{ formatarNumero(resumo.queimadas) }}
                </td>
                <td class="text-end">
                  {{ formatarNumero(resumo.desmatamentos) }}
                </td>
                <td class="text-end">
                  {{ formatarNumero(resumo.total) }}
                </td>
                <td class="text-end">100,0%</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </template>
  </div>
</template>
