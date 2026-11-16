import api from './api'

function limparParametros(params = {}) {
  const limpos = {}
  for (const [chave, valor] of Object.entries(params)) {
    if (valor !== undefined && valor !== null && String(valor).trim() !== '') {
      limpos[chave] = valor
    }
  }
  return limpos
}

export async function obterDestaquesCentral() {
  const { data } = await api.get('/central/destaques')
  return data
}

export async function listarNoticiasCentral(params = {}) {
  const { data } = await api.get('/central/noticias', {
    params: limparParametros(params),
  })
  return data
}

export async function listarArtigosCentral(params = {}) {
  const { data } = await api.get('/central/artigos', {
    params: limparParametros(params),
  })
  return data
}

export async function obterMonitoramentoCentral(params = {}) {
  const { data } = await api.get('/central/monitoramento', {
    params: limparParametros(params),
  })
  return data
}

export async function buscarNaCentral(params = {}) {
  const { data } = await api.get('/central/busca', {
    params: limparParametros(params),
  })
  return data
}

export async function obterStatusCentral() {
  const { data } = await api.get('/central/status')
  return data
}

export async function dispararAtualizacaoCentral(escopo = 'todas') {
  const { data } = await api.post('/central/atualizar', null, {
    params: { escopo },
  })
  return data
}
