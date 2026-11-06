import api from './api'

export const LIMITE_MENSAGEM = 1000
export const HISTORICO_MAXIMO = 6

// O OpenRouter pode demorar mais que o timeout global (10s), pois responde
// com um contexto grande de guia + estatísticas.
export const TIMEOUT_ASSISTENTE = 45000

const PAPEIS_VALIDOS = ['user', 'assistant']

function normalizarHistorico(historico) {
  return (Array.isArray(historico) ? historico : [])
    .filter((item) => PAPEIS_VALIDOS.includes(item?.role))
    .slice(-HISTORICO_MAXIMO)
    .map((item) => ({
      role: item.role,
      content: String(item.content || '').slice(0, LIMITE_MENSAGEM),
    }))
}

export async function perguntarAssistente(mensagem, historico = []) {
  const corpo = {
    mensagem: String(mensagem || '').trim().slice(0, LIMITE_MENSAGEM),
    historico: normalizarHistorico(historico),
  }

  const { data } = await api.post('/assistente', corpo, {
    timeout: TIMEOUT_ASSISTENTE,
  })

  return {
    resposta: String(data?.resposta ?? ''),
    modelo: String(data?.modelo ?? ''),
  }
}
