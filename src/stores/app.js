import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export const useAppStore = defineStore('app', () => {
  const ultimaAtualizacao = ref(null)
  const notificacoes = ref([
    {
      id: 1,
      titulo: 'Ambiente demonstrativo',
      descricao:
        'Severidade, status, área e anexos são metadados visuais, sem persistência no backend.',
      lida: false,
    },
    {
      id: 2,
      titulo: 'Dados atualizados',
      descricao:
        'Os indicadores refletem as ocorrências carregadas da API do EcoMonitor.',
      lida: false,
    },
  ])

  const naoLidas = computed(
    () => notificacoes.value.filter((item) => !item.lida).length,
  )

  function marcarAtualizacao(data = new Date()) {
    ultimaAtualizacao.value = data
  }

  function marcarTodasComoLidas() {
    notificacoes.value = notificacoes.value.map((item) => ({
      ...item,
      lida: true,
    }))
  }

  return {
    ultimaAtualizacao,
    notificacoes,
    naoLidas,
    marcarAtualizacao,
    marcarTodasComoLidas,
  }
})
