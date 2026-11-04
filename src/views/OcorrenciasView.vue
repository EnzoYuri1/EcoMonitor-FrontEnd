<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { RouterLink } from 'vue-router'

import BaseModal from '@/components/BaseModal.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import EmptyState from '@/components/EmptyState.vue'
import Pagination from '@/components/Pagination.vue'
import TipoBadge from '@/components/TipoBadge.vue'
import {
  atualizarOcorrencia,
  excluirOcorrencia,
  listarOcorrencias,
} from '@/services/ocorrencias'
import { obterEstatisticas } from '@/services/stats'
import { useAuthStore } from '@/stores/auth'
import { PAGE_SIZE_OPTIONS, TIPOS, UFS } from '@/utils/constants'
import {
  dataHojeISO,
  formatarData,
  formatarDataHora,
  formatarNumero,
  formatarResponsavel,
  truncar,
} from '@/utils/format'

const auth = useAuthStore()
const hoje = dataHojeISO()

const filtros = reactive({
  tipo: '',
  municipio: '',
  data_inicio: '',
  data_fim: '',
  page_size: 20,
})

const filtrosAplicados = reactive({ ...filtros })
const pagina = ref(1)

const dados = ref({
  items: [],
  total: 0,
  page: 1,
  page_size: 20,
  pages: 0,
})

const carregando = ref(true)
const erroCarregamento = ref('')
const erroAcao = ref('')
const mensagemSucesso = ref('')

const municipios = ref([])
const carregandoMunicipios = ref(false)
const erroMunicipios = ref('')

const detalhesAbertos = ref(false)
const ocorrenciaDetalhes = ref(null)

const edicaoAberta = ref(false)
const originalEdicao = ref(null)
const editando = ref(null)
const camposEdicao = ref({})
const erroEdicao = ref('')
const salvandoEdicao = ref(false)

const exclusaoAberta = ref(false)
const ocorrenciaExclusao = ref(null)
const excluindo = ref(false)

let sequenciaRequisicao = 0

const temFiltrosAtivos = computed(() =>
  Boolean(
    filtrosAplicados.tipo ||
      filtrosAplicados.municipio ||
      filtrosAplicados.data_inicio ||
      filtrosAplicados.data_fim,
  ),
)

const tituloVazio = computed(() =>
  temFiltrosAtivos.value
    ? 'Nenhuma ocorrência encontrada'
    : 'Nenhuma ocorrência cadastrada',
)

const descricaoVazio = computed(() =>
  temFiltrosAtivos.value
    ? 'Ajuste ou limpe os filtros para consultar outros resultados.'
    : 'Cadastre a primeira ocorrência para começar o acompanhamento.',
)

const mensagemExclusao = computed(() => {
  if (!ocorrenciaExclusao.value) return ''

  return `Excluir a ocorrência #${ocorrenciaExclusao.value.id} de ${ocorrenciaExclusao.value.municipio}/${ocorrenciaExclusao.value.estado}? Esta ação não pode ser desfeita.`
})

function limparFeedback() {
  erroAcao.value = ''
  mensagemSucesso.value = ''
}

function limparCampoEdicao(campo) {
  if (camposEdicao.value[campo]) {
    const restantes = { ...camposEdicao.value }
    delete restantes[campo]
    camposEdicao.value = restantes
  }
}

function ehResponsavel(item) {
  return Number(item?.created_by) === Number(auth.userId)
}

function parametrosListagem(page = pagina.value) {
  return {
    tipo: filtrosAplicados.tipo || undefined,
    municipio: filtrosAplicados.municipio || undefined,
    data_inicio: filtrosAplicados.data_inicio || undefined,
    data_fim: filtrosAplicados.data_fim || undefined,
    page,
    page_size: filtrosAplicados.page_size,
  }
}

async function carregarMunicipios() {
  carregandoMunicipios.value = true
  erroMunicipios.value = ''

  try {
    const estatisticas = await obterEstatisticas()
    municipios.value = estatisticas.por_municipio.map(
      (item) => item.municipio,
    )
  } catch (error) {
    erroMunicipios.value =
      error?.message ||
      'Não foi possível carregar a lista de municípios.'
  } finally {
    carregandoMunicipios.value = false
  }
}

