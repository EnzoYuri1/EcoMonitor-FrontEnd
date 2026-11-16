<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'

import EmptyState from '@/components/EmptyState.vue'
import MiniMapa from '@/components/MiniMapa.vue'
import PageHeader from '@/components/PageHeader.vue'
import SeverityBadge from '@/components/SeverityBadge.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import TipoBadge from '@/components/TipoBadge.vue'
import { listarUsuarios } from '@/services/auth'
import {
  atualizarAtividade,
  baixarEvidencia,
  criarAtividade,
  enviarEvidencia,
  obterOcorrencia,
  solicitarConclusao,
  triarOcorrencia,
  validarConclusao,
} from '@/services/ocorrencias'
import { useAuthStore } from '@/stores/auth'
import { useDemoStore } from '@/stores/demo'
import { CATEGORIAS_EVIDENCIA, PRIORIDADES } from '@/utils/constants'
import {
  formatarAreaComUnidade,
  formatarData,
  formatarDataHora,
  formatarDataHoraLonga,
  formatarNumero,
  formatarHorario,
} from '@/utils/format'
import { formatarCoordenadas } from '@/utils/map'

const route = useRoute()
const auth = useAuthStore()
const demo = useDemoStore()

const registro = ref(null)
const carregando = ref(true)
const erro = ref('')
const erroAcao = ref('')
const sucessoAcao = ref('')
const usuarios = ref([])
const salvando = ref(false)
const triagem = reactive({
  prioridade: 'media',
  prazo: '',
  responsavel_id: '',
})
const novaAtividade = reactive({ titulo: '', descricao: '' })
const resolucao = ref('')
const comentarioValidacao = ref('')

const ocorrencia = computed(() => {
  if (!registro.value) return null
  return demo.enriquecer(registro.value)
})
const ehAdmin = computed(() => auth.user?.perfil === 'administrador')
const podeExecutar = computed(
  () =>
    ehAdmin.value ||
    Number(ocorrencia.value?.responsavel_id) === Number(auth.userId),
)
const podeEnviarInicial = computed(
  () =>
    ocorrencia.value?.status === 'registrada' &&
    Number(ocorrencia.value?.created_by) === Number(auth.userId),
)
const podeEditarCadastro = computed(
  () =>
    ehAdmin.value ||
    (podeEnviarInicial.value &&
      Number(ocorrencia.value?.created_by) === Number(auth.userId)),
)
const podeTriar = computed(
  () =>
    ehAdmin.value &&
    ['registrada', 'em_execucao'].includes(ocorrencia.value?.status),
)
const nomeResponsavel = computed(() => {
  const id = ocorrencia.value?.responsavel_id
  if (!id) return 'Não atribuído'
  if (Number(id) === Number(auth.userId)) return 'Você'
  return usuarios.value.find((usuario) => usuario.id === id)?.nome ||
    `Funcionário #${id}`
})
const prioridadeRotulo = computed(
  () =>
    PRIORIDADES.find(
      (item) => item.value === ocorrencia.value?.prioridade,
    )?.label || ocorrencia.value?.prioridade || '—',
)

const temCoordenadas = computed(() => {
  const item = ocorrencia.value
  if (!item) return false

  return (
    item.latitude !== null &&
    item.latitude !== undefined &&
    item.latitude !== '' &&
    item.longitude !== null &&
    item.longitude !== undefined &&
    item.longitude !== ''
  )
})

const pontosMapa = computed(() =>
  ocorrencia.value && temCoordenadas.value ? [ocorrencia.value] : [],
)

const valorMapa = computed(() => {
  if (!temCoordenadas.value) return null
  return [Number(ocorrencia.value.latitude), Number(ocorrencia.value.longitude)]
})

const responsavel = computed(() => nomeResponsavel.value)

const descricao = computed(
  () => ocorrencia.value?.descricao || 'Sem descrição registrada.',
)

function formatarTamanho(bytes) {
  const tamanho = Number(bytes) || 0
  if (tamanho < 1024) return `${tamanho} B`
  if (tamanho < 1024 * 1024) return `${(tamanho / 1024).toFixed(0)} KB`
  return `${(tamanho / (1024 * 1024)).toFixed(1)} MB`
}

