<script setup>
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'

import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip,
} from 'chart.js'
import { Bar } from 'vue-chartjs'
import {
  ArrowRight,
  ArrowUpRight,
  Info,
  Plus,
  RefreshCw,
  WifiOff,
} from 'lucide-vue-next'

import EmptyState from '@/components/EmptyState.vue'
import KpiCard from '@/components/KpiCard.vue'
import MiniMapa from '@/components/MiniMapa.vue'
import PageHeader from '@/components/PageHeader.vue'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import SeverityBadge from '@/components/SeverityBadge.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import TipoBadge from '@/components/TipoBadge.vue'
import { listarTodasOcorrencias } from '@/services/ocorrencias'
import { useAppStore } from '@/stores/app'
import { useAuthStore } from '@/stores/auth'
import { useDemoStore } from '@/stores/demo'
import {
  calcularIndicadores,
  compararComMesAnterior,
  distribuirPorEstado,
  mesMaisRepresentativo,
} from '@/utils/demo'
import {
  corTipo,
  formatarData,
  formatarMesLongo,
  formatarNumero,
  formatarPercentual,
} from '@/utils/format'
import { agruparMensal } from '@/utils/reports'
import { dentroDoBrasil } from '@/utils/map'

ChartJS.register(
  BarElement,
  CategoryScale,
  Legend,
  LinearScale,
  Tooltip,
)

const auth = useAuthStore()
const router = useRouter()
const demo = useDemoStore()
const app = useAppStore()

const itens = ref([])
const carregando = ref(true)
const erro = ref('')

const enriquecidos = computed(() =>
  demo.enriquecerLista(
    itens.value,
    auth.nomeUsuario || 'Equipe de monitoramento',
  ),
)

const indicadores = computed(() => calcularIndicadores(enriquecidos.value))

const mesReferencia = computed(() =>
  mesMaisRepresentativo(enriquecidos.value),
)

const comparacao = computed(() =>
  compararComMesAnterior(enriquecidos.value, mesReferencia.value),
)

const estadosTop = computed(() => distribuirPorEstado(enriquecidos.value))

const recentes = computed(() =>
  [...enriquecidos.value]
    .sort((a, b) => {
      const dataA = String(a.data_ocorrencia || '')
      const dataB = String(b.data_ocorrencia || '')
      return dataB.localeCompare(dataA) || b.id - a.id
    })
    .slice(0, 6),
)

const pontosMapa = computed(() =>
  enriquecidos.value.filter(
    (item) =>
      item.latitude !== null &&
      item.latitude !== undefined &&
      item.longitude !== null &&
      item.longitude !== undefined &&
      dentroDoBrasil(item.latitude, item.longitude),
  ),
)

const mensal = computed(() => agruparMensal(itens.value))

const dadosMensais = computed(() => ({
  labels: mensal.value.labels,
  datasets: [
    {
      label: 'Queimadas',
      data: mensal.value.queimadas,
      backgroundColor: corTipo('queimada'),
      borderRadius: 3,
      maxBarThickness: 22,
    },
    {
      label: 'Desmatamentos',
      data: mensal.value.desmatamentos,
      backgroundColor: corTipo('desmatamento'),
      borderRadius: 3,
      maxBarThickness: 22,
    },
  ],
}))

const opcoesMensais = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'index', intersect: false },
  plugins: {
    legend: { position: 'bottom' },
    tooltip: {
      callbacks: {
        label: (contexto) =>
          `${contexto.dataset.label}: ${formatarNumero(contexto.parsed.y)}`,
      },
    },
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { maxRotation: 0, autoSkip: true, maxTicksLimit: 12 },
    },
    y: {
      beginAtZero: true,
      ticks: { precision: 0 },
      grid: { color: 'rgba(38, 58, 48, 0.5)' },
    },
  },
}

const textoComparacao = computed(() => {
  const valor = comparacao.value
  if (!valor) return 'Sem base de comparação no mês anterior.'

  const sinal = valor.variacao >= 0 ? '+' : ''
  return `${sinal}${formatarPercentual(valor.variacao)} em relação a ${
    formatarMesLongo(valor.mesAnterior)
  }`
})

