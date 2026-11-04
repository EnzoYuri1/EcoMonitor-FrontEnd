import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import { definirTokenApi } from '../services/api'
import {
  autenticar,
  obterUsuarioAtual,
  registrarUsuario,
} from '../services/auth'
import {
  STORAGE_KEYS,
  lerStorage,
  limparStorageSessao,
  removerStorage,
  salvarStorage,
} from '../utils/storage'

export const useAuthStore = defineStore('auth', () => {
  const token = ref('')
  const user = ref(null)
  const expiresAt = ref(0)
  const validated = ref(false)
  const sessionMessage = ref('')

  const isAuthenticated = computed(
    () =>
      Boolean(token.value) &&
      (!expiresAt.value || Date.now() < expiresAt.value),
  )

  const nomeUsuario = computed(() => user.value?.nome || '')
  const emailUsuario = computed(() => user.value?.email || '')
  const userId = computed(() => user.value?.id ?? null)

  function persistir() {
    if (token.value) {
      salvarStorage(STORAGE_KEYS.token, token.value)
    } else {
      removerStorage(STORAGE_KEYS.token)
    }

    if (expiresAt.value) {
      salvarStorage(STORAGE_KEYS.expiresAt, expiresAt.value)
    } else {
      removerStorage(STORAGE_KEYS.expiresAt)
    }

    if (user.value) {
      salvarStorage(STORAGE_KEYS.user, JSON.stringify(user.value))
    } else {
      removerStorage(STORAGE_KEYS.user)
    }
  }

  function hydrate() {
    const tokenSalvo = lerStorage(STORAGE_KEYS.token)
    if (!tokenSalvo) return

    const expiracaoSalva = Number(lerStorage(STORAGE_KEYS.expiresAt) || 0)
    if (expiracaoSalva && Date.now() >= expiracaoSalva) {
      limparStorageSessao()
      definirTokenApi(null)
      return
    }

    token.value = tokenSalvo
    expiresAt.value = expiracaoSalva
    definirTokenApi(tokenSalvo)

    const usuarioSalvo = lerStorage(STORAGE_KEYS.user)
    if (usuarioSalvo) {
      try {
        user.value = JSON.parse(usuarioSalvo)
      } catch {
        user.value = null
      }
    }
  }

  function clearSession() {
    token.value = ''
    user.value = null
    expiresAt.value = 0
    validated.value = false
    definirTokenApi(null)
    limparStorageSessao()
  }

  function logout() {
    clearSession()
  }

  function handleUnauthorized() {
    if (token.value) {
      sessionMessage.value =
        'Sua sessão expirou. Faça login novamente.'
    }
    clearSession()
  }

  function consumirMensagemSessao() {
    const mensagem = sessionMessage.value
    sessionMessage.value = ''
    return mensagem
  }

  async function login(email, senha) {
    const dados = await autenticar(email, senha)

    token.value = dados.access_token
    expiresAt.value =
      Date.now() + Number(dados.expires_in || 3600) * 1000
    validated.value = false
    definirTokenApi(token.value)
    persistir()

    try {
      const usuario = await obterUsuarioAtual()
      user.value = usuario
      validated.value = true
      persistir()
      return usuario
    } catch (error) {
      clearSession()
      throw error
    }
  }

  async function registrar(dados) {
    return registrarUsuario(dados)
  }

  async function fetchMe() {
    if (!token.value) {
      throw new Error('Sessão não iniciada.')
    }

    const usuario = await obterUsuarioAtual()
    user.value = usuario
    validated.value = true
    persistir()
    return usuario
  }

  async function ensureSession() {
    if (!token.value) return false

    if (expiresAt.value && Date.now() >= expiresAt.value) {
      clearSession()
      sessionMessage.value =
        'Sua sessão expirou. Faça login novamente.'
      return false
    }

    if (validated.value && user.value) return true

    try {
      await fetchMe()
      return true
    } catch (error) {
      if (error?.statusCode === 401) {
        clearSession()
        return false
      }

      // Em falha de conexão, mantém a sessão em memória e permite a
      // navegação. As telas exibem a mensagem de API indisponível.
      return Boolean(user.value)
    }
  }

  return {
    token,
    user,
    expiresAt,
    validated,
    sessionMessage,
    isAuthenticated,
    nomeUsuario,
    emailUsuario,
    userId,
    hydrate,
    login,
    registrar,
    fetchMe,
    ensureSession,
    clearSession,
    logout,
    handleUnauthorized,
    consumirMensagemSessao,
  }
})
