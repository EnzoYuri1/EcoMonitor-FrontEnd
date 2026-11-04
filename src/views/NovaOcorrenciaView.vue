<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { RouterLink } from 'vue-router'

import EmptyState from '@/components/EmptyState.vue'
import { criarOcorrencia } from '@/services/ocorrencias'
import { obterEstatisticas } from '@/services/stats'
import { TIPOS, UFS } from '@/utils/constants'
import { dataHojeISO } from '@/utils/format'

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

const mensagemSucesso = computed(() => {
  if (!sucesso.value) return ''

  return `A ocorrência #${sucesso.value.id} de ${sucesso.value.tipo} em ${sucesso.value.municipio}/${sucesso.value.estado} foi registrada com sucesso.`
})

onMounted(async () => {
  try {
    const dados = await obterEstatisticas()
    municipios.value = dados.por_municipio.map((item) => item.municipio)
  } catch {
    // As sugestões são opcionais; o cadastro continua disponível.
    municipios.value = []
  }
})

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
  erro.value = ''

  if (!validar()) return

  carregando.value = true

  try {
    sucesso.value = await criarOcorrencia(montarPayload())
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
  sucesso.value = null
  erro.value = ''
  campos.value = {}

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
</script>

<template>
  <div>
    <div class="mb-4">
      <RouterLink
        :to="{ name: 'ocorrencias' }"
        class="text-decoration-none small"
      >
        <i class="bi bi-arrow-left me-1" aria-hidden="true"></i>
        Voltar para ocorrências
      </RouterLink>
      <h2 class="h3 fw-bold mt-2 mb-1">Nova ocorrência</h2>
      <p class="text-secondary mb-0">
        Registre uma queimada ou desmatamento com os dados observados.
      </p>
    </div>

    <div v-if="sucesso" class="card">
      <div class="card-body">
        <EmptyState
          titulo="Ocorrência cadastrada"
          :descricao="mensagemSucesso"
          icone="bi-check2-circle"
        >
          <div class="d-flex flex-wrap justify-content-center gap-2">
            <RouterLink
              class="btn btn-primary"
              :to="{ name: 'ocorrencias' }"
            >
              <i class="bi bi-list-ul me-2" aria-hidden="true"></i>
              Ver ocorrências
            </RouterLink>
            <button
              type="button"
              class="btn btn-outline-primary"
              @click="cadastrarOutra"
            >
              <i class="bi bi-plus-circle me-2" aria-hidden="true"></i>
              Cadastrar outra
            </button>
          </div>
        </EmptyState>
      </div>
    </div>

    <div v-else class="row g-4">
      <div class="col-12 col-xl-8">
        <div class="card">
          <div class="card-body p-4">
            <div
              v-if="erro"
              class="alert alert-danger d-flex align-items-start gap-2 mensagem-erro"
              role="alert"
            >
              <i
                class="bi bi-exclamation-triangle mt-1"
                aria-hidden="true"
              ></i>
              <span>{{ erro }}</span>
            </div>

            <form novalidate @submit.prevent="salvar">
              <div class="mb-4">
                <span class="form-label d-block">
                  Tipo <span class="text-danger">*</span>
                </span>
                <div class="row g-2">
                  <div
                    v-for="tipo in TIPOS"
                    :key="tipo.value"
                    class="col-6"
                  >
                    <input
                      :id="`tipo-${tipo.value}`"
                      v-model="form.tipo"
                      type="radio"
                      class="btn-check"
                      :value="tipo.value"
                    />
                    <label
                      class="btn btn-outline-tipo w-100"
                      :class="`tipo-${tipo.value}`"
                      :for="`tipo-${tipo.value}`"
                    >
                      <span class="fs-4 d-block" aria-hidden="true">
                        {{ tipo.value === 'queimada' ? '🔥' : '🌳' }}
                      </span>
                      {{ tipo.label }}
                    </label>
                  </div>
                </div>
                <div v-if="campos.tipo" class="text-danger small mt-1">
                  {{ campos.tipo }}
                </div>
              </div>

              <div class="row g-3">
                <div class="col-12 col-md-8">
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

                <div class="col-12 col-md-4">
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
                    <option
                      v-for="uf in UFS"
                      :key="uf"
                      :value="uf"
                    >
                      {{ uf }}
                    </option>
                  </select>
                  <div v-if="campos.estado" class="invalid-feedback">
                    {{ campos.estado }}
                  </div>
                </div>

                <div class="col-12 col-md-4">
                  <label for="ocorrencia-data" class="form-label">
                    Data da ocorrência
                    <span class="text-danger">*</span>
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
                  <div
                    v-if="campos.data_ocorrencia"
                    class="invalid-feedback"
                  >
                    {{ campos.data_ocorrencia }}
                  </div>
                </div>

                <div class="col-12">
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
                    <div
                      v-if="campos.descricao"
                      class="invalid-feedback d-block"
                    >
                      {{ campos.descricao }}
                    </div>
                    <span v-else class="form-text">
                      Entre 5 e 2000 caracteres.
                    </span>
                    <span class="form-text">
                      {{ form.descricao.length }}/2000
                    </span>
                  </div>
                </div>
              </div>

              <hr class="my-4" />

              <div class="form-check form-switch mb-3">
                <input
                  id="informar-coordenadas"
                  v-model="form.informarCoordenadas"
                  class="form-check-input"
                  type="checkbox"
                  @change="alternarCoordenadas"
                />
                <label
                  class="form-check-label"
                  for="informar-coordenadas"
                >
                  Informar coordenadas (opcional)
                </label>
              </div>

              <div
                v-if="form.informarCoordenadas"
                class="row g-3"
              >
                <div class="col-12 col-sm-6">
                  <label for="ocorrencia-latitude" class="form-label">
                    Latitude
                  </label>
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

                <div class="col-12 col-sm-6">
                  <label for="ocorrencia-longitude" class="form-label">
                    Longitude
                  </label>
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

              <div
                class="d-flex flex-wrap justify-content-end gap-2 mt-4"
              >
                <RouterLink
                  class="btn btn-outline-secondary"
                  :to="{ name: 'ocorrencias' }"
                >
                  Cancelar
                </RouterLink>
                <button
                  type="submit"
                  class="btn btn-primary"
                  :disabled="carregando"
                >
                  <span
                    v-if="carregando"
                    class="spinner-border spinner-border-sm me-2"
                    aria-hidden="true"
                  ></span>
                  <i
                    v-else
                    class="bi bi-check-lg me-2"
                    aria-hidden="true"
                  ></i>
                  {{ carregando ? 'Cadastrando...' : 'Cadastrar ocorrência' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <div class="col-12 col-xl-4">
        <div class="card bg-eco-light border-0">
          <div class="card-body p-4">
            <h3 class="h6 mb-3">
              <i class="bi bi-lightbulb me-2" aria-hidden="true"></i>
              Antes de salvar
            </h3>
            <ul class="small text-secondary ps-3 mb-0 d-grid gap-2">
              <li>A data da ocorrência não pode ser futura.</li>
              <li>
                O município deve ter entre 2 e 120 caracteres e a descrição
                entre 5 e 2000.
              </li>
              <li>
                As coordenadas são opcionais; quando informadas, a latitude
                deve estar entre -90 e 90 e a longitude entre -180 e 180.
              </li>
              <li>
                O responsável pela ocorrência é definido automaticamente
                pelo seu login.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