const descricaoMes = computed(() =>
  mesReferencia.value
    ? `Mês com mais registros: ${formatarMesLongo(mesReferencia.value)}.`
    : 'Distribuição mensal das ocorrências carregadas.',
)

const ultimaAtualizacao = computed(() =>
  app.ultimaAtualizacao
    ? new Intl.DateTimeFormat('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      }).format(app.ultimaAtualizacao)
    : '',
)

async function carregar() {
  carregando.value = true
  erro.value = ''

  try {
    const resultado = await listarTodasOcorrencias()
    itens.value = resultado.items || []
    app.marcarAtualizacao(new Date())
  } catch (error) {
    itens.value = []
    erro.value =
      error?.message || 'Não foi possível carregar os indicadores.'
  } finally {
    carregando.value = false
  }
}

onMounted(carregar)
</script>

<template>
  <div>
    <PageHeader
      eyebrow="Monitoramento ambiental"
      titulo="Visão geral"
      descricao="Panorama consolidado das ocorrências de queimadas e desmatamento registradas no EcoMonitor."
    >
      <template #acoes>
        <Button
          type="button"
          variant="outline"
          :disabled="carregando"
          @click="carregar"
        >
          <RefreshCw :size="15" :class="{ 'animate-spin': carregando }" aria-hidden="true" />
          Atualizar
        </Button>
        <Button @click="router.push({ name: 'nova-ocorrencia' })">
          <Plus :size="15" aria-hidden="true" />
          Nova ocorrência
        </Button>
      </template>
    </PageHeader>

    <div v-if="erro" class="alert alert-danger d-flex flex-wrap align-items-center gap-2" role="alert">
      <WifiOff :size="16" aria-hidden="true" />
      <span class="flex-grow-1">{{ erro }}</span>
      <Button type="button" variant="outline" size="sm" @click="carregar">
        Tentar novamente
      </Button>
    </div>

    <div v-if="carregando" class="kpi-grid" aria-hidden="true">
      <div v-for="indice in 4" :key="indice" class="kpi-card">
        <div class="skeleton skeleton-linha" style="width: 55%"></div>
        <div class="skeleton skeleton-bloco mt-3" style="height: 40px"></div>
      </div>
    </div>

    <template v-else-if="indicadores.total">
      <div class="kpi-grid">
        <KpiCard
          titulo="Ocorrências monitoradas"
          :valor="formatarNumero(indicadores.total)"
          :descricao="`${formatarNumero(indicadores.estados)} estados · ${formatarNumero(indicadores.municipios)} municípios`"
          destaque="acento"
        />
        <KpiCard
          titulo="Queimadas"
          :valor="formatarNumero(indicadores.queimadas)"
          :descricao="`${formatarPercentual(indicadores.percentualQueimadas)} do total registrado`"
        />
        <KpiCard
          titulo="Desmatamentos"
          :valor="formatarNumero(indicadores.desmatamentos)"
          :descricao="`${formatarPercentual(indicadores.percentualDesmatamentos)} do total registrado`"
        />
        <KpiCard
          titulo="Em análise"
          :valor="formatarNumero(indicadores.emAnalise)"
          :descricao="`${formatarPercentual(indicadores.percentualEmAnalise)} aguardando validação técnica`"
        />
      </div>

      <div class="dashboard-grid">
        <Card class="panel dashboard-card">
          <div class="panel-header">
            <div>
              <h2 class="panel-title">Evolução mensal</h2>
              <p class="panel-subtitle">
                Queimadas e desmatamentos por mês da ocorrência.
              </p>
            </div>
            <span class="texto-3 small">{{ descricaoMes }}</span>
          </div>

          <div class="panel-body">
            <div v-if="mensal.labels.length" class="chart-box">
              <Bar :data="dadosMensais" :options="opcoesMensais" />
            </div>
            <p v-else class="chart-empty">
              Não há datas válidas para montar a evolução mensal.
            </p>

            <div class="panel-footnote">
              <span class="status-dot status-online" aria-hidden="true"></span>
              {{ textoComparacao }}
            </div>
          </div>
        </Card>

        <Card class="panel dashboard-card">
          <div class="panel-header">
            <div>
              <h2 class="panel-title">Cobertura geográfica</h2>
              <p class="panel-subtitle">
                Distribuição das ocorrências no território.
              </p>
            </div>
            <RouterLink class="panel-link" :to="{ name: 'mapa' }">
              Abrir mapa
              <ArrowUpRight :size="14" aria-hidden="true" />
            </RouterLink>
          </div>

          <div class="panel-body pt-3">
            <MiniMapa
              :pontos="pontosMapa"
              altura="250px"
              :interativo="false"
              mostrar-legenda
              rotulo="Mapa das ocorrências monitoradas"
            />

            <dl class="contexto-dados mt-3 mb-0">
              <div>
                <dt>Área estimada</dt>
                <dd>{{ formatarNumero(indicadores.areaTotal) }} ha</dd>
              </div>
              <div>
                <dt>Ocorrências críticas</dt>
                <dd>{{ formatarNumero(indicadores.criticas) }}</dd>
              </div>
            </dl>
          </div>
        </Card>
      </div>

      <div class="dashboard-grid">
        <Card class="panel dashboard-card">
          <div class="panel-header">
            <div>
              <h2 class="panel-title">Ocorrências recentes</h2>
              <p class="panel-subtitle">
                Últimos registros considerando a data da ocorrência.
              </p>
            </div>
            <RouterLink class="panel-link" :to="{ name: 'ocorrencias' }">
              Ver todas
              <ArrowRight :size="14" aria-hidden="true" />
            </RouterLink>
          </div>

          <div class="table-responsive">
            <table class="table table-hover align-middle">
              <thead>
                <tr>
                  <th scope="col">Código</th>
                  <th scope="col">Tipo</th>
                  <th scope="col">Local</th>
                  <th scope="col">Data</th>
                  <th scope="col">Severidade</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in recentes" :key="item.id">
                  <td>
                    <RouterLink
                      class="codigo-link"
                      :to="{ name: 'ocorrencia-detalhe', params: { id: item.id } }"
                    >
                      {{ item.codigo }}
                    </RouterLink>
                  </td>
                  <td><TipoBadge :tipo="item.tipo" /></td>
                  <td>
                    <span class="celula-principal">{{ item.municipio }}</span>
                    <span class="celula-secundaria">{{ item.estado }}</span>
                  </td>
                  <td class="text-nowrap">
                    {{ formatarData(item.data_ocorrencia) }}
                  </td>
                  <td><SeverityBadge :severidade="item.severidade" /></td>
                  <td><StatusBadge :status="item.status" /></td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>

        <Card class="panel dashboard-card">
          <div class="panel-header">
            <div>
              <h2 class="panel-title">Estados com mais registros</h2>
              <p class="panel-subtitle">
                Participação no total de ocorrências.
              </p>
            </div>
          </div>

          <div class="panel-body">
            <ul class="rank-list">
              <li
                v-for="estado in estadosTop.slice(0, 6)"
                :key="estado.estado"
                class="rank-item"
              >
                <div class="rank-linha">
                  <span class="rank-rotulo">{{ estado.estado }}</span>
                  <span class="rank-valor">
                    {{ formatarNumero(estado.ocorrencias) }}
                  </span>
                </div>
                <div class="rank-barra" aria-hidden="true">
                  <span :style="{ width: `${estado.percentual}%` }"></span>
                </div>
                <p class="rank-meta">
                  {{ formatarPercentual(estado.percentual) }} ·
                  {{ formatarNumero(estado.area) }} ha
                </p>
              </li>
            </ul>
          </div>
        </Card>
      </div>

      <p class="texto-3 small mb-0">
        <Info :size="14" class="me-1" aria-hidden="true" />
        Indicadores calculados a partir da API. Severidade, status e área são
        metadados demonstrativos.
      </p>
    </template>

    <Card v-else class="panel dashboard-card">
      <div class="panel-body">
        <EmptyState
          titulo="Nenhuma ocorrência cadastrada"
          descricao="Cadastre a primeira ocorrência para acompanhar os indicadores ambientais."
          icone="bi-clipboard-plus"
        >
          <Button @click="router.push({ name: 'nova-ocorrencia' })">
            <Plus :size="15" aria-hidden="true" />
            Cadastrar primeira ocorrência
          </Button>
        </EmptyState>
      </div>
    </Card>
  </div>
</template>
