<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'

import BaseModal from '@/components/BaseModal.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import EmptyState from '@/components/EmptyState.vue'
import PageHeader from '@/components/PageHeader.vue'
import Pagination from '@/components/Pagination.vue'
import SeverityBadge from '@/components/SeverityBadge.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import TipoBadge from '@/components/TipoBadge.vue'
import {
  atualizarOcorrencia,
  excluirOcorrencia,
  listarTodasOcorrencias,
} from '@/services/ocorrencias'
import { useAuthStore } from '@/stores/auth'
import { useDemoStore } from '@/stores/demo'
import {
  PAGE_SIZE_OPTIONS,
  SEVERIDADES,
  STATUS,
  TIPOS,
  UFS,
} from '@/utils/constants'
import { filtrarOcorrencias } from '@/utils/demo'
import {
  dataHojeISO,
  formatarAreaComUnidade,
  formatarData,
  formatarNumero,
} from '@/utils/format'
import { gerarCsv } from '@/utils/reports'

const auth = useAuthStore()
const demo = useDemoStore()
const route = useRoute()

const hoje = dataHojeISO()

const filtros = reactive({
  busca: '',
  tipo: '',
  estado: '',
  severidade: '',
  status: '',
})

const ordenacao = ref('recentes')
const pagina = ref(1)
const pageSize = ref(8)

const todos = ref([])
const carregando = ref(true)
const erroCarregamento = ref('')
const erroAcao = ref('')
const mensagemSucesso = ref('')

const edicaoAberta = ref(false)
const originalEdicao = ref(null)
const editando = ref(null)
const camposEdicao = ref({})
const erroEdicao = ref('')
const salvandoEdicao = ref(false)

const exclusaoAberta = ref(false)
const ocorrenciaExclusao = ref(null)
const excluindo = ref(false)

const PESO_SEVERIDADE = {
  critica: 4,
  alta: 3,
  moderada: 2,
  baixa: 1,
}

const abas = computed(() => [
  { value: '', label: 'Todas', total: baseFiltrada.value.length },
  ...STATUS.map((opcao) => ({
    ...opcao,
    total: baseFiltrada.value.filter((item) => item.status === opcao.value)
      .length,
  })),
])

const enriquecidos = computed(() =>
  demo.enriquecerLista(
    todos.value,
    auth.nomeUsuario || 'Equipe de monitoramento',
  ),
)

const baseFiltrada = computed(() =>
  filtrarOcorrencias(enriquecidos.value, {
    ...filtros,
    status: '',
  }),
)

const filtrados = computed(() =>
  filtrarOcorrencias(enriquecidos.value, filtros),
)

const ordenados = computed(() => {
  const lista = [...filtrados.value]

  switch (ordenacao.value) {
    case 'antigas':
      return lista.sort(
        (a, b) =>
          String(a.data_ocorrencia || '').localeCompare(
            String(b.data_ocorrencia || ''),
          ) || a.id - b.id,
      )
    case 'area':
      return lista.sort(
        (a, b) =>
          (Number(b.area_estimada) || 0) -
          (Number(a.area_estimada) || 0),
      )
    case 'severidade':
      return lista.sort(
        (a, b) =>
          (PESO_SEVERIDADE[b.severidade] || 0) -
            (PESO_SEVERIDADE[a.severidade] || 0) ||
          String(b.data_ocorrencia || '').localeCompare(
            String(a.data_ocorrencia || ''),
          ),
      )
    case 'municipio':
      return lista.sort((a, b) =>
        String(a.municipio || '').localeCompare(
          String(b.municipio || ''),
          'pt-BR',
        ),
      )
    default:
      return lista.sort(
        (a, b) =>
          String(b.data_ocorrencia || '').localeCompare(
            String(a.data_ocorrencia || ''),
          ) || b.id - a.id,
      )
  }
})

const total = computed(() => ordenados.value.length)
const pages = computed(() =>
  total.value === 0 ? 0 : Math.ceil(total.value / pageSize.value),
)

const itensPagina = computed(() => {
  const inicio = (pagina.value - 1) * pageSize.value
  return ordenados.value.slice(inicio, inicio + pageSize.value)
})

const temFiltrosAtivos = computed(() =>
  Boolean(
    filtros.busca ||
      filtros.tipo ||
      filtros.estado ||
      filtros.severidade ||
      filtros.status,
  ),
)

