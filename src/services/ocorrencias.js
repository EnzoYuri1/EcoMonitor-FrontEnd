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

export async function obterOcorrencia(id) {
  const { data } = await api.get(`/ocorrencias/${id}`)
  return data
}

export async function listarTodasOcorrencias(parametros = {}) {
  const primeira = await listarOcorrencias({
    ...parametros,
    page: 1,
    page_size: 100,
  })

  const totalPaginas = Math.max(1, primeira.pages || 1)
  const itens = [...(primeira.items || [])]

  if (totalPaginas > 1) {
    const numeros = Array.from(
      { length: totalPaginas - 1 },
      (_, indice) => indice + 2,
    )

    const respostas = await Promise.all(
      numeros.map((page) =>
        listarOcorrencias({
          ...parametros,
          page,
          page_size: 100,
        }),
      ),
    )

    for (const resposta of respostas) {
      itens.push(...(resposta.items || []))
    }
  }

  return { ...primeira, items: itens }
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
