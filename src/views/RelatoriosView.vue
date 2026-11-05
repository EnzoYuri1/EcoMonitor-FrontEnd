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
import PageHeader from '@/components/PageHeader.vue'
import { listarTodasOcorrencias } from '@/services/ocorrencias'
import { useAuthStore } from '@/stores/auth'
import { useDemoStore } from '@/stores/demo'
import { TIPOS, UFS } from '@/utils/constants'
import {
  calcularIndicadores,
  distribuirPorEstado,
  distribuirPorTipo,
  mesesDisponiveis,
  periodoDoMes,
} from '@/utils/demo'
import {
  corTipo,
  dataHojeISO,
  formatarAreaComUnidade,
  formatarData,
  formatarDataHora,
  formatarMesCurto,
  formatarMesLongo,
  formatarNumero,
} from '@/utils/format'
import {
  agruparMensal,
  descreverPeriodo,
  formatarPercentual,
  gerarCsv,
  linhasCsvOcorrencias,
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
const auth = useAuthStore()
const demo = useDemoStore()

const filtros = reactive({
  tipo: '',
  estado: '',
  data_inicio: '',
  data_fim: '',
})

const aplicados = reactive({ ...filtros })

const todos = ref([])
const carregando = ref(true)
const erro = ref('')
const aviso = ref('')

const enriquecidos = computed(() =>
  demo.enriquecerLista(
    todos.value,
    auth.nomeUsuario || 'Equipe de monitoramento',
  ),
)

const filtrados = computed(() =>
  filtrarPorRecorte(enriquecidos.value, aplicados),
)

const resumo = computed(() => resumirOcorrencias(filtrados.value))
const indicadores = computed(() => calcularIndicadores(filtrados.value))
const mensal = computed(() => agruparMensal(filtrados.value))
const porEstado = computed(() => distribuirPorEstado(filtrados.value))
const porTipo = computed(() => distribuirPorTipo(filtrados.value))

const periodoAnalisado = computed(() =>
  descreverPeriodo(resumo.value.dataMinima, resumo.value.dataMaxima),
)

const mesSelecionado = computed(() =>
  aplicados.data_inicio &&
  aplicados.data_fim &&
  aplicados.data_inicio.slice(0, 7) === aplicados.data_fim.slice(0, 7)
    ? aplicados.data_inicio.slice(0, 7)
    : '',
)

const tituloRelatorio = computed(() =>
  mesSelecionado.value
    ? `Relatório mensal — ${formatarMesLongo(mesSelecionado.value)}`
    : 'Relatório consolidado de ocorrências',
)

const subtituloRelatorio = computed(() => {
  const total = `${formatarNumero(resumo.value.total)} ${
    resumo.value.total === 1 ? 'ocorrência' : 'ocorrências'
  }`

  return `${periodoAnalisado.value} · ${total}`
})

const recortes = computed(() => {
  const partes = []

  if (aplicados.tipo) {
    partes.push(
      TIPOS.find((tipo) => tipo.value === aplicados.tipo)?.label ||
        aplicados.tipo,
    )
  }

  if (aplicados.estado) partes.push(`UF ${aplicados.estado}`)

  return partes.length ? partes.join(' · ') : 'Todos os tipos e estados'
})

const temFiltrosAtivos = computed(() =>
  Boolean(
    aplicados.tipo ||
      aplicados.estado ||
      aplicados.data_inicio ||
      aplicados.data_fim,
  ),
)

const relatoriosSalvos = computed(() => mesesDisponiveis(todos.value))

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

const geradoEm = computed(() => formatarDataHora(new Date()))

function filtrarPorRecorte(itens, recorte) {
  return itens.filter((item) => {
    if (recorte.tipo && item.tipo !== recorte.tipo) return false
    if (recorte.estado && item.estado !== recorte.estado) return false

    const data = String(item.data_ocorrencia || '').slice(0, 10)
    if (recorte.data_inicio && data < recorte.data_inicio) return false
    if (recorte.data_fim && data > recorte.data_fim) return false

    return true
  })
}

async function carregar() {
  carregando.value = true
  erro.value = ''

  try {
    const resultado = await listarTodasOcorrencias()
    todos.value = resultado.items || []
  } catch (error) {
    todos.value = []
    erro.value =
      error?.message || 'Não foi possível carregar os relatórios.'
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
}

function limparFiltros() {
  Object.assign(filtros, {
    tipo: '',
    estado: '',
    data_inicio: '',
    data_fim: '',
  })
  Object.assign(aplicados, filtros)
  aviso.value = ''
}

function aplicarMes(mes) {
  const periodo = periodoDoMes(mes)

  Object.assign(filtros, {
    tipo: '',
    estado: '',
    data_inicio: periodo.inicio,
    data_fim: periodo.fim,
  })
  Object.assign(aplicados, filtros)
  aviso.value = ''
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
  if (!filtrados.value.length) return

  baixarCsv(
    `ecomonitor-ocorrencias-${hoje}.csv`,
    gerarCsv(linhasCsvOcorrencias(filtrados.value)),
  )
}

function exportarEstados() {
  if (!porEstado.value.length) return

  const linhas = [
    [
      'Estado',
      'Ocorrências',
      'Queimadas',
      'Desmatamentos',
      'Área estimada (ha)',
      'Participação (%)',
    ],
    ...porEstado.value.map((linha) => [
      linha.estado,
      linha.ocorrencias,
      linha.queimadas,
      linha.desmatamentos,
      linha.area,
      formatarPercentual(linha.percentual).replace('%', ''),
    ]),
  ]

  baixarCsv(
    `ecomonitor-resumo-estados-${hoje}.csv`,
    gerarCsv(linhas),
  )
}

function gerarPdf() {
  window.print()
}

onMounted(carregar)
</script>

<template>
  <div>
    <PageHeader
      eyebrow="Análise"
      titulo="Relatórios"
      descricao="Consolide as ocorrências por período, estado e tipo, exporte os dados e gere uma versão em PDF."
    >
      <template #acoes>
        <button
          type="button"
          class="btn btn-outline-secondary"
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
        <button
          type="button"
          class="btn btn-primary"
          :disabled="carregando || !resumo.total"
          @click="gerarPdf"
        >
          <i class="bi bi-printer me-2" aria-hidden="true"></i>
          Gerar PDF
        </button>
      </template>
    </PageHeader>

    <form class="filters-bar no-print" @submit.prevent="aplicarFiltros">
      <div class="filter-field">
        <label for="relatorio-tipo">Tipo</label>
        <select id="relatorio-tipo" v-model="filtros.tipo" class="form-select">
          <option value="">Todos</option>
          <option v-for="tipo in TIPOS" :key="tipo.value" :value="tipo.value">
            {{ tipo.label }}
          </option>
        </select>
      </div>

      <div class="filter-field">
        <label for="relatorio-estado">Estado</label>
        <select id="relatorio-estado" v-model="filtros.estado" class="form-select">
          <option value="">Todas as UF</option>
          <option v-for="uf in UFS" :key="uf" :value="uf">{{ uf }}</option>
        </select>
      </div>

      <div class="filter-field">
        <label for="relatorio-inicio">Data inicial</label>
        <input
          id="relatorio-inicio"
          v-model="filtros.data_inicio"
          type="date"
          class="form-control"
          :max="hoje"
        />
      </div>

      <div class="filter-field">
        <label for="relatorio-fim">Data final</label>
        <input
          id="relatorio-fim"
          v-model="filtros.data_fim"
          type="date"
          class="form-control"
          :max="hoje"
        />
      </div>

      <div class="filters-spacer"></div>

      <div class="d-flex gap-2">
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
        </button>
      </div>
    </form>

    <div v-if="aviso" class="alert alert-warning d-flex align-items-center gap-2 no-print" role="alert">
      <i class="bi bi-exclamation-triangle" aria-hidden="true"></i>
      {{ aviso }}
    </div>

    <div v-if="erro" class="alert alert-danger d-flex flex-wrap align-items-center gap-2 no-print" role="alert">
      <i class="bi bi-wifi-off" aria-hidden="true"></i>
      <span class="flex-grow-1">{{ erro }}</span>
      <button type="button" class="btn btn-sm btn-outline-danger" @click="carregar">
        Tentar novamente
      </button>
    </div>

    <div v-if="carregando" class="panel">
      <div class="panel-body text-center py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Carregando relatórios...</span>
        </div>
        <p class="texto-3 mt-3 mb-0">Consultando as ocorrências na API...</p>
      </div>
    </div>

    <div v-else-if="!resumo.total" class="panel">
      <div class="panel-body">
        <EmptyState
          :titulo="
            temFiltrosAtivos
              ? 'Nenhuma ocorrência no recorte'
              : 'Nenhuma ocorrência cadastrada'
          "
          :descricao="
            temFiltrosAtivos
              ? 'Não há registros para os filtros selecionados. Ajuste o período ou limpe os filtros.'
              : 'Cadastre ocorrências para gerar os relatórios consolidados.'
          "
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
          <RouterLink v-else class="btn btn-primary" :to="{ name: 'nova-ocorrencia' }">
            <i class="bi bi-plus-lg me-2" aria-hidden="true"></i>
            Cadastrar ocorrência
          </RouterLink>
        </EmptyState>
      </div>
    </div>

    <div v-else class="report-layout">
      <article id="relatorio-impressao" class="report-preview">
        <div class="report-brand">
          <span class="brand-symbol" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="8.5" stroke="currentColor" stroke-width="1.4" />
              <path
                d="M3.5 12h3.2l1.8-4.4 2.6 8.8 2.2-4.4h3.2"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </span>
          <strong>EcoMonitor</strong>
        </div>

        <p class="report-eyebrow">Relatório consolidado</p>
        <h2 class="report-title">{{ tituloRelatorio }}</h2>
        <p class="report-subtitle">{{ subtituloRelatorio }}</p>
        <p class="report-subtitle">
          Recorte: {{ recortes }} · Gerado em {{ geradoEm }}
        </p>

        <hr class="report-divider" />

        <div class="report-kpis">
          <div class="report-kpi">
            <p class="report-kpi-label">Ocorrências</p>
            <p class="report-kpi-value">{{ formatarNumero(resumo.total) }}</p>
            <p class="report-kpi-note">Registros no recorte selecionado.</p>
          </div>
          <div class="report-kpi">
            <p class="report-kpi-label">Área estimada</p>
            <p class="report-kpi-value">
              {{ formatarNumero(indicadores.areaTotal) }}
              <span class="kpi-unidade">ha</span>
            </p>
            <p class="report-kpi-note">Somatório demonstrativo.</p>
          </div>
          <div class="report-kpi">
            <p class="report-kpi-label">Municípios</p>
            <p class="report-kpi-value">
              {{ formatarNumero(indicadores.municipios) }}
            </p>
            <p class="report-kpi-note">
              Em {{ formatarNumero(indicadores.estados) }} estados.
            </p>
          </div>
        </div>

        <hr class="report-divider" />

        <div class="report-tipo-grid">
          <div
            v-for="grupo in porTipo"
            :key="grupo.tipo"
            class="report-tipo-card"
          >
            <h4>
              <span
                class="mapa-legenda-cor"
                :style="{ backgroundColor: corTipo(grupo.tipo) }"
                aria-hidden="true"
              ></span>
              {{ grupo.tipo === 'queimada' ? 'Queimadas' : 'Desmatamentos' }}
            </h4>
            <p>
              {{ formatarNumero(grupo.ocorrencias) }} registros ·
              {{ formatarPercentual(grupo.percentual) }} do total ·
              {{ formatarAreaComUnidade(grupo.area) }}
            </p>
          </div>
        </div>

        <hr class="report-divider" />

        <h3 class="report-title" style="font-size: 16px">Evolução mensal</h3>
        <p class="report-subtitle mb-3">
          Comparativo entre queimadas e desmatamentos por mês.
        </p>

        <div v-if="mensal.labels.length" class="chart-box chart-box-sm">
          <Bar :data="dadosMensais" :options="opcoesMensais" />
        </div>
        <p v-else class="report-subtitle">
          Não há datas válidas para montar a evolução mensal.
        </p>

        <hr class="report-divider" />

        <h3 class="report-title" style="font-size: 16px">
          Distribuição por estado
        </h3>
        <p class="report-subtitle mb-3">
          Participação de cada estado no total de ocorrências do recorte.
        </p>

        <table class="report-table">
          <thead>
            <tr>
              <th scope="col">Estado</th>
              <th scope="col" class="num">Ocorrências</th>
              <th scope="col" class="num">Queimadas</th>
              <th scope="col" class="num">Desmatamentos</th>
              <th scope="col" class="num">Área</th>
              <th scope="col" class="num">Participação</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="linha in porEstado" :key="linha.estado">
              <td><strong>{{ linha.estado }}</strong></td>
              <td class="num">{{ formatarNumero(linha.ocorrencias) }}</td>
              <td class="num">{{ formatarNumero(linha.queimadas) }}</td>
              <td class="num">{{ formatarNumero(linha.desmatamentos) }}</td>
              <td class="num">{{ formatarAreaComUnidade(linha.area) }}</td>
              <td class="num">{{ formatarPercentual(linha.percentual) }}</td>
            </tr>
          </tbody>
        </table>

        <div class="report-footer">
          <span>
            EcoMonitor · {{ formatarData(resumo.dataMinima) }} a
            {{ formatarData(resumo.dataMaxima) }}
          </span>
          <span>
            Severidade, status e área são metadados demonstrativos.
          </span>
        </div>
      </article>

      <aside class="report-side no-print">
        <section class="panel">
          <div class="panel-header">
            <div>
              <h2 class="panel-title">Exportação</h2>
              <p class="panel-subtitle">Arquivos e impressão do recorte.</p>
            </div>
          </div>

          <div class="panel-body stack" style="gap: 10px">
            <button type="button" class="btn btn-primary" @click="gerarPdf">
              <i class="bi bi-printer me-2" aria-hidden="true"></i>
              Gerar PDF
            </button>
            <button
              type="button"
              class="btn btn-outline-secondary"
              :disabled="!filtrados.length"
              @click="exportarOcorrencias"
            >
              <i class="bi bi-filetype-csv me-2" aria-hidden="true"></i>
              CSV de ocorrências
            </button>
            <button
              type="button"
              class="btn btn-outline-secondary"
              :disabled="!porEstado.length"
              @click="exportarEstados"
            >
              <i class="bi bi-filetype-csv me-2" aria-hidden="true"></i>
              CSV por estado
            </button>
            <p class="form-hint mb-0">
              O PDF é gerado pelo diálogo de impressão do navegador.
            </p>
          </div>
        </section>

        <section class="panel">
          <div class="panel-header">
            <div>
              <h2 class="panel-title">Relatórios salvos</h2>
              <p class="panel-subtitle">Recortes mensais derivados da base.</p>
            </div>
          </div>

          <div class="panel-body">
            <ul v-if="relatoriosSalvos.length" class="saved-list">
              <li
                v-for="mes in relatoriosSalvos"
                :key="mes.mes"
                class="saved-item"
              >
                <button type="button" @click="aplicarMes(mes.mes)">
                  Relatório mensal — {{ formatarMesLongo(mes.mes) }}
                </button>
                <span class="saved-count">
                  {{ formatarNumero(mes.total) }}
                </span>
              </li>
            </ul>
            <p v-else class="texto-3 small mb-0">
              Nenhum mês com registros disponível.
            </p>

            <button
              v-if="temFiltrosAtivos"
              type="button"
              class="btn btn-outline-secondary btn-sm w-100 mt-3"
              @click="limparFiltros"
            >
              <i class="bi bi-arrow-counterclockwise me-1" aria-hidden="true"></i>
              Voltar ao consolidado
            </button>
          </div>
        </section>

        <section class="panel">
          <div class="panel-header">
            <div>
              <h2 class="panel-title">Notas do relatório</h2>
            </div>
          </div>

          <div class="panel-body">
            <ul class="report-notes">
              <li>
                <i class="bi bi-info-circle" aria-hidden="true"></i>
                Os totais refletem as ocorrências carregadas da API.
              </li>
              <li>
                <i class="bi bi-info-circle" aria-hidden="true"></i>
                Severidade, status, área e bioma são metadados demonstrativos
                e não são persistidos no backend.
              </li>
              <li>
                <i class="bi bi-info-circle" aria-hidden="true"></i>
                O recorte mensal usa a data da ocorrência, não a data de
                criação do registro.
              </li>
            </ul>
          </div>
        </section>

        <p class="texto-3 small mb-0">
          Último mês de referência:
          <strong>{{ mensal.labels.at(-1) || '—' }}</strong>
        </p>
      </aside>
    </div>
  </div>
</template>
