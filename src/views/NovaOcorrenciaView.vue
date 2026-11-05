<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'

import EmptyState from '@/components/EmptyState.vue'
import MiniMapa from '@/components/MiniMapa.vue'
import PageHeader from '@/components/PageHeader.vue'
import { criarOcorrencia } from '@/services/ocorrencias'
import { obterEstatisticas } from '@/services/stats'
import { TIPOS, UFS } from '@/utils/constants'
import { codigoOcorrencia } from '@/utils/demo'
import {
  dataHojeISO,
  formatarData,
  formatarHorario,
} from '@/utils/format'
import { formatarCoordenadas } from '@/utils/map'

const CHAVE_RASCUNHO = 'ecomonitor.demo.rascunho'

const hoje = dataHojeISO()

const form = reactive({
  tipo: 'queimada',
  municipio: '',
  estado: '',
  descricao: '',
  informarCoordenadas: false,
  latitude: '',
  longitude: '',
  data_ocorrencia: hoje,
})

const campos = ref({})
const erro = ref('')
const carregando = ref(false)
const sucesso = ref(null)
const municipios = ref([])
const anexos = ref([])
const rascunhoSalvo = ref(null)
const rascunhoRestaurado = ref(false)

const coordenadaMapa = computed(() => {
  if (
    String(form.latitude).trim() === '' ||
    String(form.longitude).trim() === ''
  ) {
    return null
  }

  const latitude = Number(form.latitude)
  const longitude = Number(form.longitude)

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null
  }

  return [latitude, longitude]
})

const resumoLocal = computed(() => {
  const municipio = form.municipio.trim() || 'Município não informado'
  return `${municipio}${form.estado ? `/${form.estado}` : ''}`
})

const mensagemSucesso = computed(() => {
  if (!sucesso.value) return ''

  return `A ocorrência ${codigoOcorrencia(sucesso.value)} de ${
    sucesso.value.tipo
  } em ${sucesso.value.municipio}/${sucesso.value.estado} foi registrada com sucesso.`
})

function formularioVazio() {
  return (
    form.tipo === 'queimada' &&
    !form.municipio.trim() &&
    !form.estado &&
    !form.descricao.trim() &&
    !form.informarCoordenadas &&
    !String(form.latitude).trim() &&
    !String(form.longitude).trim()
  )
}

function lerRascunho() {
  try {
    if (typeof window === 'undefined') return null
    const bruto = window.localStorage.getItem(CHAVE_RASCUNHO)
    if (!bruto) return null
    const dados = JSON.parse(bruto)
    return dados && typeof dados === 'object' ? dados : null
  } catch {
    return null
  }
}

function salvarRascunho() {
  try {
    if (typeof window === 'undefined') return

    if (formularioVazio()) {
      window.localStorage.removeItem(CHAVE_RASCUNHO)
      rascunhoSalvo.value = null
      return
    }

    window.localStorage.setItem(
      CHAVE_RASCUNHO,
      JSON.stringify({ ...form }),
    )
    rascunhoSalvo.value = new Date()
  } catch {
    // O rascunho é opcional e pode falhar em modo privado.
  }
}

function removerRascunho() {
  try {
    window.localStorage.removeItem(CHAVE_RASCUNHO)
  } catch {
    // Ignora falhas de armazenamento.
  }

  rascunhoSalvo.value = null
  rascunhoRestaurado.value = false
}

function descartarRascunho() {
  removerRascunho()
  sucesso.value = null
  erro.value = ''
  campos.value = {}
  anexos.value = []

  Object.assign(form, {
    tipo: 'queimada',
    municipio: '',
    estado: '',
    descricao: '',
    informarCoordenadas: false,
    latitude: '',
    longitude: '',
    data_ocorrencia: dataHojeISO(),
  })
}

function limparCampo(campo) {
  if (campos.value[campo]) {
    const restantes = { ...campos.value }
    delete restantes[campo]
    campos.value = restantes
  }
}

