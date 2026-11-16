<script setup>
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'

import ArtigoCard from '@/components/ArtigoCard.vue'
import EmptyState from '@/components/EmptyState.vue'
import KpiCard from '@/components/KpiCard.vue'
import MiniMapa from '@/components/MiniMapa.vue'
import NoticiaCard from '@/components/NoticiaCard.vue'
import NoticiaImpactoModal from '@/components/NoticiaImpactoModal.vue'
import PageHeader from '@/components/PageHeader.vue'
import Pagination from '@/components/Pagination.vue'
import {
  buscarNaCentral,
  dispararAtualizacaoCentral,
  listarArtigosCentral,
  listarNoticiasCentral,
  obterDestaquesCentral,
  obterMonitoramentoCentral,
  obterStatusCentral,
} from '@/services/central'
import { useAuthStore } from '@/stores/auth'
import { formatarData, formatarDataHora, formatarNumero } from '@/utils/format'
import {
  construirPontoMapaNoticia,
  obterRegiaoPorId,
  REGIOES_AREA_AFETADA,
} from '@/utils/noticiaImpacto'

const route = useRoute()
const auth = useAuthStore()

const emApp = computed(() => route.path.startsWith('/app'))
const abaAtiva = ref('inicio')

const carregando = ref(false)
const atualizando = ref(false)
const erro = ref('')
const mensagemSucesso = ref('')

// Estado: Início (Destaques)
const destaques = ref(null)

// Estado: Notícias
const noticiasPage = ref({ items: [], total: 0, page: 1, page_size: 12, pages: 0 })
const filtroNoticiaCategoria = ref('brasileiras')
const filtroNoticiaTermo = ref('')
const filtroNoticiaOrdenar = ref('recentes')

// Estado: Artigos Científicos
const artigosPage = ref({ items: [], total: 0, page: 1, page_size: 10, pages: 0 })
const filtroArtigo = ref('todos')
const filtroArtigoTermo = ref('')
const filtroArtigoOrdenar = ref('recentes')

// Estado: Monitoramento Ambiental Oficial
const monitoramento = ref(null)
const filtroMonEstado = ref('')
const filtroMonMetrica = ref('')
const filtroMonAmazonia = ref(false)

// Estado: Busca Inteligente
const termoBuscaGlobal = ref('')
const escopoBusca = ref('todas')
const ordenarBusca = ref('relevancia')
const dataInicioBusca = ref('')
const dataFimBusca = ref('')
const resultadoBusca = ref(null)

// Estado: Painel de Saúde e Fontes
const saudeCentral = ref(null)

// Estado: Mapa de impacto por notícia
const modalImpactoAberto = ref(false)
const noticiaImpactoSelecionada = ref(null)
const exibirMapaGeralNoticias = ref(true)
const regiaoMapaSelecionada = ref('sul_para_xingu')

const pontosMapaNoticias = computed(() =>
  (noticiasPage.value.items || []).map((item, idx) =>
    construirPontoMapaNoticia(item, idx),
  ),
)

const poligonosMapaNoticias = computed(() => {
  if (regiaoMapaSelecionada.value === 'todas') {
    return REGIOES_AREA_AFETADA.map((reg) => ({
      id: `geral-${reg.id}`,
      rotulo: `Área afetada: ${reg.nome}`,
      subtitulo: reg.descricao,
      cor: reg.cor,
      preenchimento: reg.preenchimento,
      opacidade: 0.35,
      coordenadas: reg.coordenadas,
    }))
  }
  const reg = obterRegiaoPorId(regiaoMapaSelecionada.value)
  return [
    {
      id: `ativa-${reg.id}`,
      rotulo: `Área afetada: ${reg.nome}`,
      subtitulo: reg.descricao,
      cor: reg.cor,
      preenchimento: reg.preenchimento,
      opacidade: reg.opacidade,
      coordenadas: reg.coordenadas,
    },
  ]
})

const regiaoMapaObjeto = computed(() =>
  regiaoMapaSelecionada.value === 'todas'
    ? null
    : obterRegiaoPorId(regiaoMapaSelecionada.value),
)

const monitoramentoParaImpacto = computed(
  () => monitoramento.value || destaques.value?.monitoramento || null,
)

function abrirImpactoNoticia(noticia) {
  noticiaImpactoSelecionada.value = noticia
  modalImpactoAberto.value = true
}

function aoSelecionarPinoMapaNoticias(ponto) {
  if (ponto?.regiaoId) {
    regiaoMapaSelecionada.value = ponto.regiaoId
  }
  if (ponto?.noticia) {
    abrirImpactoNoticia(ponto.noticia)
  }
}

const CATEGORIAS_NOTICIAS = [
  { valor: 'brasileiras', rotulo: 'Notícias brasileiras (Todas)' },
  { valor: 'queimadas', rotulo: 'Queimadas' },
  { valor: 'desmatamento', rotulo: 'Desmatamento' },
  { valor: 'amazonia', rotulo: 'Amazônia' },
  { valor: 'para', rotulo: 'Pará' },
  { valor: 'clima', rotulo: 'Mudanças climáticas' },
  { valor: 'fiscalizacao', rotulo: 'Fiscalização ambiental' },
  { valor: 'preservacao', rotulo: 'Preservação' },
  { valor: 'internacionais', rotulo: 'Internacionais' },
]

const FILTROS_ARTIGOS = [
  { valor: 'todos', rotulo: 'Todos' },
  { valor: 'recentes', rotulo: 'Mais recentes' },
  { valor: 'relevantes', rotulo: 'Mais relevantes' },
  { valor: 'queimadas', rotulo: 'Queimadas' },
  { valor: 'desmatamento', rotulo: 'Desmatamento' },
  { valor: 'biodiversidade', rotulo: 'Biodiversidade' },
  { valor: 'clima', rotulo: 'Mudanças climáticas' },
  { valor: 'amazonia', rotulo: 'Amazônia' },
  { valor: 'brasileiras', rotulo: 'Pesquisas brasileiras' },
  { valor: 'internacionais', rotulo: 'Pesquisas internacionais' },
]

