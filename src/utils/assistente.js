import { lerStorage, removerStorage, salvarStorage } from './storage'

export const CHAVE_HISTORICO_ASSISTENTE = 'ecomonitor.assistenteHistorico'
export const HISTORICO_MAXIMO_ARMAZENADO = 24

const PAPEIS_VALIDOS = ['user', 'assistant']

function converterTexto(bruto) {
  try {
    const lista = JSON.parse(bruto)
    if (!Array.isArray(lista)) return []

    return lista
      .filter(
        (item) =>
          item && PAPEIS_VALIDOS.includes(item.role) && item.content,
      )
      .map((item) => ({
        role: item.role,
        content: String(item.content),
      }))
  } catch {
    return []
  }
}

export function carregarHistoricoAssistente() {
  return converterTexto(lerStorage(CHAVE_HISTORICO_ASSISTENTE))
}

export function salvarHistoricoAssistente(mensagens) {
  const validas = (Array.isArray(mensagens) ? mensagens : [])
    .filter((item) => PAPEIS_VALIDOS.includes(item?.role))
    .map((item) => ({ role: item.role, content: String(item.content) }))

  salvarStorage(
    CHAVE_HISTORICO_ASSISTENTE,
    JSON.stringify(validas.slice(-HISTORICO_MAXIMO_ARMAZENADO)),
  )
}

export function limparHistoricoAssistente() {
  removerStorage(CHAVE_HISTORICO_ASSISTENTE)
}
