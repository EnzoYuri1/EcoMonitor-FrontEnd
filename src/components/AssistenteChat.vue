<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import {
  Bot,
  MessageCircle,
  RotateCcw,
  Send,
  Sparkles,
  X,
} from 'lucide-vue-next'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Textarea } from '@/components/ui/textarea'
import { LIMITE_MENSAGEM, perguntarAssistente } from '@/services/assistente'
import {
  carregarHistoricoAssistente,
  limparHistoricoAssistente,
  salvarHistoricoAssistente,
} from '@/utils/assistente'

const SUGESTOES = [
  'O que este site faz?',
  'Como cadastro uma ocorrência?',
  'Qual a diferença entre queimada e desmatamento?',
  'Quais regras devo respeitar nos campos?',
  'Como interpretar as estatísticas do dashboard?',
  'Por que só eu posso editar minhas ocorrências?',
]

const aberto = ref(false)
const enviando = ref(false)
const pergunta = ref('')
const listaScroll = ref(null)
const campoEntrada = ref(null)

let proximoId = 1
const criarMensagem = (role, content) => ({
  id: proximoId + 1,
  role,
  content,
})

const mensagens = ref(
  carregarHistoricoAssistente().map((item) => criarMensagem(item.role, item.content)),
)
proximoId += mensagens.value.length

const contadorCaracteres = computed(() => pergunta.value.length)
const semMensagens = computed(() => !enviando.value && mensagens.value.length === 0)

async function rolarAoFim() {
  await nextTick()
  const lista = listaScroll.value
  if (lista) {
    lista.scrollTop = lista.scrollHeight
  }
}

function abrir() {
  aberto.value = true
  nextTick(() => campoEntrada.value?.focus())
}

function fechar() {
  aberto.value = false
}

async function enviar(textoOriginal) {
  const texto = String(textoOriginal ?? pergunta.value ?? '')
    .trim()
    .slice(0, LIMITE_MENSAGEM)

  if (!texto || enviando.value) return

  pergunta.value = ''

  const historico = mensagens.value
    .filter((item) => item.role === 'user' || item.role === 'assistant')
    .map((item) => ({ role: item.role, content: item.content }))

  mensagens.value.push(criarMensagem('user', texto))
  enviando.value = true
  await rolarAoFim()

  try {
    const resposta = await perguntarAssistente(texto, historico)
    mensagens.value.push(criarMensagem('assistant', resposta.resposta))
  } catch (erro) {
    const detalhe =
      erro?.message || 'Não foi possível consultar o assistente agora.'
    mensagens.value.push(criarMensagem('erro', detalhe))
  } finally {
    enviando.value = false
    await rolarAoFim()
  }
}

function limparConversa() {
  limparHistoricoAssistente()
  mensagens.value = []
}

function aoTeclar(evento) {
  if (evento.key === 'Enter' && !evento.shiftKey) {
    evento.preventDefault()
    enviar()
  }
}

function aoEscape(evento) {
  if (evento.key === 'Escape' && aberto.value) {
    fechar()
  }
}

watch(
  () => mensagens.value.map((item) => `${item.role}|${item.content}`),
  () => {
    salvarHistoricoAssistente(
      mensagens.value.filter(
        (item) => item.role === 'user' || item.role === 'assistant',
      ),
    )
  },
)

watch([() => mensagens.value.length, enviando], rolarAoFim)

onMounted(() => document.addEventListener('keydown', aoEscape))
onBeforeUnmount(() => document.removeEventListener('keydown', aoEscape))
</script>

<template>
  <Teleport to="body">
    <Button
      v-if="!aberto"
      type="button"
      class="assist-fab"
      aria-label="Abrir assistente de dúvidas"
      title="Assistente EcoMonitor"
      @click="abrir()"
    >
      <MessageCircle :size="22" :stroke-width="2.5" aria-hidden="true" />
    </Button>

    <Card
      v-else
      class="assist-panel"
      role="dialog"
      aria-label="Assistente EcoMonitor"
    >
      <header class="assist-header">
        <span class="assist-icone" aria-hidden="true">
          <Bot :size="18" aria-hidden="true" />
        </span>
        <div class="assist-titulo">
          <strong>Assistente EcoMonitor</strong>
          <span>Dúvidas sobre o sistema</span>
        </div>
        <Button
          size="icon-sm"
          variant="ghost"
          class="assist-btn-mini"
          aria-label="Limpar conversa"
          title="Limpar conversa"
          @click="limparConversa()"
        >
          <RotateCcw :size="15" aria-hidden="true" />
        </Button>
        <Button
          size="icon-sm"
          variant="ghost"
          class="assist-btn-mini"
          aria-label="Fechar assistente"
          title="Fechar (Esc)"
          @click="fechar()"
        >
          <X :size="15" aria-hidden="true" />
        </Button>
      </header>

      <ScrollArea
        ref="listaScroll"
        class="assist-mensagens"
        role="log"
        aria-live="polite"
      >
        <div v-if="semMensagens" class="assist-vazio">
          <span class="assist-vazio-icone" aria-hidden="true">
            <Sparkles :size="20" aria-hidden="true" />
          </span>
          <p class="assist-vazio-titulo">Olá! 👋 Como posso ajudar?</p>
          <p class="assist-vazio-texto">
            Sou o assistente do EcoMonitor. Pergunte sobre telas, campos,
            regras de cadastro, estatísticas, mapa e relatórios.
          </p>
          <div class="assist-sugestoes">
            <Button
              v-for="sugestao in SUGESTOES"
              :key="sugestao"
              type="button"
              variant="outline"
              size="sm"
              class="assist-sugestao"
              @click="enviar(sugestao)"
            >
              {{ sugestao }}
            </Button>
          </div>
        </div>

        <div
          v-for="mensagem in mensagens"
          :key="mensagem.id"
          class="assist-msg"
          :class="`assist-msg-${mensagem.role}`"
        >
          <div class="assist-bolha">{{ mensagem.content }}</div>
        </div>

        <div v-if="enviando" class="assist-msg assist-msg-assistant">
          <div class="assist-bolha assist-digitando" aria-label="Assistente está digitando">
            <span class="assist-dot" aria-hidden="true"></span>
            <span class="assist-dot" aria-hidden="true"></span>
            <span class="assist-dot" aria-hidden="true"></span>
          </div>
        </div>
      </ScrollArea>

      <form class="assist-form" @submit.prevent="enviar()">
        <Textarea
          ref="campoEntrada"
          v-model="pergunta"
          class="assist-entrada"
          rows="2"
          :maxlength="LIMITE_MENSAGEM"
          placeholder="Pergunte sobre o EcoMonitor... (Enter envia, Shift+Enter quebra linha)"
          aria-label="Sua pergunta para o assistente"
          :disabled="enviando"
          @keydown="aoTeclar"
        />
        <Button
          type="submit"
          size="icon"
          class="assist-enviar"
          :disabled="enviando || !pergunta.trim()"
          aria-label="Enviar pergunta"
        >
          <Send :size="15" aria-hidden="true" />
        </Button>
      </form>

      <footer class="assist-rodape">
        <Badge variant="outline">
          {{ contadorCaracteres }}/{{ LIMITE_MENSAGEM }}
        </Badge>
        <span>Pode cometer erros. Confirme as informações importantes.</span>
      </footer>
    </Card>
  </Teleport>
</template>