const SUGESTOES_BUSCA = [
  'Queimadas no Pará',
  'Desmatamento na Amazônia',
  'Incêndios florestais',
  'Impactos na saúde',
  'PRODES Pará',
  'Biodiversidade',
]

function rotuloMetrica(tipo) {
  if (tipo === 'foco_de_calor') return 'Foco de calor (Satélite)'
  if (tipo === 'alerta_desmatamento') return 'Alerta operacional (DETER)'
  if (tipo === 'desmatamento_consolidado') return 'Taxa consolidada anual (PRODES)'
  return tipo
}

async function carregarInicio() {
  carregando.value = true
  erro.value = ''
  try {
    destaques.value = await obterDestaquesCentral()
  } catch (e) {
    erro.value = e?.message || 'Não foi possível carregar os destaques da Central.'
  } finally {
    carregando.value = false
  }
}

async function carregarNoticias(pagina = 1) {
  carregando.value = true
  erro.value = ''
  try {
    noticiasPage.value = await listarNoticiasCentral({
      categoria: filtroNoticiaCategoria.value,
      termo: filtroNoticiaTermo.value,
      ordenar: filtroNoticiaOrdenar.value,
      page: pagina,
      page_size: noticiasPage.value.page_size,
    })
  } catch (e) {
    erro.value = e?.message || 'Não foi possível carregar as notícias.'
  } finally {
    carregando.value = false
  }
}

async function carregarArtigos(pagina = 1) {
  carregando.value = true
  erro.value = ''
  try {
    const ordenarEfetivo =
      filtroArtigo.value === 'relevantes' ? 'relevantes' : filtroArtigoOrdenar.value
    artigosPage.value = await listarArtigosCentral({
      filtro: filtroArtigo.value,
      termo: filtroArtigoTermo.value,
      ordenar: ordenarEfetivo,
      page: pagina,
      page_size: artigosPage.value.page_size,
    })
  } catch (e) {
    erro.value = e?.message || 'Não foi possível carregar os artigos científicos.'
  } finally {
    carregando.value = false
  }
}

async function carregarMonitoramento() {
  carregando.value = true
  erro.value = ''
  try {
    monitoramento.value = await obterMonitoramentoCentral({
      estado: filtroMonEstado.value,
      tipo_metrica: filtroMonMetrica.value,
      apenas_amazonia_legal: filtroMonAmazonia.value ? true : undefined,
    })
  } catch (e) {
    erro.value = e?.message || 'Não foi possível carregar os dados oficiais de monitoramento.'
  } finally {
    carregando.value = false
  }
}

async function executarBusca() {
  const q = termoBuscaGlobal.value.trim()
  if (q.length < 2) {
    erro.value = 'Informe pelo menos 2 caracteres para pesquisar.'
    return
  }
  abaAtiva.value = 'busca'
  carregando.value = true
  erro.value = ''
  try {
    resultadoBusca.value = await buscarNaCentral({
      q,
      escopo: escopoBusca.value,
      ordenar: ordenarBusca.value,
      data_inicio: dataInicioBusca.value || undefined,
      data_fim: dataFimBusca.value || undefined,
    })
  } catch (e) {
    erro.value = e?.message || 'Falha ao realizar a pesquisa na Central.'
  } finally {
    carregando.value = false
  }
}

async function carregarSaude() {
  carregando.value = true
  erro.value = ''
  try {
    saudeCentral.value = await obterStatusCentral()
  } catch (e) {
    erro.value = e?.message || 'Não foi possível consultar o painel de saúde.'
  } finally {
    carregando.value = false
  }
}

async function selecionarAba(novaAba) {
  abaAtiva.value = novaAba
  erro.value = ''
  if (novaAba === 'inicio') await carregarInicio()
  else if (novaAba === 'noticias') await carregarNoticias(1)
  else if (novaAba === 'artigos') await carregarArtigos(1)
  else if (novaAba === 'monitoramento') await carregarMonitoramento()
  else if (novaAba === 'saude') await carregarSaude()
}

function pesquisarSugestao(sugestao) {
  termoBuscaGlobal.value = sugestao
  executarBusca()
}

async function atualizarDadosAgora() {
  atualizando.value = true
  erro.value = ''
  mensagemSucesso.value = ''
  try {
    const res = await dispararAtualizacaoCentral('todas')
    mensagemSucesso.value = `Coleta concluída: ${res.noticias_novas} novas notícias, ${res.artigos_novos} novos artigos e ${res.indicadores_atualizados} indicadores oficiais processados.`
    await selecionarAba(abaAtiva.value)
  } catch (e) {
    erro.value = e?.message || 'Não foi possível executar a atualização sob demanda.'
  } finally {
    atualizando.value = false
  }
}

onMounted(() => {
  carregarInicio()
})
</script>