async function carregar() {
  carregando.value = true
  erro.value = ''

  try {
    registro.value = await obterOcorrencia(route.params.id)
    if (ehAdmin.value) {
      try {
        usuarios.value = (await listarUsuarios()).filter(
          (usuario) => usuario.perfil === 'funcionario',
        )
      } catch (error) {
        erroAcao.value =
          error?.message || 'Não foi possível carregar a lista de funcionários.'
      }
    }
    Object.assign(triagem, {
      prioridade: registro.value.prioridade || 'media',
      prazo: registro.value.prazo || '',
      responsavel_id: registro.value.responsavel_id || '',
    })
  } catch (error) {
    registro.value = null
    erro.value =
      error?.statusCode === 404
        ? 'A ocorrência informada não existe ou foi removida.'
        : error?.message || 'Não foi possível carregar a ocorrência.'
  } finally {
    carregando.value = false
  }
}

async function executarAcao(acao, mensagem) {
  erroAcao.value = ''
  sucessoAcao.value = ''
  salvando.value = true
  try {
    await acao()
    sucessoAcao.value = mensagem
    await carregar()
  } catch (error) {
    erroAcao.value = error?.message || 'Não foi possível concluir a ação.'
  } finally {
    salvando.value = false
  }
}

function salvarTriagem() {
  return executarAcao(
    () =>
      triarOcorrencia(ocorrencia.value.id, {
        ...triagem,
        responsavel_id: Number(triagem.responsavel_id),
      }),
    'Triagem salva e responsável atribuído.',
  )
}

function adicionarAtividade() {
  if (!novaAtividade.titulo.trim()) return
  return executarAcao(async () => {
    await criarAtividade(ocorrencia.value.id, {
      titulo: novaAtividade.titulo,
      descricao: novaAtividade.descricao || null,
    })
    novaAtividade.titulo = ''
    novaAtividade.descricao = ''
  }, 'Atividade registrada.')
}

function alterarAtividade(atividade) {
  return executarAcao(
    () =>
      atualizarAtividade(ocorrencia.value.id, atividade.id, {
        concluida: !atividade.concluida,
      }),
    atividade.concluida
      ? 'Atividade reaberta.'
      : 'Atividade concluída.',
  )
}

async function enviarArquivos(evento, categoria) {
  const arquivos = Array.from(evento.target.files || [])
  evento.target.value = ''
  if (!arquivos.length) return

  erroAcao.value = ''
  sucessoAcao.value = ''
  salvando.value = true
  try {
    for (const arquivo of arquivos) {
      await enviarEvidencia(ocorrencia.value.id, categoria, arquivo)
    }
    sucessoAcao.value = 'Documento(s) anexado(s) com sucesso.'
    await carregar()
  } catch (error) {
    erroAcao.value = error?.message || 'Não foi possível enviar o documento.'
    await carregar()
  } finally {
    salvando.value = false
  }
}

function pedirConclusao() {
  return executarAcao(
    () => solicitarConclusao(ocorrencia.value.id, resolucao.value),
    'Solicitação enviada para validação documental.',
  )
}

function validar(aprovado) {
  return executarAcao(
    () =>
      validarConclusao(
        ocorrencia.value.id,
        aprovado,
        comentarioValidacao.value,
      ),
    aprovado
      ? 'Documentação aprovada; ocorrência concluída.'
      : 'Ocorrência devolvida ao responsável para ajustes.',
  )
}

async function baixar(arquivo) {
  erroAcao.value = ''
  try {
    const blob = await baixarEvidencia(ocorrencia.value.id, arquivo.id)
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = arquivo.nome_arquivo
    link.click()
    URL.revokeObjectURL(url)
  } catch (error) {
    erroAcao.value = error?.message || 'Não foi possível baixar o arquivo.'
  }
}

onMounted(carregar)
</script>

