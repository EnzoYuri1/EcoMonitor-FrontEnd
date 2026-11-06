import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'

import api, { definirTokenApi } from '@/services/api'
import {
  HISTORICO_MAXIMO,
  LIMITE_MENSAGEM,
  TIMEOUT_ASSISTENTE,
  perguntarAssistente,
} from '@/services/assistente'
import {
  CHAVE_HISTORICO_ASSISTENTE,
  carregarHistoricoAssistente,
  limparHistoricoAssistente,
  salvarHistoricoAssistente,
} from '@/utils/assistente'

let adaptador

function resposta(config, data, status = 200) {
  return {
    data,
    status,
    statusText: String(status),
    headers: {},
    config,
  }
}

beforeEach(() => {
  sessionStorage.clear()
  definirTokenApi('token-mock')

  adaptador = vi.fn()
  api.defaults.adapter = adaptador
})

afterEach(() => {
  definirTokenApi(null)
  sessionStorage.clear()
  vi.restoreAllMocks()
})

describe('serviço do assistente', () => {
  it('envia a pergunta com histórico filtrado e devolve a resposta', async () => {
    adaptador.mockImplementation((config) =>
      Promise.resolve(
        resposta(config, {
          resposta: 'Acesse "Nova ocorrência" no menu.',
          modelo: 'openrouter/free',
        }),
      ),
    )

    const retorno = await perguntarAssistente('Como cadastrar?', [
      { role: 'user', content: 'O que é o EcoMonitor?' },
      { role: 'assistant', content: 'Um sistema de monitoramento.' },
      { role: 'erro', content: 'Esta mensagem não deve ir ao backend.' },
    ])

    expect(retorno).toEqual({
      resposta: 'Acesse "Nova ocorrência" no menu.',
      modelo: 'openrouter/free',
    })

    const config = adaptador.mock.calls[0][0]
    expect(config.url).toBe('/assistente')
    expect(config.method).toBe('post')
    expect(config.timeout).toBe(TIMEOUT_ASSISTENTE)
    expect(JSON.parse(config.data)).toEqual({
      mensagem: 'Como cadastrar?',
      historico: [
        { role: 'user', content: 'O que é o EcoMonitor?' },
        { role: 'assistant', content: 'Um sistema de monitoramento.' },
      ],
    })
  })

  it('limita a mensagem e o histórico enviado ao backend', async () => {
    adaptador.mockImplementation((config) =>
      Promise.resolve(resposta(config, { resposta: 'ok', modelo: 'm' })),
    )

    const dez = Array.from({ length: 10 }, (_, indice) => ({
      role: indice % 2 ? 'assistant' : 'user',
      content: `Mensagem ${indice + 1}`,
    }))

    await perguntarAssistente('a'.repeat(1500), dez)

    const corpo = JSON.parse(adaptador.mock.calls[0][0].data)
    expect(corpo.mensagem).toHaveLength(LIMITE_MENSAGEM)
    expect(corpo.historico).toHaveLength(HISTORICO_MAXIMO)
    expect(corpo.historico[0].content).toBe('Mensagem 5')
    expect(corpo.historico.at(-1).content).toBe('Mensagem 10')
  })

  it('propaga o ApiError com a mensagem amigável do backend', async () => {
    adaptador.mockImplementation((config) =>
      Promise.reject({
        config,
        request: {},
        isAxiosError: true,
        response: {
          config,
          data: { detail: 'O assistente está indisponível agora.' },
          status: 503,
          statusText: 'Service Unavailable',
          headers: {},
        },
      }),
    )

    await expect(perguntarAssistente('Pergunta.', [])).rejects.toMatchObject({
      name: 'ApiError',
      statusCode: 503,
      message: 'O assistente está indisponível agora.',
    })
  })
})

describe('histórico do assistente (sessionStorage)', () => {
  it('salva apenas mensagens válidas e recarrega as mesmas', () => {
    salvarHistoricoAssistente([
      { role: 'user', content: 'Oi' },
      { role: 'erro', content: 'Erro não persistido' },
      { role: 'assistant', content: 'Olá! Como posso ajudar?' },
    ])

    expect(sessionStorage.getItem(CHAVE_HISTORICO_ASSISTENTE)).toBeTruthy()
    expect(carregarHistoricoAssistente()).toEqual([
      { role: 'user', content: 'Oi' },
      { role: 'assistant', content: 'Olá! Como posso ajudar?' },
    ])
  })

  it('guarda somente as últimas 24 mensagens', () => {
    const trinta = Array.from({ length: 30 }, (_, indice) => ({
      role: indice % 2 ? 'assistant' : 'user',
      content: `Mensagem ${indice + 1}`,
    }))

    salvarHistoricoAssistente(trinta)

    const carregado = carregarHistoricoAssistente()
    expect(carregado).toHaveLength(24)
    expect(carregado[0].content).toBe('Mensagem 7')
    expect(carregado.at(-1).content).toBe('Mensagem 30')
  })

  it('ignora armazenamento corrompido', () => {
    sessionStorage.setItem(CHAVE_HISTORICO_ASSISTENTE, 'isto-nao-e-json')
    expect(carregarHistoricoAssistente()).toEqual([])
  })

  it('limpa o histórico', () => {
    salvarHistoricoAssistente([{ role: 'user', content: 'Oi' }])
    limparHistoricoAssistente()
    expect(carregarHistoricoAssistente()).toEqual([])
  })
})
