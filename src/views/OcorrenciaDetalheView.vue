<script setup>
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'

import EmptyState from '@/components/EmptyState.vue'
import MiniMapa from '@/components/MiniMapa.vue'
import PageHeader from '@/components/PageHeader.vue'
import SeverityBadge from '@/components/SeverityBadge.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import TipoBadge from '@/components/TipoBadge.vue'
import { obterOcorrencia } from '@/services/ocorrencias'
import { useAuthStore } from '@/stores/auth'
import { useDemoStore } from '@/stores/demo'
import { STATUS } from '@/utils/constants'
import {
  formatarAreaComUnidade,
  formatarData,
  formatarDataHora,
  formatarDataHoraLonga,
  formatarHorario,
} from '@/utils/format'
import { formatarCoordenadas } from '@/utils/map'

const route = useRoute()
const auth = useAuthStore()
const demo = useDemoStore()

const registro = ref(null)
const carregando = ref(true)
const erro = ref('')

const ocorrencia = computed(() => {
  if (!registro.value) return null
  return demo.enriquecer(
    registro.value,
    auth.nomeUsuario || 'Equipe de monitoramento',
  )
})

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

const responsavel = computed(() =>
  Number(ocorrencia.value?.created_by) === Number(auth.userId)
    ? 'Você'
    : 'Outro usuário',
)

const descricao = computed(
  () => ocorrencia.value?.descricao || 'Sem descrição registrada.',
)

async function carregar() {
  carregando.value = true
  erro.value = ''

  try {
    registro.value = await obterOcorrencia(route.params.id)
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

function alterarStatus(evento) {
  if (!ocorrencia.value) return

  demo.atualizarStatus(
    ocorrencia.value.id,
    evento.target.value,
    auth.nomeUsuario || 'Equipe de monitoramento',
  )
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
            v-if="Number(ocorrencia.created_by) === Number(auth.userId)"
            class="btn btn-primary"
            :to="{ name: 'ocorrencias', query: { editar: ocorrencia.id } }"
          >
            <i class="bi bi-pencil me-2" aria-hidden="true"></i>
            Editar registro
          </RouterLink>
        </template>
      </PageHeader>

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

              <div class="aviso-box" role="note">
                <i class="bi bi-info-circle" aria-hidden="true"></i>
                <span>
                  Severidade, status, área, bioma, anexos e histórico são
                  metadados demonstrativos derivados do registro. Não são
                  enviados nem gravados no backend do EcoMonitor.
                </span>
              </div>
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
                  <p>Arquivos demonstrativos, sem vínculo com o backend.</p>
                </div>
                <span class="rascunho-chip">
                  <i class="bi bi-eye" aria-hidden="true"></i>
                  Prévia
                </span>
              </div>

              <div class="evidencias-grid">
                <article
                  v-for="anexo in ocorrencia.anexos"
                  :key="anexo.id"
                  class="evidencia-card"
                >
                  <div class="evidencia-thumb" aria-hidden="true">
                    <i class="bi bi-image"></i>
                  </div>
                  <p class="evidencia-titulo">{{ anexo.titulo }}</p>
                  <p class="evidencia-arquivo">
                    {{ anexo.nome }} · {{ anexo.tamanho }}
                  </p>
                </article>
              </div>
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
                Nenhum evento demonstrativo disponível.
              </p>
            </div>
          </section>
        </div>

        <aside class="stack">
          <section class="panel">
            <div class="panel-header">
              <div>
                <h2 class="panel-title">Ficha do registro</h2>
                <p class="panel-subtitle">Dados da API e metadados visuais.</p>
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
                  <dt>Registrada em</dt>
                  <dd>{{ formatarDataHora(ocorrencia.created_at) }}</dd>
                </div>
              </dl>

              <hr />

              <label class="form-label" for="detalhe-status">
                Status demonstrativo
              </label>
              <select
                id="detalhe-status"
                class="form-select"
                :value="ocorrencia.status"
                @change="alterarStatus"
              >
                <option
                  v-for="opcao in STATUS"
                  :key="opcao.value"
                  :value="opcao.value"
                >
                  {{ opcao.label }}
                </option>
              </select>
              <p class="nota-demo mt-3">
                A alteração de status fica apenas neste navegador. Nenhuma
                requisição é enviada ao backend.
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
                  <small>Analista responsável pela sessão</small>
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
