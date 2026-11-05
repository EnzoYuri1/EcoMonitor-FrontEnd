import {
  formatarData,
  formatarDataHora,
  formatarMes,
  rotuloTipo,
} from './format'

function dataValida(valor) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(valor || '').slice(0, 10))
}

export function resumirOcorrencias(itens = []) {
  let queimadas = 0
  let desmatamentos = 0
  let dataMinima = null
  let dataMaxima = null
  const municipios = new Set()

  for (const item of itens) {
    if (item?.tipo === 'queimada') queimadas += 1
    if (item?.tipo === 'desmatamento') desmatamentos += 1

    if (item?.municipio) {
      municipios.add(
        `${item.municipio.trim().toLowerCase()}|||${item.estado || ''}`,
      )
    }

    const data = String(item?.data_ocorrencia || '').slice(0, 10)
    if (!dataValida(data)) continue

    if (!dataMinima || data < dataMinima) dataMinima = data
    if (!dataMaxima || data > dataMaxima) dataMaxima = data
  }

  return {
    total: itens.length,
    queimadas,
    desmatamentos,
    municipios: municipios.size,
    dataMinima,
    dataMaxima,
  }
}

export function agruparPorMunicipio(itens = []) {
  const grupos = new Map()

  for (const item of itens) {
    const municipio = item?.municipio?.trim() || 'Não informado'
    const estado = item?.estado || ''
    const chave = `${municipio.toLowerCase()}|||${estado}`

    if (!grupos.has(chave)) {
      grupos.set(chave, {
        municipio,
        estado,
        queimadas: 0,
        desmatamentos: 0,
        total: 0,
      })
    }

    const grupo = grupos.get(chave)
    grupo.total += 1

    if (item?.tipo === 'queimada') grupo.queimadas += 1
    if (item?.tipo === 'desmatamento') grupo.desmatamentos += 1
  }

  const totalGeral = itens.length

  return [...grupos.values()]
    .map((grupo) => ({
      ...grupo,
      percentual:
        totalGeral > 0 ? (grupo.total / totalGeral) * 100 : 0,
    }))
    .sort(
      (a, b) =>
        b.total - a.total ||
        a.municipio.localeCompare(b.municipio, 'pt-BR') ||
        a.estado.localeCompare(b.estado, 'pt-BR'),
    )
}

export function agruparMensal(itens = []) {
  const contagem = new Map()

  for (const item of itens) {
    const data = String(item?.data_ocorrencia || '').slice(0, 10)
    if (!dataValida(data)) continue

    const chave = data.slice(0, 7)
    if (!contagem.has(chave)) {
      contagem.set(chave, { queimadas: 0, desmatamentos: 0 })
    }

    const mes = contagem.get(chave)
    if (item?.tipo === 'queimada') mes.queimadas += 1
    if (item?.tipo === 'desmatamento') mes.desmatamentos += 1
  }

  if (!contagem.size) {
    return {
      labels: [],
      queimadas: [],
      desmatamentos: [],
      totais: [],
    }
  }

  const chaves = [...contagem.keys()].sort()
  const [anoInicial, mesInicial] = chaves[0].split('-').map(Number)
  const [anoFinal, mesFinal] = chaves[chaves.length - 1]
    .split('-')
    .map(Number)

  const labels = []
  const queimadas = []
  const desmatamentos = []
  const totais = []

  let ano = anoInicial
  let mes = mesInicial

  while (ano < anoFinal || (ano === anoFinal && mes <= mesFinal)) {
    const chave = `${ano}-${String(mes).padStart(2, '0')}`
    const valores = contagem.get(chave) || {
      queimadas: 0,
      desmatamentos: 0,
    }

    labels.push(formatarMes(chave))
    queimadas.push(valores.queimadas)
    desmatamentos.push(valores.desmatamentos)
    totais.push(valores.queimadas + valores.desmatamentos)

    mes += 1
    if (mes > 12) {
      mes = 1
      ano += 1
    }
  }

  return { labels, queimadas, desmatamentos, totais }
}

export function descreverPeriodo(dataMinima, dataMaxima) {
  if (!dataMinima || !dataMaxima) return 'Sem dados no período'
  if (dataMinima === dataMaxima) return formatarData(dataMinima)

  return `${formatarData(dataMinima)} a ${formatarData(dataMaxima)}`
}

export function formatarPercentual(valor) {
  return `${Number(valor || 0).toFixed(1).replace('.', ',')}%`
}

function celulaCsv(valor) {
  if (valor === null || valor === undefined) return ''

  const texto = String(valor)
  if (/[";\r\n]/.test(texto)) {
    return `"${texto.replaceAll('"', '""')}"`
  }

  return texto
}

export function gerarCsv(linhas = []) {
  const corpo = linhas
    .map((linha) => linha.map(celulaCsv).join(';'))
    .join('\r\n')

  return `\uFEFF${corpo}\r\n`
}

export function linhasCsvOcorrencias(itens = []) {
  return [
    [
      'ID',
      'Tipo',
      'Município',
      'UF',
      'Data da ocorrência',
      'Latitude',
      'Longitude',
      'Descrição',
      'Criado em',
    ],
    ...itens.map((item) => [
      item.id,
      rotuloTipo(item.tipo),
      item.municipio,
      item.estado,
      formatarData(item.data_ocorrencia),
      item.latitude ?? '',
      item.longitude ?? '',
      item.descricao || '',
      item.created_at ? formatarDataHora(item.created_at) : '',
    ]),
  ]
}

export function linhasCsvResumo(linhas = []) {
  return [
    [
      'Município',
      'UF',
      'Queimadas',
      'Desmatamentos',
      'Total',
      'Participação (%)',
    ],
    ...linhas.map((linha) => [
      linha.municipio,
      linha.estado,
      linha.queimadas,
      linha.desmatamentos,
      linha.total,
      formatarPercentual(linha.percentual).replace('%', ''),
    ]),
  ]
}