function alternarCoordenadas() {
  if (!form.informarCoordenadas) {
    limparCampo('latitude')
    limparCampo('longitude')
  }
}

function aoClicarMapa(coordenadas) {
  form.informarCoordenadas = true
  form.latitude = coordenadas.latitude
  form.longitude = coordenadas.longitude
  limparCampo('latitude')
  limparCampo('longitude')
}

function formatarTamanho(bytes) {
  if (!Number.isFinite(bytes)) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function adicionarArquivos(evento) {
  const arquivos = Array.from(evento.target.files || [])

  anexos.value = [
    ...anexos.value,
    ...arquivos.map((arquivo, indice) => ({
      id: `${arquivo.name}-${arquivo.size}-${Date.now()}-${indice}`,
      nome: arquivo.name,
      tamanho: formatarTamanho(arquivo.size),
      tipo: arquivo.type,
    })),
  ]

  evento.target.value = ''
}

function removerAnexo(id) {
  anexos.value = anexos.value.filter((anexo) => anexo.id !== id)
}

function validar() {
  const erros = {}
  const municipio = form.municipio.trim()
  const descricao = form.descricao.trim()

  if (!TIPOS.some((tipo) => tipo.value === form.tipo)) {
    erros.tipo = 'Selecione o tipo da ocorrência.'
  }

  if (!municipio) {
    erros.municipio = 'Informe o município.'
  } else if (municipio.length < 2) {
    erros.municipio = 'O município deve ter pelo menos 2 caracteres.'
  } else if (municipio.length > 120) {
    erros.municipio = 'O município deve ter no máximo 120 caracteres.'
  }

  if (!form.estado) {
    erros.estado = 'Selecione o estado.'
  } else if (!UFS.includes(form.estado)) {
    erros.estado = 'Selecione uma UF válida.'
  }

  if (!descricao) {
    erros.descricao = 'Informe a descrição.'
  } else if (descricao.length < 5) {
    erros.descricao = 'A descrição deve ter pelo menos 5 caracteres.'
  } else if (descricao.length > 2000) {
    erros.descricao = 'A descrição deve ter no máximo 2000 caracteres.'
  }

  if (!form.data_ocorrencia) {
    erros.data_ocorrencia = 'Informe a data da ocorrência.'
  } else if (form.data_ocorrencia > hoje) {
    erros.data_ocorrencia = 'A data da ocorrência não pode ser futura.'
  }

  if (form.informarCoordenadas) {
    const latitudeTexto = String(form.latitude).trim()
    const longitudeTexto = String(form.longitude).trim()

    if (!latitudeTexto) {
      erros.latitude = 'Informe a latitude.'
    } else {
      const latitude = Number(latitudeTexto)
      if (!Number.isFinite(latitude)) {
        erros.latitude = 'Informe uma latitude válida.'
      } else if (latitude < -90 || latitude > 90) {
        erros.latitude = 'A latitude deve estar entre -90 e 90.'
      }
    }

    if (!longitudeTexto) {
      erros.longitude = 'Informe a longitude.'
    } else {
      const longitude = Number(longitudeTexto)
      if (!Number.isFinite(longitude)) {
        erros.longitude = 'Informe uma longitude válida.'
      } else if (longitude < -180 || longitude > 180) {
        erros.longitude = 'A longitude deve estar entre -180 e 180.'
      }
    }
  }

  campos.value = erros
  return Object.keys(erros).length === 0
}

function montarPayload() {
  const informar = form.informarCoordenadas

  return {
    tipo: form.tipo,
    municipio: form.municipio.trim(),
    estado: form.estado,
    descricao: form.descricao.trim(),
    latitude: informar ? Number(form.latitude) : null,
    longitude: informar ? Number(form.longitude) : null,
    data_ocorrencia: form.data_ocorrencia,
  }
}

async function salvar() {
  if (carregando.value) return

  erro.value = ''

  if (!validar()) return

  carregando.value = true

  try {
    sucesso.value = await criarOcorrencia(montarPayload())
    removerRascunho()
  } catch (error) {
    erro.value =
      error?.message ||
      'Não foi possível cadastrar a ocorrência. Tente novamente.'
    if (error?.campos) {
      campos.value = { ...campos.value, ...error.campos }
    }
  } finally {
    carregando.value = false
  }
}

function cadastrarOutra() {
  descartarRascunho()
}

watch(form, salvarRascunho, { deep: true })

onMounted(async () => {
  const rascunho = lerRascunho()

  if (rascunho) {
    Object.assign(form, {
      tipo: rascunho.tipo === 'desmatamento' ? 'desmatamento' : 'queimada',
      municipio: rascunho.municipio || '',
      estado: UFS.includes(rascunho.estado) ? rascunho.estado : '',
      descricao: rascunho.descricao || '',
      informarCoordenadas: Boolean(rascunho.informarCoordenadas),
      latitude: rascunho.latitude ?? '',
      longitude: rascunho.longitude ?? '',
      data_ocorrencia:
        rascunho.data_ocorrencia &&
        rascunho.data_ocorrencia <= hoje
          ? rascunho.data_ocorrencia
          : hoje,
    })
    rascunhoRestaurado.value = true
    rascunhoSalvo.value = new Date()
  }

  try {
    const dados = await obterEstatisticas()
    municipios.value = (dados.por_municipio || [])
      .map((item) => item.municipio)
      .filter(Boolean)
  } catch {
    // As sugestões são opcionais; o cadastro continua disponível.
    municipios.value = []
  }
})
</script>

<template>
  <div>
    <PageHeader
      eyebrow="Ocorrências"
      titulo="Nova ocorrência"
      descricao="Registre uma queimada ou desmatamento com os dados observados em campo ou em análise remota."
    >
      <template #acoes>
        <RouterLink class="btn btn-outline-secondary" :to="{ name: 'ocorrencias' }">
          <i class="bi bi-list-check me-2" aria-hidden="true"></i>
          Ver ocorrências
        </RouterLink>
      </template>
    </PageHeader>

    <div v-if="sucesso" class="panel">
      <div class="panel-body">
        <EmptyState
          titulo="Ocorrência cadastrada"
          :descricao="mensagemSucesso"
          icone="bi-check2-circle"
        >
          <div class="d-flex flex-wrap justify-content-center gap-2">
            <RouterLink
              class="btn btn-primary"
              :to="{
                name: 'ocorrencia-detalhe',
                params: { id: sucesso.id },
              }"
            >
              <i class="bi bi-arrow-right me-2" aria-hidden="true"></i>
              Abrir detalhe
            </RouterLink>
            <button type="button" class="btn btn-outline-primary" @click="cadastrarOutra">
              <i class="bi bi-plus-lg me-2" aria-hidden="true"></i>
              Cadastrar outra
            </button>
          </div>
        </EmptyState>
      </div>
    </div>

    <div v-else class="form-layout">
      <section class="panel">
        <form novalidate @submit.prevent="salvar">
          <div v-if="erro" class="alert alert-danger d-flex align-items-start gap-2 m-3 mensagem-erro" role="alert">
            <i class="bi bi-exclamation-triangle mt-1" aria-hidden="true"></i>
            <span>{{ erro }}</span>
          </div>

          <div class="form-section">
            <div class="form-section-header">
              <div>
                <h2 class="form-section-title">Identificação</h2>
                <p class="form-section-desc">
                  Informe o tipo e a localização do registro.
                </p>
              </div>
            </div>

            <div class="tipo-opcoes mb-3">
              <div
                v-for="tipo in TIPOS"
                :key="tipo.value"
                class="tipo-opcao"
                :class="`tipo-opcao-${tipo.value}`"
              >
                <input
                  :id="`tipo-${tipo.value}`"
                  v-model="form.tipo"
                  type="radio"
                  :value="tipo.value"
                  @change="limparCampo('tipo')"
                />
                <label :for="`tipo-${tipo.value}`">
                  <i
                    class="bi"
                    :class="tipo.value === 'queimada' ? 'bi-fire' : 'bi-tree'"
                    aria-hidden="true"
                  ></i>
                  {{ tipo.label }}
                </label>
              </div>
            </div>
            <div v-if="campos.tipo" class="invalid-feedback d-block mb-3">
              {{ campos.tipo }}
            </div>

            <div class="form-grid">
              <div class="col-span-2">
                <label for="ocorrencia-municipio" class="form-label">
                  Município <span class="text-danger">*</span>
                </label>
                <input
                  id="ocorrencia-municipio"
                  v-model="form.municipio"
                  type="text"
                  class="form-control"
                  :class="{ 'is-invalid': campos.municipio }"
                  list="municipios-sugeridos"
                  autocomplete="off"
                  maxlength="120"
                  placeholder="Ex.: Sinop"
                  @input="limparCampo('municipio')"
                />
                <datalist id="municipios-sugeridos">
                  <option
                    v-for="municipio in municipios"
                    :key="municipio"
                    :value="municipio"
                  />
                </datalist>
                <div v-if="campos.municipio" class="invalid-feedback">
                  {{ campos.municipio }}
                </div>
              </div>

              <div>
                <label for="ocorrencia-estado" class="form-label">
                  Estado <span class="text-danger">*</span>
                </label>
                <select
                  id="ocorrencia-estado"
                  v-model="form.estado"
                  class="form-select"
                  :class="{ 'is-invalid': campos.estado }"
                  @change="limparCampo('estado')"
                >
                  <option value="" disabled>Selecione</option>
                  <option v-for="uf in UFS" :key="uf" :value="uf">{{ uf }}</option>
                </select>
                <div v-if="campos.estado" class="invalid-feedback">
                  {{ campos.estado }}
                </div>
              </div>

              <div>
                <label for="ocorrencia-data" class="form-label">
                  Data da ocorrência <span class="text-danger">*</span>
                </label>
                <input
                  id="ocorrencia-data"
                  v-model="form.data_ocorrencia"
                  type="date"
                  class="form-control"
                  :class="{ 'is-invalid': campos.data_ocorrencia }"
                  :max="hoje"
                  @input="limparCampo('data_ocorrencia')"
                />
                <div v-if="campos.data_ocorrencia" class="invalid-feedback">
                  {{ campos.data_ocorrencia }}
                </div>
              </div>
            </div>
          </div>

          <div class="form-section">
            <div class="form-section-header">
              <div>
                <h2 class="form-section-title">Descrição</h2>
                <p class="form-section-desc">
                  Detalhe o que foi observado, o contexto e as evidências.
                </p>
              </div>
              <span class="form-hint">{{ form.descricao.length }}/2000</span>
            </div>

            <label for="ocorrencia-descricao" class="form-label">
              Descrição <span class="text-danger">*</span>
            </label>
            <textarea
              id="ocorrencia-descricao"
              v-model="form.descricao"
              class="form-control"
              :class="{ 'is-invalid': campos.descricao }"
              rows="5"
              maxlength="2000"
              placeholder="Descreva o que foi observado, o local e demais detalhes relevantes."
              @input="limparCampo('descricao')"
            ></textarea>
            <div class="d-flex justify-content-between mt-1">
              <div v-if="campos.descricao" class="invalid-feedback d-block">
                {{ campos.descricao }}
              </div>
              <span v-else class="form-text">Entre 5 e 2000 caracteres.</span>
            </div>
          </div>

          <div class="form-section">
            <div class="form-section-header">
              <div>
                <h2 class="form-section-title">Coordenadas</h2>
                <p class="form-section-desc">
                  Opcional. Informe manualmente ou selecione o ponto no mapa.
                </p>
              </div>
            </div>

            <div class="form-check form-switch mb-3">
              <input
                id="informar-coordenadas"
                v-model="form.informarCoordenadas"
                class="form-check-input"
                type="checkbox"
                @change="alternarCoordenadas"
              />
              <label class="form-check-label" for="informar-coordenadas">
                Informar coordenadas
              </label>
            </div>

            <template v-if="form.informarCoordenadas">
              <div class="form-grid mb-3">
                <div>
                  <label for="ocorrencia-latitude" class="form-label">Latitude</label>
                  <input
                    id="ocorrencia-latitude"
                    v-model="form.latitude"
                    type="number"
                    step="any"
                    min="-90"
                    max="90"
                    class="form-control"
                    :class="{ 'is-invalid': campos.latitude }"
                    placeholder="Ex.: -11.8642"
                    @input="limparCampo('latitude')"
                  />
                  <div v-if="campos.latitude" class="invalid-feedback">
                    {{ campos.latitude }}
                  </div>
                </div>

                <div>
                  <label for="ocorrencia-longitude" class="form-label">Longitude</label>
                  <input
                    id="ocorrencia-longitude"
                    v-model="form.longitude"
                    type="number"
                    step="any"
                    min="-180"
                    max="180"
                    class="form-control"
                    :class="{ 'is-invalid': campos.longitude }"
                    placeholder="Ex.: -55.5025"
                    @input="limparCampo('longitude')"
                  />
                  <div v-if="campos.longitude" class="invalid-feedback">
                    {{ campos.longitude }}
                  </div>
                </div>
              </div>

              <MiniMapa
                :pontos="[]"
                :valor="coordenadaMapa"
                editavel
                altura="260px"
                rotulo="Prévia da localização da ocorrência"
                @clique="aoClicarMapa"
              />

              <p v-if="coordenadaMapa" class="form-hint mt-2 mb-0">
                Ponto selecionado: {{ formatarCoordenadas(coordenadaMapa[0], coordenadaMapa[1]) }}
              </p>
            </template>
          </div>

          <div class="form-section">
            <div class="form-section-header">
              <div>
                <h2 class="form-section-title">Anexos demonstrativos</h2>
                <p class="form-section-desc">
                  Prévia local. Os arquivos não são enviados nem gravados no backend.
                </p>
              </div>
              <span class="rascunho-chip">
                <i class="bi bi-eye" aria-hidden="true"></i>
                Visual
              </span>
            </div>

            <label class="dropzone d-block" for="ocorrencia-anexos">
              <i class="bi bi-cloud-arrow-up" aria-hidden="true"></i>
              <p class="mb-0">
                Selecionar imagens de apoio
                <span class="texto-3">· JPG, PNG ou WEBP</span>
              </p>
              <input
                id="ocorrencia-anexos"
                type="file"
                class="visually-hidden"
                accept="image/*"
                multiple
                @change="adicionarArquivos"
              />
            </label>

            <ul v-if="anexos.length" class="anexos-lista">
              <li v-for="anexo in anexos" :key="anexo.id" class="anexo-item">
                <i class="bi bi-image" aria-hidden="true"></i>
                <div class="anexo-info">
                  <p class="anexo-nome">{{ anexo.nome }}</p>
                  <p class="anexo-meta">{{ anexo.tamanho }}</p>
                </div>
                <span class="anexo-status-ok">Prévia local</span>
                <button
                  type="button"
                  class="anexo-remover"
                  aria-label="Remover anexo"
                  @click="removerAnexo(anexo.id)"
                >
                  <i class="bi bi-x-lg" aria-hidden="true"></i>
                </button>
              </li>
            </ul>

            <p v-else class="form-hint mb-0">
              Nenhum arquivo selecionado.
            </p>
          </div>

          <div class="form-actions">
            <span v-if="rascunhoSalvo" class="rascunho-chip me-auto">
              <i class="bi bi-save" aria-hidden="true"></i>
              Rascunho local salvo às {{ formatarHorario(rascunhoSalvo) }}
            </span>

            <button
              type="button"
              class="btn btn-outline-secondary"
              :disabled="carregando || !rascunhoSalvo"
              @click="descartarRascunho"
            >
              Descartar rascunho
            </button>
            <button type="submit" class="btn btn-primary" :disabled="carregando">
              <span
                v-if="carregando"
                class="spinner-border spinner-border-sm me-2"
                aria-hidden="true"
              ></span>
              <i v-else class="bi bi-check-lg me-2" aria-hidden="true"></i>
              {{ carregando ? 'Cadastrando...' : 'Cadastrar ocorrência' }}
            </button>
          </div>
        </form>
      </section>

      <aside class="stack">
        <div v-if="rascunhoRestaurado" class="alert alert-info d-flex align-items-start gap-2 mb-0" role="status">
          <i class="bi bi-clock-history mt-1" aria-hidden="true"></i>
          <span>Rascunho local restaurado automaticamente.</span>
        </div>

        <section class="panel">
          <div class="panel-header">
            <div>
              <h2 class="panel-title">Prévia do registro</h2>
              <p class="panel-subtitle">Resumo antes de enviar à API.</p>
            </div>
          </div>

          <div class="panel-body">
            <div class="contexto-badges">
              <span
                class="badge eco-badge"
                :style="{
                  color: form.tipo === 'queimada' ? '#FF8A4C' : '#4ADEC0',
                  borderColor:
                    form.tipo === 'queimada'
                      ? 'rgba(255, 138, 76, 0.4)'
                      : 'rgba(74, 222, 192, 0.4)',
                  backgroundColor:
                    form.tipo === 'queimada'
                      ? 'rgba(255, 138, 76, 0.1)'
                      : 'rgba(74, 222, 192, 0.1)',
                }"
              >
                <i
                  class="bi"
                  :class="form.tipo === 'queimada' ? 'bi-fire' : 'bi-tree'"
                  aria-hidden="true"
                ></i>
                {{ form.tipo === 'queimada' ? 'Queimada' : 'Desmatamento' }}
              </span>
            </div>

            <dl class="ficha">
              <div class="ficha-item">
                <dt>Local</dt>
                <dd>{{ resumoLocal }}</dd>
              </div>
              <div class="ficha-item">
                <dt>Data da ocorrência</dt>
                <dd>{{ formatarData(form.data_ocorrencia) }}</dd>
              </div>
              <div class="ficha-item">
                <dt>Coordenadas</dt>
                <dd class="mono-num">
                  {{
                    coordenadaMapa
                      ? formatarCoordenadas(coordenadaMapa[0], coordenadaMapa[1])
                      : 'Não informadas'
                  }}
                </dd>
              </div>
              <div class="ficha-item">
                <dt>Anexos de apoio</dt>
                <dd>{{ anexos.length }}</dd>
              </div>
            </dl>

            <p class="nota-demo mt-3">
              Severidade, status, área e bioma são derivados na apresentação e
              não fazem parte do contrato atual da API.
            </p>
          </div>
        </section>

        <section class="panel">
          <div class="panel-body">
            <h2 class="panel-title mb-3">Antes de salvar</h2>
            <ul class="report-notes">
              <li>
                <i class="bi bi-check2" aria-hidden="true"></i>
                A data da ocorrência não pode ser futura.
              </li>
              <li>
                <i class="bi bi-check2" aria-hidden="true"></i>
                O município deve ter entre 2 e 120 caracteres e a descrição
                entre 5 e 2000.
              </li>
              <li>
                <i class="bi bi-check2" aria-hidden="true"></i>
                As coordenadas são opcionais; quando informadas, a latitude
                deve estar entre -90 e 90 e a longitude entre -180 e 180.
              </li>
              <li>
                <i class="bi bi-check2" aria-hidden="true"></i>
                O responsável é definido automaticamente pelo seu login.
              </li>
            </ul>
          </div>
        </section>
      </aside>
    </div>
  </div>
</template>
