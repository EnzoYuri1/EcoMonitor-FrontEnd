import api from './api'

function limparParametros(parametros) {
  return Object.fromEntries(
    Object.entries(parametros).filter(
      ([, valor]) => valor !== '' && valor !== null && valor !== undefined,
    ),
  )
}

export async function listarOcorrencias(parametros = {}) {
  const { data } = await api.get('/ocorrencias', {
    params: limparParametros(parametros),
  })
  return data
}

export async function criarOcorrencia(dados) {
  const { data } = await api.post('/ocorrencias', dados)
  return data
}

export async function atualizarOcorrencia(id, dados) {
  const { data } = await api.patch(`/ocorrencias/${id}`, dados)
  return data
}

export async function excluirOcorrencia(id) {
  await api.delete(`/ocorrencias/${id}`)
}
