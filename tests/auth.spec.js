import { createPinia, setActivePinia } from 'pinia'
import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'

vi.mock('@/services/auth', () => ({
  autenticar: vi.fn(),
  obterUsuarioAtual: vi.fn(),
  registrarUsuario: vi.fn(),
}))

vi.mock('@/services/api', () => ({
  definirTokenApi: vi.fn(),
}))

import * as authService from '@/services/auth'
import { useAuthStore } from '@/stores/auth'
import { STORAGE_KEYS } from '@/utils/storage'

const USUARIO = {
  id: 2,
  nome: 'Maria Silva',
  email: 'maria@example.com',
}

function criarStore() {
  setActivePinia(createPinia())
  return useAuthStore()
}

beforeEach(() => {
  sessionStorage.clear()
  vi.clearAllMocks()
})

describe('hydrate', () => {
  it('restaura token, expiração e usuário do sessionStorage', () => {
    sessionStorage.setItem(STORAGE_KEYS.token, 'token-salvo')
    sessionStorage.setItem(
      STORAGE_KEYS.expiresAt,
      String(Date.now() + 60000),
    )
    sessionStorage.setItem(
      STORAGE_KEYS.user,
      JSON.stringify(USUARIO),
    )

    const store = criarStore()
    store.hydrate()

    expect(store.token).toBe('token-salvo')
    expect(store.user).toEqual(USUARIO)
    expect(store.isAuthenticated).toBe(true)
  })

  it('descarta uma sessão expirada', () => {
    sessionStorage.setItem(STORAGE_KEYS.token, 'token-antigo')
    sessionStorage.setItem(
      STORAGE_KEYS.expiresAt,
      String(Date.now() - 1000),
    )

    const store = criarStore()
    store.hydrate()

    expect(store.token).toBe('')
    expect(store.isAuthenticated).toBe(false)
    expect(sessionStorage.getItem(STORAGE_KEYS.token)).toBeNull()
  })

  it('ignora usuário salvo com JSON inválido', () => {
    sessionStorage.setItem(STORAGE_KEYS.token, 'token-salvo')
    sessionStorage.setItem(
      STORAGE_KEYS.expiresAt,
      String(Date.now() + 60000),
    )
    sessionStorage.setItem(STORAGE_KEYS.user, '{invalido')

    const store = criarStore()
    store.hydrate()

    expect(store.token).toBe('token-salvo')
    expect(store.user).toBeNull()
  })
})

describe('login', () => {
  it('guarda o token, calcula a expiração e busca o usuário', async () => {
    authService.autenticar.mockResolvedValue({
      access_token: 'novo-token',
      token_type: 'bearer',
      expires_in: 3600,
    })
    authService.obterUsuarioAtual.mockResolvedValue(USUARIO)

    const store = criarStore()
    const usuario = await store.login(
      'maria@example.com',
      'senhaSegura123',
    )

    expect(usuario).toEqual(USUARIO)
    expect(store.token).toBe('novo-token')
    expect(store.user).toEqual(USUARIO)
    expect(store.validated).toBe(true)
    expect(store.isAuthenticated).toBe(true)
    expect(sessionStorage.getItem(STORAGE_KEYS.token)).toBe(
      'novo-token',
    )
    expect(sessionStorage.getItem(STORAGE_KEYS.user)).toContain(
      'maria@example.com',
    )
  })

  it('limpa a sessão se a consulta do usuário falhar', async () => {
    authService.autenticar.mockResolvedValue({
      access_token: 'novo-token',
      expires_in: 3600,
    })
    authService.obterUsuarioAtual.mockRejectedValue(
      new Error('Falha ao consultar usuário'),
    )

    const store = criarStore()

    await expect(
      store.login('maria@example.com', 'senhaSegura123'),
    ).rejects.toThrow('Falha ao consultar usuário')

    expect(store.token).toBe('')
    expect(store.user).toBeNull()
    expect(sessionStorage.getItem(STORAGE_KEYS.token)).toBeNull()
  })
})

describe('ensureSession', () => {
  it('retorna false sem token', async () => {
    const store = criarStore()

    await expect(store.ensureSession()).resolves.toBe(false)
    expect(authService.obterUsuarioAtual).not.toHaveBeenCalled()
  })

  it('valida uma vez e reutiliza a sessão já validada', async () => {
    authService.obterUsuarioAtual.mockResolvedValue(USUARIO)

    const store = criarStore()
    store.token = 'token-valido'
    store.expiresAt = Date.now() + 60000

    await expect(store.ensureSession()).resolves.toBe(true)
    await expect(store.ensureSession()).resolves.toBe(true)

    expect(authService.obterUsuarioAtual).toHaveBeenCalledTimes(1)
    expect(store.user).toEqual(USUARIO)
  })

  it('limpa a sessão quando a API responde 401', async () => {
    authService.obterUsuarioAtual.mockRejectedValue({
      statusCode: 401,
      message: 'Sua sessão expirou.',
    })

    const store = criarStore()
    store.token = 'token-invalido'
    store.expiresAt = Date.now() + 60000

    await expect(store.ensureSession()).resolves.toBe(false)
    expect(store.token).toBe('')
    expect(sessionStorage.getItem(STORAGE_KEYS.token)).toBeNull()
  })

  it('mantém a sessão em memória quando a API está offline', async () => {
    authService.obterUsuarioAtual.mockRejectedValue({
      statusCode: null,
      message: 'API offline',
    })

    const store = criarStore()
    store.token = 'token-valido'
    store.expiresAt = Date.now() + 60000
    store.user = USUARIO

    await expect(store.ensureSession()).resolves.toBe(true)
    expect(store.token).toBe('token-valido')
  })
})

describe('logout e mensagem de sessão', () => {
  it('limpa todos os dados da sessão', () => {
    const store = criarStore()
    store.token = 'token'
    store.user = USUARIO
    store.expiresAt = Date.now() + 60000
    store.validated = true
    sessionStorage.setItem(STORAGE_KEYS.token, 'token')

    store.logout()

    expect(store.token).toBe('')
    expect(store.user).toBeNull()
    expect(store.expiresAt).toBe(0)
    expect(store.validated).toBe(false)
    expect(sessionStorage.getItem(STORAGE_KEYS.token)).toBeNull()
  })

  it('registra e consome a mensagem de sessão expirada', () => {
    const store = criarStore()
    store.token = 'token'
    store.handleUnauthorized()

    expect(store.token).toBe('')
    expect(store.sessionMessage).toBe(
      'Sua sessão expirou. Faça login novamente.',
    )

    expect(store.consumirMensagemSessao()).toBe(
      'Sua sessão expirou. Faça login novamente.',
    )
    expect(store.sessionMessage).toBe('')
  })
})
