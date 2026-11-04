import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'

import api, {
  ApiError,
  definirTokenApi,
  setUnauthorizedHandler,
} from '@/services/api'
import { STORAGE_KEYS } from '@/utils/storage'

const MENSAGEM_OFFLINE =
  'Não foi possível conectar à API. Verifique se o backend está rodando em http://127.0.0.1:8000.'

let adaptador
let tratadorSessao

function resposta(config, data, status = 200) {
  return {
    data,
    status,
    statusText: String(status),
    headers: {},
    config,
  }
}

function rejeitar(config, status, data) {
  return Promise.reject({
    config,
    response: {
      data,
      status,
      statusText: String(status),
      headers: {},
      config,
    },
    request: {},
    isAxiosError: true,
  })
}

function cabecalho(config, nome) {
  if (config.headers?.get) {
    return config.headers.get(nome)
  }
  return config.headers?.[nome]
}

beforeEach(() => {
  sessionStorage.clear()
  definirTokenApi(null)

  tratadorSessao = vi.fn()
  setUnauthorizedHandler(tratadorSessao)

  adaptador = vi.fn()
  api.defaults.adapter = adaptador
})

afterEach(() => {
  setUnauthorizedHandler(null)
  definirTokenApi(null)
  sessionStorage.clear()
  vi.restoreAllMocks()
})

describe('interceptor de requisição', () => {
  it('envia o token do sessionStorage como Bearer', async () => {
    sessionStorage.setItem(STORAGE_KEYS.token, 'token-do-storage')
    adaptador.mockImplementation((config) =>
      Promise.resolve(resposta(config, { ok: true })),
    )

    const retorno = await api.get('/stats')
    const config = adaptador.mock.calls[0][0]

    expect(retorno.data).toEqual({ ok: true })
    expect(config.baseURL).toBe('/api/v1')
    expect(cabecalho(config, 'Authorization')).toBe(
      'Bearer token-do-storage',
    )
  })

  it('prioriza o token mantido em memória', async () => {
    definirTokenApi('token-em-memoria')
    sessionStorage.setItem(STORAGE_KEYS.token, 'token-do-storage')
    adaptador.mockImplementation((config) =>
      Promise.resolve(resposta(config, { ok: true })),
    )

    await api.get('/ocorrencias')
    const config = adaptador.mock.calls[0][0]

    expect(cabecalho(config, 'Authorization')).toBe(
      'Bearer token-em-memoria',
    )
  })

  it('não envia Authorization quando não há sessão', async () => {
    adaptador.mockImplementation((config) =>
      Promise.resolve(resposta(config, { ok: true })),
    )

    await api.get('/stats')
    const config = adaptador.mock.calls[0][0]

    expect(cabecalho(config, 'Authorization')).toBeUndefined()
  })
})

describe('tratamento de erros', () => {
  it('em 401 autenticado, chama o tratador de sessão e expõe ApiError', async () => {
    sessionStorage.setItem(STORAGE_KEYS.token, 'token-expirado')
    adaptador.mockImplementation((config) =>
      rejeitar(config, 401, {
        detail: 'Token inválido ou expirado.',
      }),
    )

    await expect(api.get('/ocorrencias')).rejects.toMatchObject({
      name: 'ApiError',
      statusCode: 401,
      message: 'Sua sessão expirou. Faça login novamente.',
    })

    expect(tratadorSessao).toHaveBeenCalledTimes(1)
    expect(tratadorSessao.mock.calls[0][0]).toBeInstanceOf(ApiError)
  })

  it('não chama o tratador de sessão quando o login retorna 401', async () => {
    adaptador.mockImplementation((config) =>
      rejeitar(config, 401, {
        detail: 'Email ou senha incorretos.',
      }),
    )

    await expect(
      api.post('/auth/login', {
        email: 'maria@example.com',
        senha: 'senha-incorreta',
      }),
    ).rejects.toMatchObject({
      statusCode: 401,
      message: 'Sua sessão expirou. Faça login novamente.',
    })

    expect(tratadorSessao).not.toHaveBeenCalled()
  })

  it('preserva a mensagem de conflito (409)', async () => {
    adaptador.mockImplementation((config) =>
      rejeitar(config, 409, { detail: 'Email já cadastrado.' }),
    )

    await expect(
      api.post('/auth/register', {
        nome: 'Maria',
        email: 'maria@example.com',
        senha: 'senhaSegura123',
      }),
    ).rejects.toMatchObject({
      statusCode: 409,
      message: 'Email já cadastrado.',
    })
  })

  it('converte o detail de 422 em mensagens legíveis e campos', async () => {
    const detail = [
      {
        loc: ['body', 'municipio'],
        msg: 'String should have at least 2 characters',
        type: 'string_too_short',
      },
      {
        loc: ['body', 'descricao'],
        msg: 'Field required',
        type: 'missing',
      },
    ]

    adaptador.mockImplementation((config) =>
      rejeitar(config, 422, { detail }),
    )

    const erro = await api
      .post('/ocorrencias', {})
      .catch((capturado) => capturado)

    expect(erro).toBeInstanceOf(ApiError)
    expect(erro.statusCode).toBe(422)
    expect(erro.message).toContain('Dados inválidos')
    expect(erro.message).toContain(
      'Município: Deve ter pelo menos 2 caracteres.',
    )
    expect(erro.message).toContain('Descrição: Campo obrigatório.')
    expect(erro.campos).toEqual({
      municipio: 'Deve ter pelo menos 2 caracteres.',
      descricao: 'Campo obrigatório.',
    })
  })

  it('traduz mensagens de validação personalizadas', async () => {
    adaptador.mockImplementation((config) =>
      rejeitar(config, 422, {
        detail: [
          {
            loc: ['body', 'data_ocorrencia'],
            msg: 'Value error, A data da ocorrência não pode ser futura.',
            type: 'value_error',
          },
        ],
      }),
    )

    const erro = await api
      .post('/ocorrencias', {})
      .catch((capturado) => capturado)

    expect(erro.message).toContain(
      'Data da ocorrência: A data da ocorrência não pode ser futura.',
    )
  })

  it('mostra mensagem amigável quando a API está offline', async () => {
    adaptador.mockImplementation((config) =>
      Promise.reject({
        config,
        request: {},
        isAxiosError: true,
        code: 'ERR_NETWORK',
      }),
    )

    const erro = await api
      .get('/stats')
      .catch((capturado) => capturado)

    expect(erro).toBeInstanceOf(ApiError)
    expect(erro.statusCode).toBeNull()
    expect(erro.message).toBe(MENSAGEM_OFFLINE)
  })

  it('usa a mensagem de conexão também em timeout', async () => {
    adaptador.mockImplementation((config) =>
      Promise.reject({
        config,
        request: {},
        isAxiosError: true,
        code: 'ECONNABORTED',
      }),
    )

    const erro = await api
      .get('/ocorrencias')
      .catch((capturado) => capturado)

    expect(erro.statusCode).toBeNull()
    expect(erro.message).toBe(MENSAGEM_OFFLINE)
  })
})