const tituloVazio = computed(() =>
  temFiltrosAtivos.value
    ? 'Nenhuma ocorrência encontrada'
    : 'Nenhuma ocorrência cadastrada',
)

const descricaoVazio = computed(() =>
  temFiltrosAtivos.value
    ? 'Ajuste ou limpe os filtros e a busca para consultar outros resultados.'
    : 'Cadastre a primeira ocorrência para começar o acompanhamento ambiental.',
)

const mensagemExclusao = computed(() => {
  if (!ocorrenciaExclusao.value) return ''

  return `Excluir ${ocorrenciaExclusao.value.codigo} de ${ocorrenciaExclusao.value.municipio}/${ocorrenciaExclusao.value.estado}? Esta ação não pode ser desfeita.`
})

watch(filtros, () => {
  pagina.value = 1
})

watch([ordenacao, pageSize], () => {
  pagina.value = 1
})

function limparFeedback() {
  erroAcao.value = ''
  mensagemSucesso.value = ''
}

function ehResponsavel(item) {
  return Number(item?.created_by) === Number(auth.userId)
}

function limparCampoEdicao(campo) {
  if (camposEdicao.value[campo]) {
    const restantes = { ...camposEdicao.value }
    delete restantes[campo]
    camposEdicao.value = restantes
  }
}

async function carregar() {
  carregando.value = true
  erroCarregamento.value = ''

  try {
    const resultado = await listarTodasOcorrencias()
    todos.value = resultado.items || []
  } catch (error) {
    todos.value = []
    erroCarregamento.value =
      error?.message || 'Não foi possível carregar as ocorrências.'
  } finally {
    carregando.value = false
  }
}

function aplicarStatus(valor) {
  filtros.status = valor
}

function limparFiltros() {
  limparFeedback()
  Object.assign(filtros, {
    busca: '',
    tipo: '',
    estado: '',
    severidade: '',
    status: '',
  })
}

function alterarTamanhoPagina(novoTamanho) {
  pageSize.value = novoTamanho
}

function abrirEdicao(item) {
  originalEdicao.value = { ...item }
  editando.value = {
    ...item,
    latitude: item.latitude ?? '',
    longitude: item.longitude ?? '',
    informarCoordenadas:
      item.latitude != null || item.longitude != null,
  }
  camposEdicao.value = {}
  erroEdicao.value = ''
  edicaoAberta.value = true
}

function abrirExclusao(item) {
  ocorrenciaExclusao.value = item
  exclusaoAberta.value = true
}

function alternarCoordenadasEdicao() {
  if (!editando.value.informarCoordenadas) {
    limparCampoEdicao('latitude')
    limparCampoEdicao('longitude')
  }
}

function validarEdicao() {
  const erros = {}
  const atual = editando.value
  const municipio = atual.municipio.trim()
  const descricao = atual.descricao.trim()

  if (!TIPOS.some((tipo) => tipo.value === atual.tipo)) {
    erros.tipo = 'Selecione o tipo da ocorrência.'
  }

  if (!municipio) {
    erros.municipio = 'Informe o município.'
  } else if (municipio.length < 2) {
    erros.municipio = 'O município deve ter pelo menos 2 caracteres.'
  } else if (municipio.length > 120) {
    erros.municipio = 'O município deve ter no máximo 120 caracteres.'
  }

  if (!atual.estado) {
    erros.estado = 'Selecione o estado.'
  } else if (!UFS.includes(atual.estado)) {
    erros.estado = 'Selecione uma UF válida.'
  }

  if (!descricao) {
    erros.descricao = 'Informe a descrição.'
  } else if (descricao.length < 5) {
    erros.descricao = 'A descrição deve ter pelo menos 5 caracteres.'
  } else if (descricao.length > 2000) {
    erros.descricao = 'A descrição deve ter no máximo 2000 caracteres.'
  }

  if (!atual.data_ocorrencia) {
    erros.data_ocorrencia = 'Informe a data da ocorrência.'
  } else if (atual.data_ocorrencia > hoje) {
    erros.data_ocorrencia =
      'A data da ocorrência não pode ser futura.'
  }

  if (atual.informarCoordenadas) {
    const latitudeTexto = String(atual.latitude ?? '').trim()
    const longitudeTexto = String(atual.longitude ?? '').trim()

    if (!latitudeTexto && !longitudeTexto) {
      erros.latitude =
        'Informe ao menos uma coordenada ou desmarque a opção.'
    }

    if (latitudeTexto) {
      const latitude = Number(latitudeTexto)
      if (!Number.isFinite(latitude)) {
        erros.latitude = 'Informe uma latitude válida.'
      } else if (latitude < -90 || latitude > 90) {
        erros.latitude = 'A latitude deve estar entre -90 e 90.'
      }
    }

    if (longitudeTexto) {
      const longitude = Number(longitudeTexto)
      if (!Number.isFinite(longitude)) {
        erros.longitude = 'Informe uma longitude válida.'
      } else if (longitude < -180 || longitude > 180) {
        erros.longitude = 'A longitude deve estar entre -180 e 180.'
      }
    }
  }

  camposEdicao.value = erros
  return Object.keys(erros).length === 0
}

