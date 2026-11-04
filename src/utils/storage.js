export const STORAGE_KEYS = Object.freeze({
  token: 'ecomonitor.token',
  expiresAt: 'ecomonitor.expiresAt',
  user: 'ecomonitor.user',
})

function obterSessionStorage() {
  try {
    if (typeof window === 'undefined') return null
    return window.sessionStorage
  } catch {
    return null
  }
}

export function lerStorage(chave) {
  try {
    return obterSessionStorage()?.getItem(chave) ?? null
  } catch {
    return null
  }
}

export function salvarStorage(chave, valor) {
  try {
    obterSessionStorage()?.setItem(chave, String(valor))
  } catch {
    // O armazenamento pode estar indisponível (modo privado ou política do
    // navegador). A sessão continua válida em memória.
  }
}

export function removerStorage(chave) {
  try {
    obterSessionStorage()?.removeItem(chave)
  } catch {
    // Ignora falhas de armazenamento.
  }
}

export function limparStorageSessao() {
  Object.values(STORAGE_KEYS).forEach(removerStorage)
}
