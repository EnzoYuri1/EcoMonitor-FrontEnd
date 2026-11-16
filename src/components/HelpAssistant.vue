<script setup>
import { computed, nextTick, ref } from 'vue'

const aberto = ref(false)
const pergunta = ref('')
const conversas = ref([])
const respostas = [
  {
    chaves: ['acesso', 'perfil', 'permiss', 'funcionário', 'administrador'],
    resposta:
      'O administrador gerencia todos os registros, faz a triagem, define prioridade, prazo e responsável, além de validar documentos. O funcionário registra ocorrências e só executa as tarefas atribuídas a ele.',
  },
  {
    chaves: ['registr', 'ocorrência', 'evidência', 'anex'],
    resposta:
      'Acesse Ocorrências > Nova ocorrência, preencha os dados e anexe ao menos uma evidência em PDF, JPG ou PNG (até 10 MB por arquivo). Depois de salvar, o registro fica disponível para a triagem do administrador.',
  },
  {
    chaves: ['triagem', 'prioridade', 'prazo', 'responsável', 'atribui'],
    resposta:
      'Na página de detalhes da ocorrência, o administrador define prioridade, prazo e funcionário responsável. É necessário anexar uma evidência inicial antes de iniciar a execução.',
  },
  {
    chaves: ['atividade', 'execução', 'tarefa'],
    resposta:
      'Durante a execução, o funcionário responsável pode registrar atividades, marcar cada tarefa como concluída e anexar evidências do trabalho realizado.',
  },
  {
    chaves: ['conclus', 'encerr', 'document', 'valida'],
    resposta:
      'Para pedir a conclusão, finalize todas as atividades, anexe um documento comprobatório e descreva a resolução. O administrador pode aprovar e encerrar ou devolver o caso com um comentário para ajustes.',
  },
  {
    chaves: ['relatório', 'relatorios', 'mapa', 'estatística'],
    resposta:
      'O mapa e a visão geral mostram os registros disponíveis para o seu perfil. Relatórios consolidados são acessíveis apenas ao perfil administrador.',
  },
  {
    chaves: ['arquivo', 'download', 'baixar', 'pdf', 'png', 'jpg'],
    resposta:
      'Os documentos aceitos são PDF, JPG e PNG, limitados a 10 MB cada. Os arquivos ficam vinculados à ocorrência e podem ser baixados por quem tem acesso ao registro.',
  },
]

const sugestoes = [
  'Como registro uma ocorrência?',
  'Como funciona a triagem?',
  'Como solicito a conclusão?',
]

const mensagens = computed(() => conversas.value)

async function perguntar(texto = pergunta.value) {
  const conteudo = texto.trim()
  if (!conteudo) return

  const normalizada = conteudo
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
  const encontrada = respostas.find((item) =>
    item.chaves.some((chave) =>
      normalizada.includes(
        chave.normalize('NFD').replace(/[\u0300-\u036f]/g, ''),
      ),
    ),
  )

  conversas.value.push({
    pergunta: conteudo,
    resposta:
      encontrada?.resposta ||
      'Ainda não encontrei essa informação na ajuda do EcoMonitor. Tente perguntar sobre acesso, registro, triagem, atividades, documentos ou conclusão.',
  })
  pergunta.value = ''
  await nextTick()
  const painel = document.querySelector('.help-assistant-messages')
  if (painel) painel.scrollTop = painel.scrollHeight
}
</script>

<template>
  <div class="help-assistant">
    <section
      v-if="aberto"
      class="help-assistant-panel"
      role="dialog"
      aria-label="Ajuda do EcoMonitor"
    >
      <header class="help-assistant-header">
        <div>
          <strong>Ajuda do EcoMonitor</strong>
          <small>Respostas locais sobre o sistema</small>
        </div>
        <button
          type="button"
          class="icon-btn"
          aria-label="Fechar ajuda"
          @click="aberto = false"
        >
          <i class="bi bi-x-lg" aria-hidden="true"></i>
        </button>
      </header>

      <p class="help-assistant-privacy">
        <i class="bi bi-shield-check me-1" aria-hidden="true"></i>
        Esta ajuda funciona no navegador; sua pergunta não é enviada a serviços externos.
      </p>

      <div class="help-assistant-messages" aria-live="polite">
        <div v-if="!mensagens.length" class="help-assistant-welcome">
          Olá! Posso ajudar você a usar os recursos do EcoMonitor.
        </div>
        <article
          v-for="(mensagem, indice) in mensagens"
          :key="`${indice}-${mensagem.pergunta}`"
          class="help-assistant-exchange"
        >
          <p class="help-assistant-question">{{ mensagem.pergunta }}</p>
          <p class="help-assistant-answer">{{ mensagem.resposta }}</p>
        </article>
        <div v-if="!mensagens.length" class="help-assistant-suggestions">
          <button
            v-for="sugestao in sugestoes"
            :key="sugestao"
            type="button"
            class="btn btn-sm btn-outline-secondary"
            @click="perguntar(sugestao)"
          >
            {{ sugestao }}
          </button>
        </div>
      </div>

      <form class="help-assistant-form" @submit.prevent="perguntar()">
        <input
          v-model="pergunta"
          class="form-control"
          maxlength="500"
          aria-label="Sua dúvida sobre o sistema"
          placeholder="Digite sua dúvida..."
        />
        <button
          type="submit"
          class="btn btn-primary"
          :disabled="!pergunta.trim()"
          aria-label="Enviar dúvida"
        >
          <i class="bi bi-send" aria-hidden="true"></i>
        </button>
      </form>
    </section>

    <button
      type="button"
      class="help-assistant-toggle"
      :aria-expanded="aberto"
      :aria-label="aberto ? 'Fechar ajuda do sistema' : 'Abrir ajuda do sistema'"
      @click="aberto = !aberto"
    >
      <i class="bi" :class="aberto ? 'bi-x-lg' : 'bi-chat-dots'" aria-hidden="true"></i>
      <span>{{ aberto ? 'Fechar ajuda' : 'Ajuda do sistema' }}</span>
    </button>
  </div>
</template>
