import api from './api'

export async function registrarUsuario(dados) {
  const { data } = await api.post('/auth/register', dados)
  return data
}

export async function autenticar(email, senha) {
  const { data } = await api.post('/auth/login', { email, senha })
  return data
}

export async function obterUsuarioAtual() {
  const { data } = await api.get('/auth/me')
  return data
}