function montarAlteracoes() {
  const original = originalEdicao.value
  const atual = editando.value
  const alteracoes = {}

  const municipio = atual.municipio.trim()
  const descricao = atual.descricao.trim()

  if (atual.tipo !== original.tipo) alteracoes.tipo = atual.tipo
  if (municipio !== original.municipio) alteracoes.municipio = municipio
  if (atual.estado !== original.estado) alteracoes.estado = atual.estado
  if (descricao !== original.descricao) alteracoes.descricao = descricao
  if (atual.data_ocorrencia !== original.data_ocorrencia) {
    alteracoes.data_ocorrencia = atual.data_ocorrencia
  }

  let latitude = null
  let longitude = null

  if (atual.informarCoordenadas) {
    const latitudeTexto = String(atual.latitude ?? '').trim()
    const longitudeTexto = String(atual.longitude ?? '').trim()
    latitude = latitudeTexto ? Number(latitudeTexto) : null
    longitude = longitudeTexto ? Number(longitudeTexto) : null
  }

  const latitudeOriginal = original.latitude ?? null
  const longitudeOriginal = original.longitude ?? null

  if (latitude !== latitudeOriginal || longitude !== longitudeOriginal) {
    alteracoes.latitude = latitude
    alteracoes.longitude = longitude
  }

  return alteracoes
}

async function salvarEdicao() {
  erroEdicao.value = ''

  if (!validarEdicao()) return

  const alteracoes = montarAlteracoes()

  if (!Object.keys(alteracoes).length) {
    erroEdicao.value = 'Nenhuma alteração para salvar.'
    return
  }

  salvandoEdicao.value = true

  try {
    await atualizarOcorrencia(originalEdicao.value.id, alteracoes)
    edicaoAberta.value = false
    mensagemSucesso.value = 'Ocorrência atualizada com sucesso.'
    await carregar()
  } catch (error) {
    erroEdicao.value =
      error?.message || 'Não foi possível atualizar a ocorrência.'
    if (error?.campos) {
      camposEdicao.value = {
        ...camposEdicao.value,
        ...error.campos,
      }
    }
  } finally {
    salvandoEdicao.value = false
  }
}

async function confirmarExclusao() {
  if (!ocorrenciaExclusao.value) return

  limparFeedback()
  excluindo.value = true

  try {
    await excluirOcorrencia(ocorrenciaExclusao.value.id)
    exclusaoAberta.value = false
    mensagemSucesso.value = 'Ocorrência excluída com sucesso.'

    if (itensPagina.value.length === 1 && pagina.value > 1) {
      pagina.value -= 1
    }

    await carregar()
  } catch (error) {
    erroAcao.value =
      error?.message || 'Não foi possível excluir a ocorrência.'
    exclusaoAberta.value = false

    if (error?.statusCode === 404) {
      await carregar()
    }
  } finally {
    excluindo.value = false
    ocorrenciaExclusao.value = null
  }
}

