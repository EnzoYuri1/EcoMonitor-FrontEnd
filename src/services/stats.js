import api from './api'

export async function obterEstatisticas() {
  const { data } = await api.get('/stats')
  return data
}