async function carregar() {
  const requisicao = ++sequenciaRequisicao
  carregando.value = true
  erroCarregamento.value = ''

  try {
    let resultado = await listarOcorrencias(parametrosListagem())

    if (
      resultado.items.length === 0 &&
      resultado.total > 0 &&
      pagina.value > 1
    ) {
      pagina.value = Math.max(1, resultado.pages)
      resultado = await listarOcorrencias(parametrosListagem())
    }

    if (requisicao !== sequenciaRequisicao) return
    dados.value = resultado
  } catch (error) {
    if (requisicao !== sequenciaRequisicao) return
    erroCarregamento.value =
      error?.message ||
      'Não foi possível carregar as ocorrências.'
  } finally {
    if (requisicao === sequenciaRequisicao) {
      carregando.value = false
    }
  }
}

function aplicarFiltros() {
  limparFeedback()

  if (
    filtros.data_inicio &&
    filtros.data_fim &&
    filtros.data_inicio > filtros.data_fim
  ) {
    erroAcao.value =
      'A data inicial não pode ser posterior à data final.'
    return
  }

  Object.assign(filtrosAplicados, filtros)
  pagina.value = 1
  carregar()
}

function limparFiltros() {
  limparFeedback()

  Object.assign(filtros, {
    tipo: '',
    municipio: '',
    data_inicio: '',
    data_fim: '',
    page_size: 20,
  })
  Object.assign(filtrosAplicados, filtros)
  pagina.value = 1
  carregar()
}

function irParaPagina(novaPagina) {
  if (novaPagina < 1) return
  if (dados.value.pages && novaPagina > dados.value.pages) return

  pagina.value = novaPagina
  carregar()
}

function abrirDetalhes(item) {
  ocorrenciaDetalhes.value = item
  detalhesAbertos.value = true
}

