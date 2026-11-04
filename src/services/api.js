import axios from 'axios'

import { API_URL, HEALTH_URL, REQUEST_TIMEOUT } from '../config'
import { STORAGE_KEYS, lerStorage } from '../utils/storage'

const MENSAGEM_ERRO_CONEXAO =
  'Não foi possível conectar à API. Verifique se o backend está rodando em http://127.0.0.1:8000.'

const MENSAGENS_PADRAO = {
  400: 'Os dados enviados não são válidos.',
  401: 'Sua sessão expirou. Faça login novamente.',
  403: 'Você não tem permissão para realizar esta ação.',
  404: 'Recurso não encontrado.',
  409: 'Já existe um registro com estes dados.',
  422: 'Dados inválidos. Revise os campos informados.',
  500: 'A API encontrou um erro inesperado. Tente novamente.',
}

const ROTULOS_CAMPOS = {
  nome: 'Nome',
  email: 'Email',
  senha: 'Senha',
  tipo: 'Tipo',
  municipio: 'Município',
  estado: 'Estado',
  descricao: 'Descrição',
  latitude: 'Latitude',
  longitude: 'Longitude',
  data_ocorrencia: 'Data da ocorrência',
  data_inicio: 'Data inicial',
  data_fim: 'Data final',
  page: 'Página',
  page_size: 'Itens por página',
}

export class ApiError extends Error {
  constructor(statusCode, message, detail = null, campos = {}) {
    super(message)
    this.name = 'ApiError'
    this.statusCode = statusCode
    this.detail = detail
    this.campos = campos
  }
}

let tokenAtual = null
let unauthorizedHandler = null

export function definirTokenApi(token) {
  tokenAtual = token || null
}

export function setUnauthorizedHandler(handler) {
  unauthorizedHandler = typeof handler === 'function' ? handler : null
}

function rotuloCampo(loc) {
  if (!Array.isArray(loc)) return null

  for (let indice = loc.length - 1; indice >= 0; indice -= 1) {
    const parte = loc[indice]
    if (typeof parte === 'string' && ROTULOS_CAMPOS[parte]) {
      return ROTULOS_CAMPOS[parte]
    }
  }

  return null
}

function nomeCampo(loc) {
  if (!Array.isArray(loc)) return null

  for (let indice = loc.length - 1; indice >= 0; indice -= 1) {
    const parte = loc[indice]
    if (typeof parte === 'string' && ROTULOS_CAMPOS[parte]) {
      return parte
    }
  }

  return null
}

function traduzirMensagem(mensagem) {
  const texto = String(mensagem || '').trim()

  if (!texto) return 'Dados inválidos.'
  if (texto.startsWith('Value error, ')) {
    return texto.slice('Value error, '.length)
  }

  const regras = [
    [/^Field required$/i, 'Campo obrigatório.'],
    [/^Input should be a valid date.*/i, 'Informe uma data válida.'],
    [/^Input should be a valid number.*/i, 'Informe um número válido.'],
    [/^Input should be a valid integer.*/i, 'Informe um número inteiro válido.'],
    [/^Input should be a valid string.*/i, 'Informe um texto válido.'],
    [
      /^String should have at least (\d+) characters?$/i,
      (match) => `Deve ter pelo menos ${match[1]} caracteres.`,
    ],
    [
      /^String should have at most (\d+) characters?$/i,
      (match) => `Deve ter no máximo ${match[1]} caracteres.`,
    ],
    [
      /^Input should be greater than or equal to (-?\d+(?:\.\d+)?)$/i,
      (match) => `Deve ser maior ou igual a ${match[1]}.`,
    ],
    [
      /^Input should be less than or equal to (-?\d+(?:\.\d+)?)$/i,
      (match) => `Deve ser menor ou igual a ${match[1]}.`,
    ],
    [
      /^Input should be 'queimada' or 'desmatamento'$/i,
      'Selecione um tipo válido.',
    ],
  ]

  for (const [expressao, substituto] of regras) {
    const resultado = texto.match(expressao)
    if (resultado) {
      return typeof substituto === 'function'
        ? substituto(resultado)
        : substituto
    }
  }

  return texto
}

export function mensagensValidacao(detail) {
  if (typeof detail === 'string') {
    return detail.trim() ? [traduzirMensagem(detail)] : []
  }

  const lista = Array.isArray(detail) ? detail : [detail]
  const mensagens = []

  for (const item of lista) {
    if (!item) continue

    if (typeof item !== 'object') {
      const texto = String(item).trim()
      if (texto) mensagens.push(traduzirMensagem(texto))
      continue
    }

    const texto = traduzirMensagem(item.msg || item.message)
    const rotulo = rotuloCampo(item.loc)
    mensagens.push(rotulo ? `${rotulo}: ${texto}` : texto)
  }

  return mensagens
}

export function errosPorCampo(detail) {
  const lista = Array.isArray(detail) ? detail : [detail]
  const campos = {}

  for (const item of lista) {
    if (!item || typeof item !== 'object') continue

    const campo = nomeCampo(item.loc)
    if (!campo) continue

    const mensagem = traduzirMensagem(item.msg || item.message)
    campos[campo] = campos[campo]
      ? `${campos[campo]} ${mensagem}`
      : mensagem
  }

  return campos
}

function mensagemHttp(statusCode, detail) {
  if (statusCode === 401) {
    return MENSAGENS_PADRAO[401]
  }

  if (statusCode === 422) {
    const mensagens = mensagensValidacao(detail)
    if (mensagens.length) {
      return `Dados inválidos:\n${mensagens.map((item) => `• ${item}`).join('\n')}`
    }
    return MENSAGENS_PADRAO[422]
  }

  if (typeof detail === 'string' && detail.trim()) {
    return detail.trim()
  }

  const mensagens = mensagensValidacao(detail)
  if (mensagens.length) {
    return mensagens.join('\n')
  }

  return MENSAGENS_PADRAO[statusCode] || `A API retornou o status ${statusCode}.`
}

function normalizarErro(error) {
  if (error instanceof ApiError) return error

  if (error?.response) {
    const statusCode = error.response.status
    const payload = error.response.data
    const detail =
      payload && typeof payload === 'object' && 'detail' in payload
        ? payload.detail
        : payload

    return new ApiError(
      statusCode,
      mensagemHttp(statusCode, detail),
      detail,
      statusCode === 422 ? errosPorCampo(detail) : {},
    )
  }

  if (
    error?.code === 'ECONNABORTED' ||
    error?.code === 'ETIMEDOUT' ||
    error?.request ||
    error?.code === 'ERR_NETWORK' ||
    error?.code === 'ECONNREFUSED'
  ) {
    return new ApiError(null, MENSAGEM_ERRO_CONEXAO)
  }

  return new ApiError(
    null,
    'Não foi possível concluir a requisição à API.',
  )
}

const api = axios.create({
  baseURL: API_URL,
  timeout: REQUEST_TIMEOUT,
  headers: { Accept: 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = tokenAtual || lerStorage(STORAGE_KEYS.token)

  config._enviarToken = Boolean(token)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const apiError = normalizarErro(error)
    const eraLogin = String(error?.config?.url || '').includes('/auth/login')

    if (
      apiError.statusCode === 401 &&
      error?.config?._enviarToken &&
      !eraLogin
    ) {
      unauthorizedHandler?.(apiError)
    }

    return Promise.reject(apiError)
  },
)

export async function verificarSaude() {
  const { data } = await axios.get(HEALTH_URL, {
    timeout: REQUEST_TIMEOUT,
    headers: { Accept: 'application/json' },
  })

  return data?.status === 'ok'
}

export default api