<template>
  <div :class="{ 'central-public-shell': !emApp }">
    <!-- Cabeçalho público quando acessado fora de /app -->
    <header v-if="!emApp" class="landing-header">
      <RouterLink class="brand" :to="{ name: 'inicio' }">
        <span class="brand-symbol" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="8.5" stroke="currentColor" stroke-width="1.4" />
            <path d="M3.5 12h3.2l1.8-4.4 2.6 8.8 2.2-4.4h3.2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </span>
        <span class="brand-name">EcoMonitor</span>
      </RouterLink>

      <nav class="landing-nav" aria-label="Navegação pública">
        <RouterLink :to="{ name: 'inicio' }">Apresentação</RouterLink>
        <RouterLink :to="{ name: 'central-publica' }">Central Ambiental</RouterLink>
      </nav>

      <div class="landing-actions">
        <RouterLink
          v-if="auth.isAuthenticated"
          class="btn btn-primary btn-sm"
          :to="{ name: 'visao-geral' }"
        >
          Painel da equipe
        </RouterLink>
        <template v-else>
          <RouterLink class="btn btn-outline-secondary btn-sm" :to="{ name: 'login' }">Entrar</RouterLink>
          <RouterLink class="btn btn-primary btn-sm" :to="{ name: 'cadastro' }">Criar conta</RouterLink>
        </template>
      </div>
    </header>

    <div :class="{ 'landing-container py-4': !emApp }">
      <PageHeader
        eyebrow="Inteligência e fontes verificáveis"
        titulo="Central de Informações Ambientais"
        descricao="Notícias jornalísticas, biblioteca de artigos científicos e dados oficiais do INPE (Queimadas, DETER e PRODES) com foco na Amazônia Legal e no Estado do Pará."
      >
        <template #acoes>
          <button
            v-if="auth.isAuthenticated"
            type="button"
            class="btn btn-outline-secondary"
            :disabled="atualizando || carregando"
            @click="atualizarDadosAgora"
          >
            <span
              v-if="atualizando"
              class="spinner-border spinner-border-sm me-2"
              aria-hidden="true"
            ></span>
            <i v-else class="bi bi-cloud-download me-2" aria-hidden="true"></i>
            Sincronizar fontes externas
          </button>
          <button
            type="button"
            class="btn btn-primary"
            :disabled="carregando"
            @click="selecionarAba(abaAtiva)"
          >
            <i class="bi bi-arrow-clockwise me-2" aria-hidden="true"></i>
            Recarregar visão
          </button>
        </template>
      </PageHeader>

      <!-- Barra de Busca Inteligente Unificada -->
      <section class="panel mb-4" aria-label="Mecanismo de busca inteligente">
        <div class="panel-body">
          <form class="central-search-form" @submit.prevent="executarBusca">
            <div class="central-search-input-wrap">
              <i class="bi bi-search central-search-icon" aria-hidden="true"></i>
              <input
                v-model="termoBuscaGlobal"
                type="search"
                class="form-control"
                placeholder="Pesquisar ex.: Queimadas no Pará, Desmatamento na Amazônia, Impactos na saúde..."
                aria-label="Pesquisar na Central de Informações Ambientais"
              />
            </div>

            <select
              v-model="escopoBusca"
              class="form-select central-search-select"
              aria-label="Fonte da pesquisa"
            >
              <option value="todas">Todas as fontes</option>
              <option value="noticias">Notícias</option>
              <option value="artigos">Artigos científicos</option>
              <option value="dados_oficiais">Dados oficiais (INPE/FIRMS)</option>
            </select>

            <select
              v-model="ordenarBusca"
              class="form-select central-search-select"
              aria-label="Ordenação da pesquisa"
            >
              <option value="relevancia">Por relevância</option>
              <option value="data">Mais recentes</option>
            </select>

            <button type="submit" class="btn btn-primary" :disabled="carregando">
              Pesquisar
            </button>
          </form>

          <div class="central-sugestoes mt-2">
            <span class="texto-3 small me-2">Acesso rápido:</span>
            <button
              v-for="sug in SUGESTOES_BUSCA"
              :key="sug"
              type="button"
              class="central-chip-btn"
              @click="pesquisarSugestao(sug)"
            >
              {{ sug }}
            </button>
          </div>
        </div>
      </section>

      <!-- Abas de navegação da Central -->
      <nav class="central-tabs mb-4" aria-label="Categorias da Central Ambiental">
        <button
          type="button"
          class="central-tab-btn"
          :class="{ 'central-tab-ativa': abaAtiva === 'inicio' }"
          @click="selecionarAba('inicio')"
        >
          <i class="bi bi-stars me-1" aria-hidden="true"></i>
          Destaques
        </button>
        <button
          type="button"
          class="central-tab-btn"
          :class="{ 'central-tab-ativa': abaAtiva === 'noticias' }"
          @click="selecionarAba('noticias')"
        >
          <i class="bi bi-newspaper me-1" aria-hidden="true"></i>
          Notícias Ambientais
        </button>
        <button
          type="button"
          class="central-tab-btn"
          :class="{ 'central-tab-ativa': abaAtiva === 'artigos' }"
          @click="selecionarAba('artigos')"
        >
          <i class="bi bi-journal-richtext me-1" aria-hidden="true"></i>
          Artigos Científicos
        </button>
        <button
          type="button"
          class="central-tab-btn"
          :class="{ 'central-tab-ativa': abaAtiva === 'monitoramento' }"
          @click="selecionarAba('monitoramento')"
        >
          <i class="bi bi-globe-americas me-1" aria-hidden="true"></i>
          Monitoramento Oficial (INPE)
        </button>
        <button
          v-if="resultadoBusca"
          type="button"
          class="central-tab-btn"
          :class="{ 'central-tab-ativa': abaAtiva === 'busca' }"
          @click="abaAtiva = 'busca'"
        >
          <i class="bi bi-search me-1" aria-hidden="true"></i>
          Resultados da Busca ({{ resultadoBusca.total }})
        </button>
        <button
          type="button"
          class="central-tab-btn ms-md-auto"
          :class="{ 'central-tab-ativa': abaAtiva === 'saude' }"
          @click="selecionarAba('saude')"
        >
          <i class="bi bi-heart-pulse me-1" aria-hidden="true"></i>
          Fontes & Saúde do Sistema
        </button>
      </nav>

      <!-- Mensagens de feedback -->
      <div v-if="mensagemSucesso" class="alert alert-success d-flex align-items-center gap-2 mb-4" role="status">
        <i class="bi bi-check-circle-fill" aria-hidden="true"></i>
        <span class="flex-grow-1">{{ mensagemSucesso }}</span>
        <button type="button" class="btn-close btn-close-white" aria-label="Fechar" @click="mensagemSucesso = ''"></button>
      </div>

      <div v-if="erro" class="alert alert-danger d-flex align-items-center gap-2 mb-4" role="alert">
        <i class="bi bi-exclamation-triangle-fill" aria-hidden="true"></i>
        <span class="flex-grow-1">{{ erro }}</span>
      </div>

      <!-- Indicador de carregamento -->
      <div v-if="carregando" class="kpi-grid mb-4" aria-hidden="true">
        <div v-for="i in 4" :key="i" class="kpi-card">
          <div class="skeleton skeleton-linha" style="width: 60%"></div>
          <div class="skeleton skeleton-bloco mt-3" style="height: 44px"></div>
        </div>
      </div>

      <!-- =================================================================
           ABA 1: INÍCIO / DESTAQUES DA CENTRAL
           ================================================================= -->
      <template v-else-if="abaAtiva === 'inicio' && destaques">
        <div class="kpi-grid mb-4">
          <KpiCard
            titulo="Focos de calor (Pará · diário INPE)"
            :valor="formatarNumero(destaques.monitoramento.focos_calor_para)"
            unidade="focos"
            :descricao="`Amazônia Legal: ${formatarNumero(destaques.monitoramento.focos_calor_amazonia_legal)} focos no consolidado diário`"
            destaque="acento"
          />
          <KpiCard
            titulo="Alertas DETER (Pará · WFS)"
            :valor="formatarNumero(destaques.monitoramento.alertas_deter_para_km2)"
            unidade="km²"
            :descricao="`Alertas operacionais INPE · Amazônia Legal: ${formatarNumero(destaques.monitoramento.alertas_deter_amazonia_km2)} km²`"
          />
          <KpiCard
            :titulo="`PRODES Pará (${destaques.monitoramento.prodes_ano_referencia || 2024})`"
            :valor="formatarNumero(destaques.monitoramento.prodes_para_ultimo_ano_km2)"
            unidade="km²"
            :descricao="`Taxa anual consolidada · Amazônia Legal: ${formatarNumero(destaques.monitoramento.prodes_amazonia_ultimo_ano_km2)} km²`"
          />
          <KpiCard
            titulo="Acervo verificável na Central"
            :valor="formatarNumero(destaques.total_noticias + destaques.total_artigos)"
            unidade="itens"
            :descricao="`${formatarNumero(destaques.total_noticias)} notícias · ${formatarNumero(destaques.total_artigos)} artigos científicos`"
          />
        </div>

        <div class="central-aviso-metodologico mb-4">
          <i class="bi bi-shield-check me-2" aria-hidden="true"></i>
          <span>
            <strong>Confiabilidade de dados:</strong>
            {{ destaques.monitoramento.nota_metodologica }}
            <span v-if="destaques.ultima_atualizacao_noticias">
              · Última coleta de notícias: {{ formatarDataHora(destaques.ultima_atualizacao_noticias) }}.
            </span>
          </span>
        </div>

        <!-- Destaques recentes -->
        <section class="panel mb-4">
          <div class="panel-header">
            <div>
              <h2 class="panel-title">Destaques ambientais recentes</h2>
              <p class="panel-subtitle">Últimas matérias coletadas de veículos jornalísticos e ambientais verificados.</p>
            </div>
            <button type="button" class="panel-link link-button" @click="selecionarAba('noticias')">
              Ver todas as notícias
              <i class="bi bi-arrow-right" aria-hidden="true"></i>
            </button>
          </div>
          <div class="panel-body">
            <div v-if="destaques.destaques_recentes.length" class="central-cards-grid">
              <NoticiaCard
                v-for="item in destaques.destaques_recentes"
                :key="item.id"
                :noticia="item"
                @ver-impacto="abrirImpactoNoticia"
              />
            </div>
            <EmptyState
              v-else
              titulo="Nenhuma notícia coletada ainda"
              descricao="Execute a sincronização de fontes ou o comando agendado no backend para popular as notícias."
              icone="bi-newspaper"
            />
          </div>
        </section>

        <!-- Duas colunas: Queimadas e Desmatamento -->
        <div class="dashboard-grid mb-4">
          <section class="panel">
            <div class="panel-header">
              <div>
                <h2 class="panel-title">Últimas notícias sobre queimadas</h2>
                <p class="panel-subtitle">Incêndios florestais, focos de calor e estiagem.</p>
              </div>
            </div>
            <div class="panel-body">
              <div v-if="destaques.ultimas_queimadas.length" class="central-stack">
                <NoticiaCard
                  v-for="item in destaques.ultimas_queimadas"
                  :key="item.id"
                  :noticia="item"
                  @ver-impacto="abrirImpactoNoticia"
                />
              </div>
              <p v-else class="texto-3 mb-0">Sem notícias categorizadas em queimadas no momento.</p>
            </div>
          </section>

          <section class="panel">
            <div class="panel-header">
              <div>
                <h2 class="panel-title">Desmatamento e Estado do Pará</h2>
                <p class="panel-subtitle">Pressão sobre a floresta, fiscalização e território paraense.</p>
              </div>
            </div>
            <div class="panel-body">
              <div v-if="destaques.ultimas_desmatamento.length" class="central-stack">
                <NoticiaCard
                  v-for="item in destaques.ultimas_desmatamento"
                  :key="item.id"
                  :noticia="item"
                  @ver-impacto="abrirImpactoNoticia"
                />
              </div>
              <p v-else class="texto-3 mb-0">Sem notícias categorizadas em desmatamento/Pará no momento.</p>
            </div>
          </section>
        </div>

        <!-- Pesquisas científicas recentes -->
        <section class="panel">
          <div class="panel-header">
            <div>
              <h2 class="panel-title">Pesquisas científicas recentes</h2>
              <p class="panel-subtitle">Publicações acadêmicas revisadas por pares (OpenAlex, SciELO e Crossref).</p>
            </div>
            <button type="button" class="panel-link link-button" @click="selecionarAba('artigos')">
              Abrir biblioteca científica
              <i class="bi bi-arrow-right" aria-hidden="true"></i>
            </button>
          </div>
          <div class="panel-body">
            <div v-if="destaques.pesquisas_recentes.length" class="central-cards-grid">
              <ArtigoCard
                v-for="art in destaques.pesquisas_recentes"
                :key="art.id"
                :artigo="art"
              />
            </div>
            <EmptyState
              v-else
              titulo="Nenhum artigo científico em cache"
              descricao="Sincronize as fontes científicas para carregar publicações do OpenAlex e Crossref."
              icone="bi-journal-bookmark"
            />
          </div>
        </section>
      </template>

      <!-- =================================================================
           ABA 2: NOTÍCIAS AMBIENTAIS
           ================================================================= -->
      <template v-else-if="abaAtiva === 'noticias'">
        <section class="panel mb-4">
          <div class="panel-body">
            <div class="central-filtros-chips mb-3" role="group" aria-label="Filtrar notícias por categoria">
              <button
                v-for="cat in CATEGORIAS_NOTICIAS"
                :key="cat.valor"
                type="button"
                class="central-chip-btn"
                :class="{ 'central-chip-ativo': filtroNoticiaCategoria === cat.valor }"
                @click="filtroNoticiaCategoria = cat.valor; carregarNoticias(1)"
              >
                {{ cat.rotulo }}
              </button>
            </div>

            <form class="row g-2 align-items-end" @submit.prevent="carregarNoticias(1)">
              <div class="col-12 col-md-7">
                <label class="form-label small texto-3">Filtrar por palavra-chave ou veículo</label>
                <input
                  v-model="filtroNoticiaTermo"
                  type="search"
                  class="form-control"
                  placeholder="Ex.: Belém, Ibama, Mongabay, seca..."
                />
              </div>
              <div class="col-6 col-md-3">
                <label class="form-label small texto-3">Ordenar por</label>
                <select v-model="filtroNoticiaOrdenar" class="form-select" @change="carregarNoticias(1)">
                  <option value="recentes">Data de publicação</option>
                  <option value="relevancia">Relevância</option>
                </select>
              </div>
              <div class="col-6 col-md-2 d-grid">
                <button type="submit" class="btn btn-outline-secondary">Aplicar</button>
              </div>
            </form>
          </div>
        </section>

        <section v-if="noticiasPage.items.length" class="panel mb-4">
          <div class="panel-header">
            <div>
              <h2 class="panel-title">
                <i class="bi bi-geo-alt-fill me-2" aria-hidden="true"></i>
                Mapa da área afetada por região e por notícia
              </h2>
              <p class="panel-subtitle">
                Selecione uma região abaixo ou clique em “Impacto no mapa” em qualquer notícia para visualizar o polígono da mancha afetada em vermelho no mapa.
              </p>
            </div>
            <button
              type="button"
              class="btn btn-sm btn-outline-secondary"
              @click="exibirMapaGeralNoticias = !exibirMapaGeralNoticias"
            >
              {{ exibirMapaGeralNoticias ? 'Recolher mapa' : 'Expandir mapa' }}
            </button>
          </div>
          <div v-if="exibirMapaGeralNoticias" class="panel-body pt-2">
            <div class="central-filtros-chips mb-3" role="group" aria-label="Selecionar região para visualizar área afetada">
              <span class="texto-3 small me-1">Região / Área afetada:</span>
              <button
                v-for="reg in REGIOES_AREA_AFETADA"
                :key="reg.id"
                type="button"
                class="central-chip-btn"
                :class="{ 'central-chip-ativo': regiaoMapaSelecionada === reg.id }"
                @click="regiaoMapaSelecionada = reg.id"
              >
                {{ reg.rotuloCurto }}
              </button>
              <button
                type="button"
                class="central-chip-btn"
                :class="{ 'central-chip-ativo': regiaoMapaSelecionada === 'todas' }"
                @click="regiaoMapaSelecionada = 'todas'"
              >
                Todas as manchas regionais
              </button>
            </div>

            <div v-if="regiaoMapaObjeto" class="central-aviso-metodologico mb-3">
              <i class="bi bi-BoundingBox-circles me-2" aria-hidden="true"></i>
              <span>
                <strong>Mancha selecionada: {{ regiaoMapaObjeto.nome }} ({{ regiaoMapaObjeto.estado }})</strong> — {{ regiaoMapaObjeto.descricao }}
              </span>
            </div>

            <MiniMapa
              :pontos="regiaoMapaSelecionada === 'todas' ? pontosMapaNoticias : []"
              :poligonos="poligonosMapaNoticias"
              altura="360px"
              interativo
              mostrar-legenda
              rotulo="Mapa de área afetada por região e notícias ambientais"
              @selecionar="aoSelecionarPinoMapaNoticias"
            />
          </div>
        </section>

        <div v-if="noticiasPage.items.length" class="central-cards-grid mb-4">
          <NoticiaCard
            v-for="item in noticiasPage.items"
            :key="item.id"
            :noticia="item"
            @ver-impacto="abrirImpactoNoticia"
          />
        </div>

        <div v-else class="panel mb-4">
          <div class="panel-body">
            <EmptyState
              titulo="Nenhuma notícia encontrada para este filtro"
              descricao="Altere a categoria selecionada ou limpe o termo de busca."
              icone="bi-newspaper"
            />
          </div>
        </div>

        <Pagination
          v-if="noticiasPage.total > 0"
          :page="noticiasPage.page"
          :pages="noticiasPage.pages"
          :total="noticiasPage.total"
          :page-size="noticiasPage.page_size"
          :page-size-options="[6, 12, 24]"
          substantivo="notícias"
          @update:page="carregarNoticias"
          @update:page-size="(tam) => { noticiasPage.page_size = tam; carregarNoticias(1) }"
        />
      </template>

      <!-- =================================================================
           ABA 3: ARTIGOS CIENTÍFICOS
           ================================================================= -->
      <template v-else-if="abaAtiva === 'artigos'">
        <section class="panel mb-4">
          <div class="panel-body">
            <div class="central-filtros-chips mb-3" role="group" aria-label="Filtrar artigos científicos">
              <button
                v-for="f in FILTROS_ARTIGOS"
                :key="f.valor"
                type="button"
                class="central-chip-btn"
                :class="{ 'central-chip-ativo': filtroArtigo === f.valor }"
                @click="filtroArtigo = f.valor; carregarArtigos(1)"
              >
                {{ f.rotulo }}
              </button>
            </div>

            <form class="row g-2 align-items-end" @submit.prevent="carregarArtigos(1)">
              <div class="col-12 col-md-7">
                <label class="form-label small texto-3">Pesquisar título, autor, periódico ou DOI</label>
                <input
                  v-model="filtroArtigoTermo"
                  type="search"
                  class="form-control"
                  placeholder="Ex.: INPE, Acta Amazonica, wildfire, deforestation..."
                />
              </div>
              <div class="col-6 col-md-3">
                <label class="form-label small texto-3">Ordenação</label>
                <select v-model="filtroArtigoOrdenar" class="form-select" @change="carregarArtigos(1)">
                  <option value="recentes">Mais recentes (ano)</option>
                  <option value="relevantes">Mais citados / relevantes</option>
                </select>
              </div>
              <div class="col-6 col-md-2 d-grid">
                <button type="submit" class="btn btn-outline-secondary">Filtrar</button>
              </div>
            </form>
          </div>
        </section>

        <div v-if="artigosPage.items.length" class="central-cards-grid mb-4">
          <ArtigoCard
            v-for="art in artigosPage.items"
            :key="art.id"
            :artigo="art"
          />
        </div>

        <div v-else class="panel mb-4">
          <div class="panel-body">
            <EmptyState
              titulo="Nenhuma publicação científica encontrada"
              descricao="Tente outro filtro temático ou sincronize a base OpenAlex/Crossref."
              icone="bi-journal-x"
            />
          </div>
        </div>

        <Pagination
          v-if="artigosPage.total > 0"
          :page="artigosPage.page"
          :pages="artigosPage.pages"
          :total="artigosPage.total"
          :page-size="artigosPage.page_size"
          :page-size-options="[10, 20, 30]"
          substantivo="publicações científicas"
          @update:page="carregarArtigos"
          @update:page-size="(tam) => { artigosPage.page_size = tam; carregarArtigos(1) }"
        />
      </template>

      <!-- =================================================================
           ABA 4: MONITORAMENTO AMBIENTAL OFICIAL (INPE / NASA FIRMS)
           ================================================================= -->
      <template v-else-if="abaAtiva === 'monitoramento' && monitoramento">
        <div class="central-aviso-metodologico mb-4">
          <i class="bi bi-info-circle-fill me-2" aria-hidden="true"></i>
          <div>
            <strong>Distinção obrigatória de métricas oficiais:</strong>
            <ul class="mb-0 mt-1 ps-3 small">
              <li><strong>Focos de calor (Programa Queimadas/INPE e NASA FIRMS):</strong> detecções pontuais de anomalia térmica por satélite; um foco não equivale a uma área ou número de incêndios.</li>
              <li><strong>Alertas de desmatamento (DETER/INPE):</strong> mapeamento diário/operacional em km² para apoiar a fiscalização em tempo quase real.</li>
              <li><strong>Desmatamento consolidado (PRODES/INPE):</strong> taxa oficial anual de corte raso na Amazônia Legal medida por satélites de maior resolução espacial.</li>
            </ul>
          </div>
        </div>

        <div class="kpi-grid mb-4">
          <KpiCard
            titulo="Focos de calor no Pará (INPE)"
            :valor="formatarNumero(monitoramento.focos_calor_para)"
            unidade="focos"
            :descricao="`Brasil: ${formatarNumero(monitoramento.focos_calor_brasil)} · Amazônia Legal: ${formatarNumero(monitoramento.focos_calor_amazonia_legal)}`"
            destaque="acento"
          />
          <KpiCard
            titulo="Alertas DETER no Pará (WFS)"
            :valor="formatarNumero(monitoramento.alertas_deter_para_km2)"
            unidade="km²"
            :descricao="`Amazônia Legal: ${formatarNumero(monitoramento.alertas_deter_amazonia_km2)} km² em alertas recentes`"
          />
          <KpiCard
            :titulo="`PRODES Pará (${monitoramento.prodes_ano_referencia || 2024})`"
            :valor="formatarNumero(monitoramento.prodes_para_ultimo_ano_km2)"
            unidade="km²"
            descricao="Desmatamento anual consolidado no Estado do Pará (INPE)"
          />
          <KpiCard
            :titulo="`PRODES Amazônia Legal (${monitoramento.prodes_ano_referencia || 2024})`"
            :valor="formatarNumero(monitoramento.prodes_amazonia_ultimo_ano_km2)"
            unidade="km²"
            descricao="Taxa anual oficial para os 9 estados da Amazônia Legal"
          />
        </div>

        <div class="dashboard-grid mb-4">
          <!-- Distribuição por Estado -->
          <section class="panel">
            <div class="panel-header">
              <div>
                <h2 class="panel-title">Distribuição por Estado (UF)</h2>
                <p class="panel-subtitle">Métricas separadas por natureza do indicador (sem somar grandezas distintas).</p>
              </div>
            </div>
            <div class="table-responsive">
              <table class="table table-hover align-middle mb-0">
                <thead>
                  <tr>
                    <th>UF</th>
                    <th>Recorte</th>
                    <th class="text-end">Focos de Calor (un.)</th>
                    <th class="text-end">Alertas DETER (km²)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="uf in monitoramento.por_estado.slice(0, 12)" :key="uf.estado">
                    <td><strong>{{ uf.estado }}</strong></td>
                    <td>
                      <span v-if="uf.amazonia_legal" class="central-badge central-badge-br">Amazônia Legal</span>
                      <span v-else class="texto-3 small">Demais regiões</span>
                    </td>
                    <td class="text-end">{{ formatarNumero(uf.focos_calor_total) }}</td>
                    <td class="text-end">{{ formatarNumero(uf.alertas_deter_km2) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <!-- Série Histórica Consolidada PRODES -->
          <section class="panel">
            <div class="panel-header">
              <div>
                <h2 class="panel-title">Série histórica oficial PRODES (INPE)</h2>
                <p class="panel-subtitle">Desmatamento anual consolidado no Pará e demais UFs da Amazônia Legal (km²).</p>
              </div>
              <a
                href="https://terrabrasilis.dpi.inpe.br/"
                target="_blank"
                rel="noopener noreferrer"
                class="panel-link"
              >
                TerraBrasilis
                <i class="bi bi-box-arrow-up-right" aria-hidden="true"></i>
              </a>
            </div>
            <div class="table-responsive">
              <table class="table table-hover align-middle mb-0">
                <thead>
                  <tr>
                    <th>Período</th>
                    <th>Recorte</th>
                    <th class="text-end">Área consolidada</th>
                    <th>Data Ref.</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="hist in monitoramento.historico_prodes" :key="hist.id">
                    <td>{{ hist.periodo_rotulo }}</td>
                    <td><strong>{{ hist.estado === 'PA' ? 'Pará (PA)' : 'Demais UFs Amazônia Legal' }}</strong></td>
                    <td class="text-end"><strong>{{ formatarNumero(hist.valor) }} {{ hist.unidade }}</strong></td>
                    <td class="texto-3 small">{{ formatarData(hist.data_referencia) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <!-- Filtros e tabela detalhada de registros oficiais -->
        <section class="panel">
          <div class="panel-header flex-wrap gap-2">
            <div>
              <h2 class="panel-title">Registros oficiais coletados</h2>
              <p class="panel-subtitle">Detalhamento por estado e municípios em destaque no Pará, com data da ocorrência/referência e data da coleta separadas.</p>
            </div>
            <div class="d-flex flex-wrap gap-2">
              <select v-model="filtroMonEstado" class="form-select form-select-sm" style="width: auto" aria-label="Filtrar por estado" @change="carregarMonitoramento">
                <option value="">Todos os estados</option>
                <option value="PA">Pará (PA)</option>
                <option value="AM">Amazonas (AM)</option>
                <option value="MT">Mato Grosso (MT)</option>
                <option value="MA">Maranhão (MA)</option>
                <option value="RO">Rondônia (RO)</option>
                <option value="AC">Acre (AC)</option>
                <option value="RR">Roraima (RR)</option>
                <option value="AP">Amapá (AP)</option>
                <option value="TO">Tocantins (TO)</option>
              </select>
              <select v-model="filtroMonMetrica" class="form-select form-select-sm" style="width: auto" aria-label="Filtrar por tipo de métrica" @change="carregarMonitoramento">
                <option value="">Todas as métricas</option>
                <option value="foco_de_calor">Focos de calor</option>
                <option value="alerta_desmatamento">Alertas DETER</option>
                <option value="desmatamento_consolidado">Consolidado PRODES</option>
              </select>
            </div>
          </div>

          <div class="table-responsive">
            <table class="table table-hover align-middle mb-0">
              <thead>
                <tr>
                  <th>Métrica Oficial</th>
                  <th>Território</th>
                  <th class="text-end">Valor</th>
                  <th>Fonte / Instituição</th>
                  <th>Data da Referência</th>
                  <th>Data da Coleta</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="reg in monitoramento.registros_recentes" :key="reg.id">
                  <td>
                    <span class="central-badge central-badge-cat">{{ rotuloMetrica(reg.tipo_metrica) }}</span>
                    <div class="texto-3 small mt-1">{{ reg.periodo_rotulo }}</div>
                  </td>
                  <td>
                    <strong>{{ reg.municipio ? `${reg.municipio} / ${reg.estado}` : reg.estado }}</strong>
                    <div class="texto-3 small">{{ reg.bioma }}</div>
                  </td>
                  <td class="text-end text-nowrap">
                    <strong>{{ formatarNumero(reg.valor) }} {{ reg.unidade }}</strong>
                  </td>
                  <td>
                    <a :href="reg.url_fonte" target="_blank" rel="noopener noreferrer">
                      {{ reg.fonte }}
                      <i class="bi bi-box-arrow-up-right ms-1 small" aria-hidden="true"></i>
                    </a>
                    <div class="texto-3 small">{{ reg.instituicao }}</div>
                  </td>
                  <td class="text-nowrap">{{ formatarData(reg.data_referencia) }}</td>
                  <td class="text-nowrap texto-3 small">{{ formatarDataHora(reg.coletado_em) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </template>

      <!-- =================================================================
           ABA 5: RESULTADOS DA BUSCA INTELIGENTE
           ================================================================= -->
      <template v-else-if="abaAtiva === 'busca' && resultadoBusca">
        <section class="panel mb-4">
          <div class="panel-header">
            <div>
              <h2 class="panel-title">
                Resultados para “{{ resultadoBusca.termo }}”
              </h2>
              <p class="panel-subtitle">
                {{ formatarNumero(resultadoBusca.total) }} resultados verificados ({{ formatarNumero(resultadoBusca.total_noticias) }} notícias · {{ formatarNumero(resultadoBusca.total_artigos) }} artigos científicos · {{ formatarNumero(resultadoBusca.total_dados_oficiais) }} dados oficiais).
              </p>
            </div>
          </div>

          <div class="panel-body">
            <div v-if="resultadoBusca.resultados.length" class="central-stack">
              <article
                v-for="item in resultadoBusca.resultados"
                :key="`${item.tipo_fonte}-${item.id}`"
                class="central-card"
              >
                <div class="central-card-body">
                  <div class="central-card-meta">
                    <span class="central-badge central-badge-cientifico">
                      {{ item.tipo_fonte === 'noticia' ? 'Notícia Jornalística' : item.tipo_fonte === 'artigo' ? 'Artigo Científico' : 'Dado Oficial Institucional' }}
                    </span>
                    <span class="central-badge central-badge-fonte">
                      {{ item.instituicao_ou_veiculo }}
                    </span>
                    <span class="texto-3 small ms-auto">
                      Origem: {{ item.origem }}
                    </span>
                  </div>

                  <h3 class="central-card-title">
                    <a :href="item.url_original" target="_blank" rel="noopener noreferrer" class="central-card-link">
                      {{ item.titulo }}
                    </a>
                  </h3>

                  <p class="central-card-desc">{{ item.resumo }}</p>

                  <div class="central-card-footer">
                    <div class="central-card-dates">
                      <span v-if="item.data_referencia">
                        Referência/Publicação: {{ formatarData(item.data_referencia) }}
                      </span>
                      <span v-if="item.doi">DOI: {{ item.doi }}</span>
                      <span class="texto-3">Coletado: {{ formatarDataHora(item.coletado_em) }}</span>
                    </div>
                    <a :href="item.url_original" target="_blank" rel="noopener noreferrer" class="panel-link">
                      Abrir fonte original
                      <i class="bi bi-box-arrow-up-right" aria-hidden="true"></i>
                    </a>
                  </div>
                </div>
              </article>
            </div>

            <EmptyState
              v-else
              titulo="Nenhum resultado encontrado para esta pesquisa"
              descricao="Tente outros termos como 'Pará', 'Amazônia', 'queimadas', 'PRODES' ou 'biodiversidade'."
              icone="bi-search"
            />
          </div>
        </section>
      </template>

      <!-- =================================================================
           ABA 6: PAINEL DE SAÚDE DO SISTEMA E INTEGRAÇÕES
           ================================================================= -->
      <template v-else-if="abaAtiva === 'saude' && saudeCentral">
        <div class="kpi-grid mb-4">
          <KpiCard
            titulo="Status do Backend e Banco"
            :valor="saudeCentral.status_backend === 'online' ? 'Operacional' : 'Degradado'"
            :descricao="`SQLite: ${saudeCentral.status_banco} · Verificado em ${formatarDataHora(saudeCentral.verificado_em)}`"
            destaque="acento"
          />
          <KpiCard
            titulo="Notícias armazenadas"
            :valor="formatarNumero(saudeCentral.total_noticias)"
            :descricao="saudeCentral.ultima_atualizacao_noticias ? `Última coleta: ${formatarDataHora(saudeCentral.ultima_atualizacao_noticias)}` : 'Ainda não sincronizado'"
          />
          <KpiCard
            titulo="Artigos científicos"
            :valor="formatarNumero(saudeCentral.total_artigos)"
            :descricao="saudeCentral.ultima_atualizacao_artigos ? `Última coleta: ${formatarDataHora(saudeCentral.ultima_atualizacao_artigos)}` : 'Ainda não sincronizado'"
          />
          <KpiCard
            titulo="Indicadores oficiais"
            :valor="formatarNumero(saudeCentral.total_dados_ambientais)"
            :descricao="saudeCentral.ultima_atualizacao_monitoramento ? `Última coleta: ${formatarDataHora(saudeCentral.ultima_atualizacao_monitoramento)}` : 'Série PRODES ativa'"
          />
        </div>

        <section class="panel mb-4">
          <div class="panel-header">
            <div>
              <h2 class="panel-title">Status das integrações externas</h2>
              <p class="panel-subtitle">Transparência operacional: uma integração só aparece como operacional quando sua última coleta teve sucesso real.</p>
            </div>
          </div>
          <div class="table-responsive">
            <table class="table table-hover align-middle mb-0">
              <thead>
                <tr>
                  <th>Integração</th>
                  <th>Módulo</th>
                  <th>Status</th>
                  <th class="text-end">Itens (último ciclo)</th>
                  <th>Última Atualização</th>
                  <th>Detalhe Operacional</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="intg in saudeCentral.integracoes" :key="intg.chave">
                  <td>
                    <a :href="intg.url_documentacao" target="_blank" rel="noopener noreferrer">
                      <strong>{{ intg.nome }}</strong>
                      <i class="bi bi-box-arrow-up-right ms-1 small" aria-hidden="true"></i>
                    </a>
                  </td>
                  <td class="text-capitalize">{{ intg.categoria }}</td>
                  <td>
                    <span
                      class="central-badge"
                      :class="{
                        'central-badge-br': intg.status === 'operacional',
                        'central-badge-cat': intg.status === 'requer_chave' || intg.status === 'nao_executada',
                        'central-badge-erro': intg.status === 'indisponivel',
                      }"
                    >
                      {{ intg.status }}
                    </span>
                  </td>
                  <td class="text-end">{{ formatarNumero(intg.total_itens_ultima_coleta) }}</td>
                  <td class="text-nowrap texto-3 small">
                    {{ intg.ultima_atualizacao ? formatarDataHora(intg.ultima_atualizacao) : '—' }}
                  </td>
                  <td class="small texto-3">{{ intg.mensagem }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section class="panel">
          <div class="panel-header">
            <div>
              <h2 class="panel-title">Limitações técnicas e de licença documentadas</h2>
              <p class="panel-subtitle">Fontes avaliadas cujas restrições exigem credenciais específicas ou integração indireta (sem uso de dados simulados).</p>
            </div>
          </div>
          <div class="panel-body">
            <div class="central-stack">
              <div
                v-for="lim in saudeCentral.fontes_documentadas_limitacoes"
                :key="lim.fonte"
                class="central-card"
              >
                <div class="central-card-body">
                  <div class="central-card-meta">
                    <strong>{{ lim.fonte }}</strong>
                    <span class="central-badge central-badge-cat">{{ lim.situacao }}</span>
                  </div>
                  <p class="central-card-desc mb-2">{{ lim.explicacao }}</p>
                  <a :href="lim.url_oficial" target="_blank" rel="noopener noreferrer" class="panel-link">
                    Consultar documentação oficial
                    <i class="bi bi-box-arrow-up-right" aria-hidden="true"></i>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>
      </template>

      <NoticiaImpactoModal
        v-model="modalImpactoAberto"
        :noticia="noticiaImpactoSelecionada"
        :monitoramento="monitoramentoParaImpacto"
      />
    </div>
  </div>
</template>