<template>
  <div>
    <RouterLink
      :to="{ name: 'ocorrencias' }"
      class="d-inline-flex align-items-center gap-1 mb-3 texto-3 small"
    >
      <i class="bi bi-arrow-left" aria-hidden="true"></i>
      Voltar para ocorrências
    </RouterLink>

    <div v-if="carregando" class="panel">
      <div class="panel-body">
        <div class="skeleton skeleton-linha" style="width: 32%"></div>
        <div class="skeleton skeleton-bloco mt-3"></div>
        <div class="skeleton skeleton-linha mt-3" style="width: 70%"></div>
        <div class="skeleton skeleton-linha" style="width: 55%"></div>
      </div>
    </div>

    <div v-else-if="erro" class="panel">
      <div class="panel-body">
        <EmptyState
          titulo="Ocorrência indisponível"
          :descricao="erro"
          icone="bi-exclamation-circle"
        >
          <RouterLink class="btn btn-primary" :to="{ name: 'ocorrencias' }">
            <i class="bi bi-list-check me-2" aria-hidden="true"></i>
            Ver lista de ocorrências
          </RouterLink>
        </EmptyState>
      </div>
    </div>

    <template v-else-if="ocorrencia">
      <PageHeader
        eyebrow="Detalhe da ocorrência"
        :titulo="ocorrencia.codigo"
        :descricao="`${ocorrencia.municipio} · ${ocorrencia.estado}`"
      >
        <template #acoes>
          <RouterLink
            class="btn btn-outline-secondary"
            :to="{ name: 'mapa', query: { id: ocorrencia.id } }"
          >
            <i class="bi bi-geo-alt me-2" aria-hidden="true"></i>
            Ver no mapa
          </RouterLink>
          <RouterLink
            v-if="podeEditarCadastro"
            class="btn btn-primary"
            :to="{ name: 'ocorrencias', query: { editar: ocorrencia.id } }"
          >
            <i class="bi bi-pencil me-2" aria-hidden="true"></i>
            Editar registro
          </RouterLink>
        </template>
      </PageHeader>

      <div v-if="erroAcao" class="alert alert-danger" role="alert">
        <i class="bi bi-exclamation-triangle me-2" aria-hidden="true"></i>
        {{ erroAcao }}
      </div>
      <div v-if="sucessoAcao" class="alert alert-success" role="status">
        <i class="bi bi-check-circle me-2" aria-hidden="true"></i>
        {{ sucessoAcao }}
      </div>

      <div class="detail-layout">
        <div class="stack">
          <section class="panel">
            <div class="detail-section">
              <div class="detail-meta">
                <TipoBadge :tipo="ocorrencia.tipo" />
                <span class="detail-meta-item">
                  <i class="bi bi-calendar3" aria-hidden="true"></i>
                  {{ formatarData(ocorrencia.data_ocorrencia) }}
                </span>
                <span class="detail-meta-item">
                  <i class="bi bi-geo-alt" aria-hidden="true"></i>
                  {{ ocorrencia.municipio }}/{{ ocorrencia.estado }}
                </span>
                <span class="detail-meta-item">
                  <i class="bi bi-person" aria-hidden="true"></i>
                  {{ responsavel }}
                </span>
              </div>

              <h2 class="detail-title mt-4">Descrição do registro</h2>
              <p class="detail-texto">{{ descricao }}</p>

              <p class="nota-demo mt-3 mb-0">
                Severidade, bioma e área estimada são indicadores visuais
                demonstrativos. Status, documentos e histórico são persistidos.
              </p>
            </div>

            <div class="detail-section">
              <div class="panel-header px-0 pt-0">
                <div>
                  <h2 class="panel-title">Localização</h2>
                  <p class="panel-subtitle">
                    Coordenadas registradas para esta ocorrência.
                  </p>
                </div>
                <span v-if="temCoordenadas" class="mono-num texto-3 small">
                  {{ formatarCoordenadas(valorMapa[0], valorMapa[1]) }}
                </span>
              </div>

              <MiniMapa
                v-if="temCoordenadas"
                :pontos="pontosMapa"
                :valor="valorMapa"
                :interativo="false"
                altura="300px"
                mostrar-legenda
                rotulo="Mapa da ocorrência"
              />

              <p v-else class="texto-3 mb-0">
                <i class="bi bi-geo-alt me-1" aria-hidden="true"></i>
                Esta ocorrência não possui coordenadas válidas registradas.
              </p>
            </div>

            <div class="detail-section">
              <div class="evidencias-header">
                <div>
                  <h2 class="panel-title">Evidências</h2>
                  <p>Documentos anexados à ocorrência (PDF, JPG ou PNG).</p>
                </div>
                <span class="rascunho-chip">
                  <i class="bi bi-paperclip" aria-hidden="true"></i>
                  {{ ocorrencia.evidencias.length }} arquivo(s)
                </span>
              </div>

              <div v-if="ocorrencia.evidencias.length" class="evidencias-grid">
                <article
                  v-for="anexo in ocorrencia.evidencias"
                  :key="anexo.id"
                  class="evidencia-card"
                >
                  <div class="evidencia-thumb" aria-hidden="true">
                    <i
                      class="bi"
                      :class="anexo.tipo_mime === 'application/pdf' ? 'bi-file-earmark-pdf' : 'bi-image'"
                    ></i>
                  </div>
                  <p class="evidencia-titulo">
                    {{ CATEGORIAS_EVIDENCIA[anexo.categoria] }}
                  </p>
                  <p class="evidencia-arquivo">
                    {{ anexo.nome_arquivo }} · {{ formatarTamanho(anexo.tamanho) }}
                  </p>
                  <button
                    type="button"
                    class="btn btn-sm btn-outline-secondary"
                    @click="baixar(anexo)"
                  >
                    <i class="bi bi-download me-1" aria-hidden="true"></i>
                    Baixar
                  </button>
                </article>
              </div>
              <p v-else class="texto-3 mb-0">
                Nenhum documento foi anexado ainda.
              </p>

              <div v-if="podeEnviarInicial" class="mt-3">
                <label for="evidencia-inicial" class="form-label">
                  Adicionar evidência inicial
                </label>
                <input
                  id="evidencia-inicial"
                  class="form-control"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                  multiple
                  :disabled="salvando"
                  @change="enviarArquivos($event, 'inicial')"
                />
                <p class="form-text">Até 10 MB por arquivo.</p>
              </div>

              <div
                v-if="podeExecutar && ocorrencia.status === 'em_execucao'"
                class="form-grid mt-3"
              >
                <div>
                  <label for="evidencia-execucao" class="form-label">
                    Evidências da execução
                  </label>
                  <input
                    id="evidencia-execucao"
                    class="form-control"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                    multiple
                    :disabled="salvando"
                    @change="enviarArquivos($event, 'execucao')"
                  />
                </div>
                <div>
                  <label for="documento-conclusao" class="form-label">
                    Documentos comprobatórios de conclusão
                  </label>
                  <input
                    id="documento-conclusao"
                    class="form-control"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                    multiple
                    :disabled="salvando"
                    @change="enviarArquivos($event, 'conclusao')"
                  />
                </div>
              </div>
            </div>

            <div class="detail-section">
              <div class="evidencias-header">
                <div>
                  <h2 class="panel-title">Atividades</h2>
                  <p>Tarefas registradas durante a execução.</p>
                </div>
              </div>

              <ul v-if="ocorrencia.atividades.length" class="list-group mb-3">
                <li
                  v-for="atividade in ocorrencia.atividades"
                  :key="atividade.id"
                  class="list-group-item d-flex align-items-start gap-2"
                >
                  <input
                    class="form-check-input mt-1"
                    type="checkbox"
                    :checked="atividade.concluida"
                    :disabled="!podeExecutar || ocorrencia.status !== 'em_execucao' || salvando"
                    :aria-label="`Concluir atividade ${atividade.titulo}`"
                    @change="alterarAtividade(atividade)"
                  />
                  <span class="flex-grow-1">
                    <strong :class="{ 'text-decoration-line-through': atividade.concluida }">
                      {{ atividade.titulo }}
                    </strong>
                    <small v-if="atividade.descricao" class="d-block texto-3">
                      {{ atividade.descricao }}
                    </small>
                  </span>
                  <small class="texto-3">{{ formatarDataHora(atividade.created_at) }}</small>
                </li>
              </ul>
              <p v-else class="texto-3 mb-0">Nenhuma atividade registrada.</p>
            </div>

            <div class="detail-section">
              <h2 class="panel-title mb-3">Histórico</h2>

              <ul v-if="ocorrencia.historico.length" class="timeline">
                <li
                  v-for="(evento, indice) in ocorrencia.historico"
                  :key="`${evento.data}-${indice}`"
                  class="timeline-item"
                >
                  <span class="timeline-hora">
                    {{ formatarDataHoraLonga(evento.data) }}
                  </span>
                  <p class="timeline-titulo">{{ evento.titulo }}</p>
                  <p class="timeline-desc">{{ evento.descricao }}</p>
                </li>
              </ul>

              <p v-else class="texto-3 mb-0">
                Nenhum evento registrado.
              </p>
            </div>
          </section>
        </div>

        <aside class="stack">
          <section class="panel">
            <div class="panel-header">
              <div>
                <h2 class="panel-title">Ficha do registro</h2>
                <p class="panel-subtitle">Dados registrados e andamento.</p>
              </div>
            </div>

            <div class="panel-body">
              <div class="contexto-badges">
                <StatusBadge :status="ocorrencia.status" />
                <SeverityBadge :severidade="ocorrencia.severidade" />
              </div>

              <dl class="ficha">
                <div class="ficha-item">
                  <dt>Código</dt>
                  <dd class="mono-num">{{ ocorrencia.codigo }}</dd>
                </div>
                <div class="ficha-item">
                  <dt>Tipo</dt>
                  <dd>{{ ocorrencia.tipo === 'queimada' ? 'Queimada' : 'Desmatamento' }}</dd>
                </div>
                <div class="ficha-item">
                  <dt>Data da ocorrência</dt>
                  <dd>{{ formatarData(ocorrencia.data_ocorrencia) }}</dd>
                </div>
                <div class="ficha-item">
                  <dt>Município / UF</dt>
                  <dd>{{ ocorrencia.municipio }} / {{ ocorrencia.estado }}</dd>
                </div>
                <div class="ficha-item">
                  <dt>Bioma</dt>
                  <dd>{{ ocorrencia.bioma }}</dd>
                </div>
                <div class="ficha-item">
                  <dt>Área estimada</dt>
                  <dd>{{ formatarAreaComUnidade(ocorrencia.area_estimada) }}</dd>
                </div>
                <div class="ficha-item">
                  <dt>Coordenadas</dt>
                  <dd class="mono-num">
                    {{
                      temCoordenadas
                        ? formatarCoordenadas(valorMapa[0], valorMapa[1])
                        : 'Não informadas'
                    }}
                  </dd>
                </div>
                <div class="ficha-item">
                  <dt>Responsável</dt>
                  <dd>{{ responsavel }}</dd>
                </div>
                <div class="ficha-item">
                  <dt>Prioridade</dt>
                  <dd>{{ prioridadeRotulo }}</dd>
                </div>
                <div class="ficha-item">
                  <dt>Prazo</dt>
                  <dd>{{ formatarData(ocorrencia.prazo) }}</dd>
                </div>
                <div class="ficha-item">
                  <dt>Registrada em</dt>
                  <dd>{{ formatarDataHora(ocorrencia.created_at) }}</dd>
                </div>
              </dl>

              <div v-if="ocorrencia.resolucao" class="mt-3">
                <strong>Resolução apresentada</strong>
                <p class="texto-3 mb-2">{{ ocorrencia.resolucao }}</p>
              </div>
              <div
                v-if="ocorrencia.observacao_validacao"
                class="alert alert-warning mt-3 mb-0"
              >
                <strong>Observação da validação</strong>
                <p class="mb-0">{{ ocorrencia.observacao_validacao }}</p>
              </div>
            </div>
          </section>

          <section v-if="podeTriar" class="panel">
            <div class="panel-header">
              <div>
                <h2 class="panel-title">Triagem e atribuição</h2>
                <p class="panel-subtitle">
                  Defina prioridade, prazo e funcionário responsável.
                </p>
              </div>
            </div>
            <div class="panel-body">
              <div class="mb-3">
                <label for="triagem-prioridade" class="form-label">Prioridade</label>
                <select id="triagem-prioridade" v-model="triagem.prioridade" class="form-select">
                  <option v-for="item in PRIORIDADES" :key="item.value" :value="item.value">
                    {{ item.label }}
                  </option>
                </select>
              </div>
              <div class="mb-3">
                <label for="triagem-prazo" class="form-label">Prazo</label>
                <input id="triagem-prazo" v-model="triagem.prazo" class="form-control" type="date" />
              </div>
              <div class="mb-3">
                <label for="triagem-responsavel" class="form-label">Responsável</label>
                <select id="triagem-responsavel" v-model="triagem.responsavel_id" class="form-select">
                  <option value="" disabled>Selecione um funcionário</option>
                  <option v-for="usuario in usuarios" :key="usuario.id" :value="usuario.id">
                    {{ usuario.nome }} · {{ usuario.email }}
                  </option>
                </select>
              </div>
              <button
                type="button"
                class="btn btn-primary w-100"
                :disabled="salvando || !triagem.prazo || !triagem.responsavel_id"
                @click="salvarTriagem"
              >
                <i class="bi bi-person-check me-2" aria-hidden="true"></i>
                Salvar triagem
              </button>
            </div>
          </section>

          <section
            v-if="podeExecutar && ocorrencia.status === 'em_execucao'"
            class="panel"
          >
            <div class="panel-header">
              <div>
                <h2 class="panel-title">Execução e conclusão</h2>
                <p class="panel-subtitle">
                  Registre atividades, evidências e a resolução.
                </p>
              </div>
            </div>
            <div class="panel-body">
              <form class="stack" @submit.prevent="adicionarAtividade">
                <div>
                  <label for="atividade-titulo" class="form-label">Nova atividade</label>
                  <input
                    id="atividade-titulo"
                    v-model="novaAtividade.titulo"
                    class="form-control"
                    maxlength="160"
                    minlength="3"
                    required
                    placeholder="Ex.: Inspecionar perímetro"
                  />
                </div>
                <textarea
                  v-model="novaAtividade.descricao"
                  class="form-control"
                  maxlength="1000"
                  rows="2"
                  placeholder="Descrição opcional"
                  aria-label="Descrição da atividade"
                ></textarea>
                <button class="btn btn-outline-primary" type="submit" :disabled="salvando">
                  Adicionar atividade
                </button>
              </form>

              <hr />

              <form class="stack" @submit.prevent="pedirConclusao">
                <label for="resolucao-ocorrencia" class="form-label">
                  Solicitar conclusão
                </label>
                <textarea
                  id="resolucao-ocorrencia"
                  v-model="resolucao"
                  class="form-control"
                  minlength="10"
                  maxlength="4000"
                  rows="4"
                  required
                  placeholder="Descreva as ações realizadas e a resolução."
                ></textarea>
                <p class="form-text">
                  Anexe pelo menos um documento comprobatório acima antes de enviar.
                </p>
                <button class="btn btn-primary" type="submit" :disabled="salvando">
                  Enviar para validação
                </button>
              </form>
            </div>
          </section>

          <section
            v-if="ocorrencia.status === 'em_validacao' && ehAdmin"
            class="panel"
          >
            <div class="panel-header">
              <div>
                <h2 class="panel-title">Validação documental</h2>
                <p class="panel-subtitle">
                  Confira a resolução e os documentos anexados.
                </p>
              </div>
            </div>
            <div class="panel-body">
              <label for="comentario-validacao" class="form-label">
                Comentário (obrigatório para devolver)
              </label>
              <textarea
                id="comentario-validacao"
                v-model="comentarioValidacao"
                class="form-control mb-3"
                maxlength="2000"
                rows="3"
              ></textarea>
              <div class="d-flex flex-wrap gap-2">
                <button
                  type="button"
                  class="btn btn-outline-danger"
                  :disabled="salvando || !comentarioValidacao.trim()"
                  @click="validar(false)"
                >
                  Devolver para ajustes
                </button>
                <button
                  type="button"
                  class="btn btn-primary"
                  :disabled="salvando"
                  @click="validar(true)"
                >
                  Aprovar e encerrar
                </button>
              </div>
            </div>
          </section>

          <section
            v-else-if="ocorrencia.status === 'em_validacao'"
            class="panel"
          >
            <div class="panel-body">
              <h2 class="panel-title">Aguardando validação documental</h2>
              <p class="texto-3 mb-0">
                A conclusão e os documentos foram enviados para conferência do administrador.
              </p>
            </div>
          </section>

          <section v-if="ocorrencia.status === 'concluida'" class="panel">
            <div class="panel-body">
              <h2 class="panel-title">Ocorrência oficialmente concluída</h2>
              <p class="texto-3 mb-0">
                A documentação foi aprovada pelo administrador.
              </p>
            </div>
          </section>

          <section class="panel">
            <div class="panel-body">
              <div class="responsavel-card">
                <span class="avatar" aria-hidden="true">
                  {{ (auth.nomeUsuario || 'Equipe').slice(0, 2).toUpperCase() }}
                </span>
                <div>
                  <p>{{ auth.nomeUsuario || 'Equipe de monitoramento' }}</p>
                  <small>
                    {{ auth.user?.perfil === 'administrador' ? 'Administrador' : 'Funcionário' }}
                  </small>
                </div>
              </div>

              <p class="nota-demo mt-3">
                Última leitura do registro às
                {{ formatarHorario(ocorrencia.created_at) }}.
              </p>
            </div>
          </section>
        </aside>
      </div>
    </template>
  </div>
</template>
