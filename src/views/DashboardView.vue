<script setup>
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'

import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
} from 'chart.js'
import { Bar, Doughnut, Line } from 'vue-chartjs'

import EmptyState from '@/components/EmptyState.vue'
import KpiCard from '@/components/KpiCard.vue'
import { listarTodasOcorrencias } from '@/services/ocorrencias'
import { obterEstatisticas } from '@/services/stats'
import {
  corTipo,
  formatarMes,
  formatarNumero,
  rotuloTipo,
} from '@/utils/format'

ChartJS.register(
  ArcElement,
  BarElement,
  CategoryScale,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
)

const route = useRoute()
const router = useRouter()

const carregando = ref(true)
const erro = ref('')
const stats = ref(null)

const carregandoEvolucao = ref(false)
const erroEvolucao = ref('')
const evolucao = ref({ labels: [], valores: [] })

const bemvindo = ref(route.query.bemvindo === '1')

const totalMunicipios = computed(
  () => stats.value?.por_municipio?.length || 0,
)

const semDados = computed(
  () => !stats.value || stats.value.total_ocorrencias === 0,
)

const municipiosTop = computed(() =>
  (stats.value?.por_municipio || []).slice(0, 10),
)

const dadosRosca = computed(() => {
  const porTipo = stats.value?.por_tipo || []

  return {
    labels: porTipo.map((item) => rotuloTipo(item.tipo)),
    datasets: [
      {
        data: porTipo.map((item) => item.total),
        backgroundColor: porTipo.map((item) => corTipo(item.tipo)),
        borderColor: '#FFFFFF',
        borderWidth: 3,
        hoverOffset: 6,
      },
    ],
  }
})

const opcoesRosca = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: '68%',
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
          `${contexto.label}: ${formatarNumero(contexto.parsed)}`,
      },
    },
  },
}

const dadosMunicipios = computed(() => ({
  labels: municipiosTop.value.map((item) => item.municipio),
  datasets: [
    {
      label: 'Ocorrências',
      data: municipiosTop.value.map((item) => item.total),
      backgroundColor: 'rgba(21, 128, 61, 0.75)',
      hoverBackgroundColor: '#15803D',
      borderRadius: 6,
      barThickness: 18,
    },
  ],
}))

const opcoesMunicipios = {
  indexAxis: 'y',
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (contexto) =>
          `${formatarNumero(contexto.parsed.x)} ocorrências`,
      },
    },
  },
  scales: {
    x: {
      beginAtZero: true,
      ticks: { precision: 0, color: '#6B7280' },
      grid: { color: 'rgba(20, 83, 45, 0.08)' },
    },
    y: {
      ticks: { color: '#1F2937' },
      grid: { display: false },
    },
  },
}

const dadosEvolucao = computed(() => ({
  labels: evolucao.value.labels,
  datasets: [
    {
      label: 'Ocorrências',
      data: evolucao.value.valores,
      borderColor: '#15803D',
      backgroundColor: 'rgba(21, 128, 61, 0.12)',
      pointBackgroundColor: '#15803D',
      pointBorderColor: '#FFFFFF',
      pointBorderWidth: 2,
      pointRadius: 3,
      tension: 0.35,
      fill: true,
    },
  ],
}))

const opcoesEvolucao = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (contexto) =>
          `${formatarNumero(contexto.parsed.y)} ocorrências`,
      },
    },
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: {
        color: '#6B7280',
        maxRotation: 0,
        autoSkip: true,
        maxTicksLimit: 12,
      },
    },
    y: {
      beginAtZero: true,
      ticks: { precision: 0, color: '#6B7280' },
      grid: { color: 'rgba(20, 83, 45, 0.08)' },
    },
  },
}

function agruparPorMes(itens) {
  const contagem = new Map()

  for (const item of itens) {
    const chave = String(item.data_ocorrencia || '').slice(0, 7)
    if (!/^\d{4}-\d{2}$/.test(chave)) continue
    contagem.set(chave, (contagem.get(chave) || 0) + 1)
  }

  const chaves = [...contagem.keys()].sort()
  if (!chaves.length) return { labels: [], valores: [] }

  const [anoInicial, mesInicial] = chaves[0].split('-').map(Number)
  const [anoFinal, mesFinal] = chaves[chaves.length - 1]
    .split('-')
    .map(Number)

  const labels = []
  const valores = []

  let ano = anoInicial
  let mes = mesInicial

  while (ano < anoFinal || (ano === anoFinal && mes <= mesFinal)) {
    const chave = `${ano}-${String(mes).padStart(2, '0')}`
    labels.push(formatarMes(chave))
    valores.push(contagem.get(chave) || 0)

    mes += 1
    if (mes > 12) {
      mes = 1
      ano += 1
    }
  }

  return { labels, valores }
}

async function carregarEvolucao() {
  carregandoEvolucao.value = true
  erroEvolucao.value = ''
  evolucao.value = { labels: [], valores: [] }

  try {
    const resultado = await listarTodasOcorrencias()
    evolucao.value = agruparPorMes(resultado.items || [])
  } catch (error) {
    erroEvolucao.value =
      error?.message ||
      'Não foi possível carregar a evolução mensal.'
  } finally {
    carregandoEvolucao.value = false
  }
}

async function carregar() {
  carregando.value = true
  erro.value = ''

  try {
    stats.value = await obterEstatisticas()
  } catch (error) {
    erro.value =
      error?.message || 'Não foi possível carregar os indicadores.'
    carregando.value = false
    return
  }

  carregando.value = false

  if (stats.value.total_ocorrencias > 0) {
    await carregarEvolucao()
  }
}