function exportarCsv() {
  if (!ordenados.value.length) return

  const linhas = [
    [
      'Código',
      'Tipo',
      'Município',
      'UF',
      'Data da ocorrência',
      'Severidade',
      'Status',
      'Área estimada (ha)',
      'Latitude',
      'Longitude',
      'Descrição',
    ],
    ...ordenados.value.map((item) => [
      item.codigo,
      item.tipo,
      item.municipio,
      item.estado,
      formatarData(item.data_ocorrencia),
      item.severidadeRotulo,
      item.statusRotulo,
      item.area_estimada,
      item.latitude ?? '',
      item.longitude ?? '',
      item.descricao || '',
    ]),
  ]

  const blob = new Blob([gerarCsv(linhas)], {
    type: 'text/csv;charset=utf-8;',
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = `ecomonitor-ocorrencias-${hoje}.csv`
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

onMounted(async () => {
  await carregar()

  const idEdicao = route.query.editar
  if (!idEdicao) return

  const item = enriquecidos.value.find(
    (ocorrencia) => String(ocorrencia.id) === String(idEdicao),
  )

  if (item && ehResponsavel(item)) abrirEdicao(item)
})
</script>

<template>
  <div>
    <PageHeader
      eyebrow="Monitoramento"
      titulo="Ocorrências"
      descricao="Consulte, filtre e gerencie os registros de queimadas e desmatamento do EcoMonitor."
    >
      <template #acoes>
        <button
          type="button"
          class="btn btn-outline-secondary"
          :disabled="!ordenados.length"
          @click="exportarCsv"
        >
          <i class="bi bi-download me-2" aria-hidden="true"></i>
          Exportar CSV
        </button>
        <RouterLink class="btn btn-primary" :to="{ name: 'nova-ocorrencia' }">
          <i class="bi bi-plus-lg me-2" aria-hidden="true"></i>
          Nova ocorrência
        </RouterLink>
      </template>
    </PageHeader>

    <div v-if="mensagemSucesso" class="alert alert-success alert-dismissible fade show" role="alert">
      <i class="bi bi-check-circle me-2" aria-hidden="true"></i>
      {{ mensagemSucesso }}
      <button type="button" class="btn-close" aria-label="Fechar" @click="mensagemSucesso = ''"></button>
    </div>

    <div v-if="erroAcao" class="alert alert-danger alert-dismissible fade show mensagem-erro" role="alert">
      <i class="bi bi-exclamation-triangle me-2" aria-hidden="true"></i>
      {{ erroAcao }}
      <button type="button" class="btn-close" aria-label="Fechar" @click="erroAcao = ''"></button>
    </div>

    <div class="filters-bar">
      <div class="filter-field filter-field-grow">
        <label for="listagem-busca">Busca</label>
        <div class="search-field">
          <i class="bi bi-search" aria-hidden="true"></i>
          <input
            id="listagem-busca"
            v-model="filtros.busca"
            type="search"
            class="form-control"
            placeholder="Código, município ou UF"
          />
        </div>
      </div>

      <div class="filter-field">
        <label for="listagem-tipo">Tipo</label>
        <select id="listagem-tipo" v-model="filtros.tipo" class="form-select">
          <option value="">Todos</option>
          <option v-for="tipo in TIPOS" :key="tipo.value" :value="tipo.value">
            {{ tipo.label }}
          </option>
        </select>
      </div>

      <div class="filter-field">
        <label for="listagem-estado">Estado</label>
        <select id="listagem-estado" v-model="filtros.estado" class="form-select">
          <option value="">Todas as UF</option>
          <option v-for="uf in UFS" :key="uf" :value="uf">{{ uf }}</option>
        </select>
      </div>

      <div class="filter-field">
        <label for="listagem-severidade">Severidade</label>
        <select
          id="listagem-severidade"
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

      <button
        type="button"
        class="btn btn-outline-secondary"
        :disabled="!temFiltrosAtivos"
        @click="limparFiltros"
      >
        <i class="bi bi-x-lg me-1" aria-hidden="true"></i>
        Limpar
      </button>
    </div>

    <section class="panel">
      <div class="tabs-bar">
        <div class="tabs" role="tablist" aria-label="Filtrar por status">
          <button
            v-for="aba in abas"
            :key="aba.value || 'todas'"
            type="button"
            class="tab-btn"
            :class="{ 'tab-btn-ativa': filtros.status === aba.value }"
            role="tab"
            :aria-selected="filtros.status === aba.value"
            @click="aplicarStatus(aba.value)"
          >
            {{ aba.label }}
            <span class="tab-count">{{ formatarNumero(aba.total) }}</span>
          </button>
        </div>

        <label class="page-size-control" for="listagem-ordem">
          <span>Ordenar</span>
          <select id="listagem-ordem" v-model="ordenacao" class="form-select">
            <option value="recentes">Mais recentes</option>
            <option value="antigas">Mais antigas</option>
            <option value="area">Maior área</option>
            <option value="severidade">Maior severidade</option>
            <option value="municipio">Município</option>
          </select>
        </label>
      </div>

      <div v-if="carregando" class="text-center py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Carregando ocorrências...</span>
        </div>
        <p class="texto-3 mt-3 mb-0">Carregando ocorrências...</p>
      </div>

      <div v-else-if="erroCarregamento" class="p-4">
        <div class="alert alert-danger d-flex flex-wrap align-items-center gap-2 mb-0" role="alert">
          <i class="bi bi-wifi-off" aria-hidden="true"></i>
          <span class="flex-grow-1">{{ erroCarregamento }}</span>
          <button type="button" class="btn btn-sm btn-outline-danger" @click="carregar">
            Tentar novamente
          </button>
        </div>
      </div>

      <EmptyState
        v-else-if="!ordenados.length"
        :titulo="tituloVazio"
        :descricao="descricaoVazio"
        icone="bi-clipboard-x"
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

      <div v-else class="table-responsive">
        <table class="table table-hover align-middle">
          <thead>
            <tr>
              <th scope="col">Código</th>
              <th scope="col">Tipo</th>
              <th scope="col">Local</th>
              <th scope="col">Data</th>
              <th scope="col">Severidade</th>
              <th scope="col">Status</th>
              <th scope="col" class="text-end">Área</th>
              <th scope="col" class="text-end">Ações</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in itensPagina" :key="item.id">
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
              <td class="text-nowrap">{{ formatarData(item.data_ocorrencia) }}</td>
              <td><SeverityBadge :severidade="item.severidade" /></td>
              <td><StatusBadge :status="item.status" /></td>
              <td class="text-end numero-tabular text-nowrap">
                {{ formatarAreaComUnidade(item.area_estimada) }}
              </td>
              <td class="text-end text-nowrap">
                <span class="acoes-linha">
                  <RouterLink
                    class="btn btn-sm btn-outline-secondary"
                    :to="{ name: 'ocorrencia-detalhe', params: { id: item.id } }"
                    title="Ver detalhes"
                    aria-label="Ver detalhes"
                  >
                    <i class="bi bi-eye" aria-hidden="true"></i>
                  </RouterLink>

                  <template v-if="ehResponsavel(item)">
                    <button
                      type="button"
                      class="btn btn-sm btn-outline-primary"
                      title="Editar ocorrência"
                      aria-label="Editar ocorrência"
                      @click="abrirEdicao(item)"
                    >
                      <i class="bi bi-pencil" aria-hidden="true"></i>
                    </button>
                    <button
                      type="button"
                      class="btn btn-sm btn-outline-danger"
                      title="Excluir ocorrência"
                      aria-label="Excluir ocorrência"
                      @click="abrirExclusao(item)"
                    >
                      <i class="bi bi-trash" aria-hidden="true"></i>
                    </button>
                  </template>

                  <span
                    v-else
                    class="texto-3 small"
                    title="Somente o responsável pode editar ou excluir."
                  >
                    <i class="bi bi-lock" aria-hidden="true"></i>
                  </span>
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <Pagination
        v-if="!carregando && !erroCarregamento && total > 0"
        :page="pagina"
        :pages="pages"
        :total="total"
        :page-size="pageSize"
        :page-size-options="PAGE_SIZE_OPTIONS"
        :disabled="carregando"
        @update:page="pagina = $event"
        @update:page-size="alterarTamanhoPagina"
      />
    </section>

    <BaseModal v-model="edicaoAberta" title="Editar ocorrência" size="lg">
      <div v-if="editando">
        <div v-if="erroEdicao" class="alert alert-danger mensagem-erro" role="alert">
          <i class="bi bi-exclamation-triangle me-2" aria-hidden="true"></i>
          {{ erroEdicao }}
        </div>

        <p class="texto-3 small mb-3">
          Altere apenas os campos necessários. Somente o responsável pode
          editar esta ocorrência.
        </p>

        <form id="form-edicao" novalidate @submit.prevent="salvarEdicao">
          <div class="form-grid">
            <div>
              <label for="edicao-tipo" class="form-label">Tipo</label>
              <select
                id="edicao-tipo"
                v-model="editando.tipo"
                class="form-select"
                :class="{ 'is-invalid': camposEdicao.tipo }"
                @change="limparCampoEdicao('tipo')"
              >
                <option v-for="tipo in TIPOS" :key="tipo.value" :value="tipo.value">
                  {{ tipo.label }}
                </option>
              </select>
              <div v-if="camposEdicao.tipo" class="invalid-feedback">
                {{ camposEdicao.tipo }}
              </div>
            </div>

            <div>
              <label for="edicao-estado" class="form-label">Estado</label>
              <select
                id="edicao-estado"
                v-model="editando.estado"
                class="form-select"
                :class="{ 'is-invalid': camposEdicao.estado }"
                @change="limparCampoEdicao('estado')"
              >
                <option v-for="uf in UFS" :key="uf" :value="uf">{{ uf }}</option>
              </select>
              <div v-if="camposEdicao.estado" class="invalid-feedback">
                {{ camposEdicao.estado }}
              </div>
            </div>

            <div class="col-span-2">
              <label for="edicao-municipio" class="form-label">Município</label>
              <input
                id="edicao-municipio"
                v-model="editando.municipio"
                type="text"
                class="form-control"
                :class="{ 'is-invalid': camposEdicao.municipio }"
                @input="limparCampoEdicao('municipio')"
              />
              <div v-if="camposEdicao.municipio" class="invalid-feedback">
                {{ camposEdicao.municipio }}
              </div>
            </div>

            <div>
              <label for="edicao-data" class="form-label">Data da ocorrência</label>
              <input
                id="edicao-data"
                v-model="editando.data_ocorrencia"
                type="date"
                class="form-control"
                :class="{ 'is-invalid': camposEdicao.data_ocorrencia }"
                :max="hoje"
                @input="limparCampoEdicao('data_ocorrencia')"
              />
              <div v-if="camposEdicao.data_ocorrencia" class="invalid-feedback">
                {{ camposEdicao.data_ocorrencia }}
              </div>
            </div>

            <div class="col-span-2">
              <label for="edicao-descricao" class="form-label">Descrição</label>
              <textarea
                id="edicao-descricao"
                v-model="editando.descricao"
                class="form-control"
                :class="{ 'is-invalid': camposEdicao.descricao }"
                rows="4"
                maxlength="2000"
                @input="limparCampoEdicao('descricao')"
              ></textarea>
              <div v-if="camposEdicao.descricao" class="invalid-feedback">
                {{ camposEdicao.descricao }}
              </div>
            </div>
          </div>

          <hr class="my-4" />

          <div class="form-check form-switch mb-3">
            <input
              id="edicao-coordenadas"
              v-model="editando.informarCoordenadas"
              class="form-check-input"
              type="checkbox"
              @change="alternarCoordenadasEdicao"
            />
            <label class="form-check-label" for="edicao-coordenadas">
              Informar coordenadas
            </label>
          </div>

          <div v-if="editando.informarCoordenadas" class="form-grid">
            <div>
              <label for="edicao-latitude" class="form-label">Latitude</label>
              <input
                id="edicao-latitude"
                v-model="editando.latitude"
                type="number"
                step="any"
                min="-90"
                max="90"
                class="form-control"
                :class="{ 'is-invalid': camposEdicao.latitude }"
                @input="limparCampoEdicao('latitude')"
              />
              <div v-if="camposEdicao.latitude" class="invalid-feedback">
                {{ camposEdicao.latitude }}
              </div>
            </div>

            <div>
              <label for="edicao-longitude" class="form-label">Longitude</label>
              <input
                id="edicao-longitude"
                v-model="editando.longitude"
                type="number"
                step="any"
                min="-180"
                max="180"
                class="form-control"
                :class="{ 'is-invalid': camposEdicao.longitude }"
                @input="limparCampoEdicao('longitude')"
              />
              <div v-if="camposEdicao.longitude" class="invalid-feedback">
                {{ camposEdicao.longitude }}
              </div>
            </div>
          </div>
        </form>
      </div>

      <template #footer>
        <button
          type="button"
          class="btn btn-outline-secondary"
          :disabled="salvandoEdicao"
          @click="edicaoAberta = false"
        >
          Cancelar
        </button>
        <button
          type="submit"
          form="form-edicao"
          class="btn btn-primary"
          :disabled="salvandoEdicao"
        >
          <span
            v-if="salvandoEdicao"
            class="spinner-border spinner-border-sm me-2"
            aria-hidden="true"
          ></span>
          <i v-else class="bi bi-check-lg me-2" aria-hidden="true"></i>
          {{ salvandoEdicao ? 'Salvando...' : 'Salvar alterações' }}
        </button>
      </template>
    </BaseModal>

    <ConfirmDialog
      v-model="exclusaoAberta"
      title="Excluir ocorrência"
      :message="mensagemExclusao"
      confirm-label="Excluir"
      :loading="excluindo"
      @confirm="confirmarExclusao"
    />
  </div>
</template>