function abrirEdicao(item) {
  detalhesAbertos.value = false
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
  detalhesAbertos.value = false
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
  if (municipio !== original.municipio) {
    alteracoes.municipio = municipio
  }
  if (atual.estado !== original.estado) {
    alteracoes.estado = atual.estado
  }
  if (descricao !== original.descricao) {
    alteracoes.descricao = descricao
  }
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

  if (
    latitude !== latitudeOriginal ||
    longitude !== longitudeOriginal
  ) {
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
    await carregarMunicipios()
  } catch (error) {
    erroEdicao.value =
      error?.message ||
      'Não foi possível atualizar a ocorrência.'
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

    if (dados.value.items.length === 1 && pagina.value > 1) {
      pagina.value -= 1
    }

    await carregar()
    await carregarMunicipios()
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

function formatarCoordenadas(item) {
  if (!item || (item.latitude == null && item.longitude == null)) {
    return 'Não informadas'
  }

  const latitude =
    item.latitude != null ? Number(item.latitude).toFixed(4) : '—'
  const longitude =
    item.longitude != null ? Number(item.longitude).toFixed(4) : '—'

  return `${latitude}, ${longitude}`
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
        <h2 class="h3 fw-bold mb-1">Ocorrências</h2>
        <p class="text-secondary mb-0">
          Consulte, filtre e gerencie as ocorrências ambientais.
        </p>
      </div>

      <RouterLink
        class="btn btn-primary"
        :to="{ name: 'nova-ocorrencia' }"
      >
        <i class="bi bi-plus-circle me-2" aria-hidden="true"></i>
        Nova ocorrência
      </RouterLink>
    </div>

    <div
      v-if="mensagemSucesso"
      class="alert alert-success alert-dismissible fade show"
      role="alert"
    >
      <i class="bi bi-check-circle me-2" aria-hidden="true"></i>
      {{ mensagemSucesso }}
      <button
        type="button"
        class="btn-close"
        aria-label="Fechar"
        @click="mensagemSucesso = ''"
      ></button>
    </div>

    <div
      v-if="erroAcao"
      class="alert alert-danger alert-dismissible fade show mensagem-erro"
      role="alert"
    >
      <i class="bi bi-exclamation-triangle me-2" aria-hidden="true"></i>
      {{ erroAcao }}
      <button
        type="button"
        class="btn-close"
        aria-label="Fechar"
        @click="erroAcao = ''"
      ></button>
    </div>

    <div class="card filter-card mb-3">
      <div class="card-body">
        <form
          class="row g-3 align-items-end"
          novalidate
          @submit.prevent="aplicarFiltros"
        >
          <div class="col-12 col-md-6 col-xl-2">
            <label class="form-label" for="filtro-tipo">Tipo</label>
            <select
              id="filtro-tipo"
              v-model="filtros.tipo"
              class="form-select"
            >
              <option value="">Todos</option>
              <option
                v-for="tipo in TIPOS"
                :key="tipo.value"
                :value="tipo.value"
              >
                {{ tipo.label }}
              </option>
            </select>
          </div>

          <div class="col-12 col-md-6 col-xl-3">
            <label class="form-label" for="filtro-municipio">
              Município
            </label>
            <select
              id="filtro-municipio"
              v-model="filtros.municipio"
              class="form-select"
              :disabled="carregandoMunicipios"
            >
              <option value="">Todos</option>
              <option
                v-for="municipio in municipios"
                :key="municipio"
                :value="municipio"
              >
                {{ municipio }}
              </option>
            </select>
            <div
              v-if="carregandoMunicipios"
              class="form-text"
            >
              Carregando municípios...
            </div>
            <div
              v-else-if="erroMunicipios"
              class="form-text text-danger"
              :title="erroMunicipios"
            >
              Não foi possível carregar os municípios.
            </div>
          </div>

          <div class="col-6 col-md-3 col-xl-2">
            <label class="form-label" for="filtro-inicio">
              Data inicial
            </label>
            <input
              id="filtro-inicio"
              v-model="filtros.data_inicio"
              type="date"
              class="form-control"
              :max="hoje"
            />
          </div>

          <div class="col-6 col-md-3 col-xl-2">
            <label class="form-label" for="filtro-fim">
              Data final
            </label>
            <input
              id="filtro-fim"
              v-model="filtros.data_fim"
              type="date"
              class="form-control"
              :max="hoje"
            />
          </div>

          <div class="col-6 col-md-3 col-xl-1">
            <label class="form-label" for="filtro-page-size">
              Por página
            </label>
            <select
              id="filtro-page-size"
              v-model.number="filtros.page_size"
              class="form-select"
            >
              <option
                v-for="opcao in PAGE_SIZE_OPTIONS"
                :key="opcao"
                :value="opcao"
              >
                {{ opcao }}
              </option>
            </select>
          </div>

          <div class="col-12 col-xl-2 d-flex gap-2">
            <button
              type="submit"
              class="btn btn-primary flex-grow-1"
              :disabled="carregando"
            >
              <i class="bi bi-funnel me-1" aria-hidden="true"></i>
              Filtrar
            </button>
            <button
              type="button"
              class="btn btn-outline-secondary"
              :disabled="carregando"
              @click="limparFiltros"
            >
              Limpar
            </button>
          </div>
        </form>
      </div>
    </div>

    <div class="card">
      <div
        class="card-header d-flex flex-wrap align-items-center justify-content-between gap-2"
      >
        <h3 class="h6 mb-0">Lista de ocorrências</h3>
        <span class="text-secondary small">
          {{ formatarNumero(dados.total) }}
          {{ dados.total === 1 ? 'registro' : 'registros' }}
        </span>
      </div>

      <div class="card-body p-0">
        <div v-if="carregando" class="text-center py-5">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">
              Carregando ocorrências...
            </span>
          </div>
          <p class="text-secondary mt-3 mb-0">
            Carregando ocorrências...
          </p>
        </div>

        <div v-else-if="erroCarregamento" class="p-4">
          <div
            class="alert alert-danger d-flex flex-wrap align-items-center gap-2 mb-0"
            role="alert"
          >
            <i class="bi bi-wifi-off" aria-hidden="true"></i>
            <span class="flex-grow-1">{{ erroCarregamento }}</span>
            <button
              type="button"
              class="btn btn-sm btn-outline-danger"
              @click="carregar"
            >
              Tentar novamente
            </button>
          </div>
        </div>

        <EmptyState
          v-else-if="!dados.items.length"
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
          <RouterLink
            v-else
            class="btn btn-primary"
            :to="{ name: 'nova-ocorrencia' }"
          >
            <i class="bi bi-plus-circle me-2" aria-hidden="true"></i>
            Cadastrar ocorrência
          </RouterLink>
        </EmptyState>

        <div v-else class="table-responsive">
          <table class="table table-hover align-middle mb-0">
            <thead>
              <tr>
                <th scope="col">Data</th>
                <th scope="col">Tipo</th>
                <th scope="col">Município</th>
                <th scope="col">UF</th>
                <th scope="col">Descrição</th>
                <th scope="col">Responsável</th>
                <th scope="col" class="text-end">Ações</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in dados.items" :key="item.id">
                <td class="text-nowrap">
                  {{ formatarData(item.data_ocorrencia) }}
                </td>
                <td>
                  <TipoBadge :tipo="item.tipo" />
                </td>
                <td>{{ item.municipio }}</td>
                <td>{{ item.estado }}</td>
                <td class="descricao-col">
                  {{ truncar(item.descricao, 70) }}
                </td>
                <td class="text-nowrap">
                  <span
                    v-if="ehResponsavel(item)"
                    class="fw-semibold text-success"
                  >
                    Você
                  </span>
                  <span v-else class="text-secondary">
                    Outro usuário
                  </span>
                </td>
                <td class="text-end text-nowrap">
                  <button
                    type="button"
                    class="btn btn-sm btn-outline-secondary"
                    title="Ver detalhes"
                    aria-label="Ver detalhes"
                    @click="abrirDetalhes(item)"
                  >
                    <i class="bi bi-eye" aria-hidden="true"></i>
                  </button>

                  <template v-if="ehResponsavel(item)">
                    <button
                      type="button"
                      class="btn btn-sm btn-outline-primary ms-1"
                      title="Editar ocorrência"
                      aria-label="Editar ocorrência"
                      @click="abrirEdicao(item)"
                    >
                      <i class="bi bi-pencil" aria-hidden="true"></i>
                    </button>
                    <button
                      type="button"
                      class="btn btn-sm btn-outline-danger ms-1"
                      title="Excluir ocorrência"
                      aria-label="Excluir ocorrência"
                      @click="abrirExclusao(item)"
                    >
                      <i class="bi bi-trash" aria-hidden="true"></i>
                    </button>
                  </template>

                  <span
                    v-else
                    class="d-inline-flex align-items-center text-secondary small ms-2"
                    title="Somente o responsável pode editar ou excluir."
                  >
                    <i class="bi bi-lock" aria-hidden="true"></i>
                    <span class="d-none d-xl-inline ms-1">
                      Somente o responsável pode editar ou excluir.
                    </span>
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div
        v-if="!carregando && !erroCarregamento && dados.total > 0"
        class="card-footer bg-white"
      >
        <Pagination
          :page="dados.page"
          :pages="dados.pages"
          :total="dados.total"
          :disabled="carregando"
          @update:page="irParaPagina"
        />
      </div>
    </div>

    <BaseModal
      v-model="detalhesAbertos"
      title="Detalhes da ocorrência"
      size="lg"
    >
      <div v-if="ocorrenciaDetalhes">
        <div class="d-flex flex-wrap align-items-center gap-2 mb-3">
          <TipoBadge :tipo="ocorrenciaDetalhes.tipo" />
          <span class="badge text-bg-light border">
            #{{ ocorrenciaDetalhes.id }}
          </span>
        </div>

        <dl class="row detail-list mb-0">
          <dt class="col-sm-4">Município</dt>
          <dd class="col-sm-8">
            {{ ocorrenciaDetalhes.municipio }} /
            {{ ocorrenciaDetalhes.estado }}
          </dd>

          <dt class="col-sm-4">Data da ocorrência</dt>
          <dd class="col-sm-8">
            {{ formatarData(ocorrenciaDetalhes.data_ocorrencia) }}
          </dd>

          <dt class="col-sm-4">Coordenadas</dt>
          <dd class="col-sm-8">
            {{ formatarCoordenadas(ocorrenciaDetalhes) }}
          </dd>

          <dt class="col-sm-4">Responsável</dt>
          <dd class="col-sm-8">
            {{
              formatarResponsavel(
                ocorrenciaDetalhes.created_by,
                auth.userId,
              )
            }}
          </dd>

          <dt class="col-sm-4">Registrada em</dt>
          <dd class="col-sm-8">
            {{ formatarDataHora(ocorrenciaDetalhes.created_at) }}
          </dd>

          <dt class="col-sm-4">Descrição</dt>
          <dd class="col-sm-8 descricao-detalhe">
            {{ ocorrenciaDetalhes.descricao }}
          </dd>
        </dl>

        <div
          v-if="ehResponsavel(ocorrenciaDetalhes)"
          class="d-flex flex-wrap gap-2 mt-4"
        >
          <button
            type="button"
            class="btn btn-outline-primary btn-sm"
            @click="abrirEdicao(ocorrenciaDetalhes)"
          >
            <i class="bi bi-pencil me-1" aria-hidden="true"></i>
            Editar
          </button>
          <button
            type="button"
            class="btn btn-outline-danger btn-sm"
            @click="abrirExclusao(ocorrenciaDetalhes)"
          >
            <i class="bi bi-trash me-1" aria-hidden="true"></i>
            Excluir
          </button>
        </div>

        <p v-else class="text-secondary small mt-4 mb-0">
          <i class="bi bi-lock me-1" aria-hidden="true"></i>
          Somente o responsável pode editar ou excluir.
        </p>
      </div>

      <template #footer>
        <button
          type="button"
          class="btn btn-outline-secondary"
          @click="detalhesAbertos = false"
        >
          Fechar
        </button>
      </template>
    </BaseModal>

    <BaseModal
      v-model="edicaoAberta"
      title="Editar ocorrência"
      size="lg"
    >
      <div v-if="editando">
        <div
          v-if="erroEdicao"
          class="alert alert-danger mensagem-erro"
          role="alert"
        >
          <i class="bi bi-exclamation-triangle me-2" aria-hidden="true"></i>
          {{ erroEdicao }}
        </div>

        <p class="text-secondary small mb-3">
          Altere apenas os campos necessários. Somente o responsável pode
          editar esta ocorrência.
        </p>

        <form id="form-edicao" novalidate @submit.prevent="salvarEdicao">
          <div class="row g-3">
            <div class="col-12 col-md-4">
              <label for="edicao-tipo" class="form-label">Tipo</label>
              <select
                id="edicao-tipo"
                v-model="editando.tipo"
                class="form-select"
                :class="{ 'is-invalid': camposEdicao.tipo }"
                @change="limparCampoEdicao('tipo')"
              >
                <option
                  v-for="tipo in TIPOS"
                  :key="tipo.value"
                  :value="tipo.value"
                >
                  {{ tipo.label }}
                </option>
              </select>
              <div v-if="camposEdicao.tipo" class="invalid-feedback">
                {{ camposEdicao.tipo }}
              </div>
            </div>

            <div class="col-12 col-md-5">
              <label for="edicao-municipio" class="form-label">
                Município
              </label>
              <input
                id="edicao-municipio"
                v-model="editando.municipio"
                type="text"
                class="form-control"
                :class="{ 'is-invalid': camposEdicao.municipio }"
                @input="limparCampoEdicao('municipio')"
              />
              <div
                v-if="camposEdicao.municipio"
                class="invalid-feedback"
              >
                {{ camposEdicao.municipio }}
              </div>
            </div>

            <div class="col-12 col-md-3">
              <label for="edicao-estado" class="form-label">
                Estado
              </label>
              <select
                id="edicao-estado"
                v-model="editando.estado"
                class="form-select"
                :class="{ 'is-invalid': camposEdicao.estado }"
                @change="limparCampoEdicao('estado')"
              >
                <option
                  v-for="uf in UFS"
                  :key="uf"
                  :value="uf"
                >
                  {{ uf }}
                </option>
              </select>
              <div v-if="camposEdicao.estado" class="invalid-feedback">
                {{ camposEdicao.estado }}
              </div>
            </div>

            <div class="col-12 col-md-4">
              <label for="edicao-data" class="form-label">
                Data da ocorrência
              </label>
              <input
                id="edicao-data"
                v-model="editando.data_ocorrencia"
                type="date"
                class="form-control"
                :class="{ 'is-invalid': camposEdicao.data_ocorrencia }"
                :max="hoje"
                @input="limparCampoEdicao('data_ocorrencia')"
              />
              <div
                v-if="camposEdicao.data_ocorrencia"
                class="invalid-feedback"
              >
                {{ camposEdicao.data_ocorrencia }}
              </div>
            </div>

            <div class="col-12">
              <label for="edicao-descricao" class="form-label">
                Descrição
              </label>
              <textarea
                id="edicao-descricao"
                v-model="editando.descricao"
                class="form-control"
                :class="{ 'is-invalid': camposEdicao.descricao }"
                rows="4"
                maxlength="2000"
                @input="limparCampoEdicao('descricao')"
              ></textarea>
              <div
                v-if="camposEdicao.descricao"
                class="invalid-feedback"
              >
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

          <div v-if="editando.informarCoordenadas" class="row g-3">
            <div class="col-12 col-sm-6">
              <label for="edicao-latitude" class="form-label">
                Latitude
              </label>
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

            <div class="col-12 col-sm-6">
              <label for="edicao-longitude" class="form-label">
                Longitude
              </label>
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
              <div
                v-if="camposEdicao.longitude"
                class="invalid-feedback"
              >
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
