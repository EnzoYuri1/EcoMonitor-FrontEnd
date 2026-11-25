import api from './api'

export async function listarUsuarios() {
  const { data } = await api.get('/usuarios')
  return data
}

export async function alterarPerfilUsuario(usuarioId, perfil) {
  const { data } = await api.patch(`/usuarios/${usuarioId}/perfil`, {
    perfil,
  })
  return data
}