onMounted(() => {
  if (bemvindo.value) {
    router.replace({ name: 'dashboard' })
  }

  carregar()
})
</script>

<template>
  <div>
    <div
      class="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-4"
    >
      <div>
        <h2 class="h3 fw-bold mb-1">Dashboard</h2>
        <p class="text-secondary mb-0">
          Indicadores globais calculados pela API do EcoMonitor.
        </p>
      </div>

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
        <i v-else class="bi bi-arrow-clockwise me-2" aria-hidden="true"></i>
        Atualizar
      </button>
    </div>

    <div
      v-if="bemvindo"
      class="alert alert-success alert-dismissible fade show"
      role="alert"
    >
      <i class="bi bi-check-circle me-2" aria-hidden="true"></i>
      Conta criada com sucesso. Bem-vindo(a) ao EcoMonitor!
      <button
        type="button"
        class="btn-close"
        aria-label="Fechar"
        @click="bemvindo = false"
      ></button>
    </div>

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
          <span class="visually-hidden">Carregando indicadores...</span>
        </div>
        <p class="text-secondary mt-3 mb-0">
          Carregando indicadores...
        </p>
      </div>
    </div>

    <template v-else-if="stats">
      <div class="row g-3 mb-4">
        <div class="col-12 col-sm-6 col-xl-3">
          <KpiCard
            titulo="Total de ocorrências"
            :valor="stats.total_ocorrencias"
            icone="bi-clipboard2-data"
            cor="#15803D"
            descricao="Indicadores globais"
          />
        </div>
        <div class="col-12 col-sm-6 col-xl-3">
          <KpiCard
            titulo="Queimadas"
            :valor="stats.total_queimadas"
            icone="bi-fire"
            cor="#EA580C"
            descricao="Registros de queimada"
          />
        </div>
        <div class="col-12 col-sm-6 col-xl-3">
          <KpiCard
            titulo="Desmatamentos"
            :valor="stats.total_desmatamentos"
            icone="bi-tree"
            cor="#166534"
            descricao="Registros de desmatamento"
          />
        </div>
        <div class="col-12 col-sm-6 col-xl-3">
          <KpiCard
            titulo="Municípios monitorados"
            :valor="totalMunicipios"
            icone="bi-geo-alt"
            cor="#0F766E"
            descricao="Com ocorrências registradas"
          />
        </div>
      </div>

      <div v-if="semDados" class="card">
        <div class="card-body">
          <EmptyState
            titulo="Nenhuma ocorrência cadastrada"
            descricao="O banco ainda está vazio. Cadastre a primeira ocorrência para começar a acompanhar os indicadores."
            icone="bi-clipboard-plus"
          >
            <RouterLink
              class="btn btn-primary"
              :to="{ name: 'nova-ocorrencia' }"
            >
              <i class="bi bi-plus-circle me-2" aria-hidden="true"></i>
              Cadastrar primeira ocorrência
            </RouterLink>
          </EmptyState>
        </div>
      </div>

      <template v-else>
        <div class="row g-3 mb-3">
          <div class="col-12 col-lg-5">
            <div class="card chart-card h-100">
              <div class="card-header">
                <h3 class="h6 mb-0">Ocorrências por tipo</h3>
                <p class="text-secondary small mb-0 mt-1">
                  Distribuição entre queimadas e desmatamentos.
                </p>
              </div>
              <div class="card-body">
                <div class="chart-box">
                  <Doughnut :data="dadosRosca" :options="opcoesRosca" />
                </div>
              </div>
            </div>
          </div>

          <div class="col-12 col-lg-7">
            <div class="card chart-card h-100">
              <div class="card-header">
                <h3 class="h6 mb-0">Municípios com mais ocorrências</h3>
                <p class="text-secondary small mb-0 mt-1">
                  Os 10 municípios com maior número de registros.
                </p>
              </div>
              <div class="card-body">
                <div class="chart-box">
                  <Bar
                    :data="dadosMunicipios"
                    :options="opcoesMunicipios"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="card chart-card">
          <div class="card-header d-flex flex-wrap justify-content-between align-items-start gap-2">
            <div>
              <h3 class="h6 mb-0">Evolução mensal</h3>
              <p class="text-secondary small mb-0 mt-1">
                Quantidade de ocorrências agrupadas por mês da ocorrência.
              </p>
            </div>
            <button
              type="button"
              class="btn btn-sm btn-outline-secondary"
              :disabled="carregandoEvolucao"
              @click="carregarEvolucao"
            >
              <i class="bi bi-arrow-clockwise me-1" aria-hidden="true"></i>
              Recarregar
            </button>
          </div>
          <div class="card-body">
            <div
              v-if="erroEvolucao"
              class="alert alert-warning d-flex flex-wrap align-items-center gap-2 mb-0"
              role="alert"
            >
              <i class="bi bi-exclamation-triangle" aria-hidden="true"></i>
              <span class="flex-grow-1">{{ erroEvolucao }}</span>
              <button
                type="button"
                class="btn btn-sm btn-outline-secondary"
                @click="carregarEvolucao"
              >
                Tentar novamente
              </button>
            </div>

            <div
              v-else-if="carregandoEvolucao"
              class="chart-box d-flex align-items-center justify-content-center"
            >
              <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">
                  Carregando evolução mensal...
                </span>
              </div>
            </div>

            <div
              v-else-if="evolucao.labels.length"
              class="chart-box"
            >
              <Line :data="dadosEvolucao" :options="opcoesEvolucao" />
            </div>

            <p v-else class="text-secondary text-center py-4 mb-0">
              Não há dados suficientes para montar a evolução mensal.
            </p>
          </div>
        </div>
      </template>
    </template>
  </div>
</template>
