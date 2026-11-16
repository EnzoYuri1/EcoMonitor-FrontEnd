import {
  BIOMAS_POR_UF,
  SEVERIDADES,
  STATUS_LABELS,
} from './constants'

/*
 * Camada de apresentação demonstrativa.
 *
 * Severidade, área e bioma permanecem indicadores visuais demonstrativos.
 * Status, anexos e histórico vêm do backend e não devem ser simulados.
 */

function hash(texto) {
  let valor = 2166136261
  const conteudo = String(texto)

  for (let indice = 0; indice < conteudo.length; indice += 1) {
    valor ^= conteudo.charCodeAt(indice)
    valor = Math.imul(valor, 16777619)
  }

  return Math.abs(valor)
}

function sufixo(id) {
  return String(id ?? 0).padStart(4, '0').slice(-4)
}

function severidadeDemo(chave) {
  const indice = hash(`${chave}:severidade`) % 10

  if (indice < 2) return 'critica'
  if (indice < 5) return 'alta'
  if (indice < 8) return 'moderada'
  return 'baixa'
}

function areaDemo(chave) {
  const bruto = hash(`${chave}:area`) % 2400
  return Math.round((5 + bruto / 10) * 10) / 10
}

function rotuloStatus(status) {
  return STATUS_LABELS[status] || status
}

function rotuloSeveridade(severidade) {
  return (
    SEVERIDADES.find((item) => item.value === severidade)?.label ||
    severidade
  )
}

export function codigoOcorrencia(item = {}) {
  const ano = String(
    item.data_ocorrencia || item.created_at || '',
  ).slice(0, 4)
  return `EC-${ano || '2026'}-${sufixo(item.id)}`
}

export function enriquecerOcorrencia(item = {}) {
  const chave = `${item.id}:${item.tipo}:${item.estado}`
  const severidade = severidadeDemo(chave)
  const status = item.status || 'registrada'
  const ano = String(
    item.data_ocorrencia || item.created_at || '',
  ).slice(0, 4)

  return {
    ...item,
    demo: true,
    codigo: `EC-${ano || '2026'}-${sufixo(item.id)}`,
    severidade,
    severidadeRotulo: rotuloSeveridade(severidade),
    status,
    statusRotulo: rotuloStatus(status),
    area_estimada: areaDemo(chave),
    bioma: BIOMAS_POR_UF[item.estado] || 'Cerrado',
    cobertura:
      item.tipo === 'desmatamento'
        ? 'Vegetação nativa'
        : 'Formação florestal',
    metodo_registro: 'Análise visual',
  }
}

export function enriquecerLista(itens = []) {
  return itens.map(enriquecerOcorrencia)
}

export function periodoDoMes(mes) {
  const [ano, numeroMes] = String(mes || '').split('-').map(Number)
  if (!ano || !numeroMes) return { inicio: '', fim: '' }

  const ultimoDia = new Date(ano, numeroMes, 0).getDate()

  return {
    inicio: `${ano}-${String(numeroMes).padStart(2, '0')}-01`,
    fim: `${ano}-${String(numeroMes).padStart(2, '0')}-${String(
      ultimoDia,
    ).padStart(2, '0')}`,
  }
}

export function mesDaData(valor) {
  const texto = String(valor || '').slice(0, 7)
  return /^\d{4}-\d{2}$/.test(texto) ? texto : ''
}

export function mesMaisRepresentativo(itens = []) {
  const contagem = new Map()

  for (const item of itens) {
    const mes = mesDaData(item?.data_ocorrencia)
    if (!mes) continue
    contagem.set(mes, (contagem.get(mes) || 0) + 1)
  }

  let escolhido = ''
  let maior = -1

  for (const [mes, total] of contagem) {
    if (total > maior || (total === maior && mes > escolhido)) {
      escolhido = mes
      maior = total
    }
  }

  return escolhido
}

export function mesesDisponiveis(itens = []) {
  const contagem = new Map()

  for (const item of itens) {
    const mes = mesDaData(item?.data_ocorrencia)
    if (!mes) continue
    contagem.set(mes, (contagem.get(mes) || 0) + 1)
  }

  return [...contagem.entries()]
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .map(([mes, total]) => ({ mes, total }))
}

export function filtrarOcorrencias(itens = [], filtros = {}) {
  const busca = String(filtros.busca || '')
    .trim()
    .toLowerCase()

  return itens.filter((item) => {
    if (filtros.tipo && item.tipo !== filtros.tipo) return false
    if (filtros.estado && item.estado !== filtros.estado) return false
    if (filtros.severidade && item.severidade !== filtros.severidade) {
      return false
    }
    if (filtros.status && item.status !== filtros.status) return false

    const data = String(item.data_ocorrencia || '').slice(0, 10)
    if (filtros.data_inicio && data < filtros.data_inicio) return false
    if (filtros.data_fim && data > filtros.data_fim) return false

    if (filtros.mes && !data.startsWith(filtros.mes)) return false

    if (busca) {
      const alvo = `${item.codigo || ''} ${item.municipio || ''} ${
        item.estado || ''
      }`.toLowerCase()
      if (!alvo.includes(busca)) return false
    }

    return true
  })
}

export function calcularIndicadores(itens = []) {
  const estados = new Set()
  const municipios = new Set()
  let areaTotal = 0
  let emExecucao = 0
  let emValidacao = 0
  let concluidas = 0
  let criticas = 0
  let queimadas = 0
  let desmatamentos = 0

  for (const item of itens) {
    areaTotal += Number(item.area_estimada) || 0

    if (item.status === 'em_execucao') emExecucao += 1
    if (item.status === 'em_validacao') emValidacao += 1
    if (item.status === 'concluida') concluidas += 1
    if (item.severidade === 'critica') criticas += 1
    if (item.tipo === 'queimada') queimadas += 1
    if (item.tipo === 'desmatamento') desmatamentos += 1
    if (item.estado) estados.add(item.estado)

    if (item.municipio) {
      municipios.add(
        `${item.municipio.toLowerCase()}|||${item.estado || ''}`,
      )
    }
  }

  return {
    total: itens.length,
    areaTotal: Math.round(areaTotal * 10) / 10,
    emExecucao,
    emValidacao,
    concluidas,
    criticas,
    queimadas,
    desmatamentos,
    estados: estados.size,
    municipios: municipios.size,
    percentualEmExecucao:
      itens.length > 0 ? (emExecucao / itens.length) * 100 : 0,
    percentualCriticas:
      itens.length > 0 ? (criticas / itens.length) * 100 : 0,
    percentualQueimadas:
      itens.length > 0 ? (queimadas / itens.length) * 100 : 0,
    percentualDesmatamentos:
      itens.length > 0 ? (desmatamentos / itens.length) * 100 : 0,
  }
}

export function compararComMesAnterior(itens = [], mes = '') {
  if (!mes) return null

  const [ano, numeroMes] = mes.split('-').map(Number)
  if (!ano || !numeroMes) return null

  const anterior = new Date(ano, numeroMes - 2, 1)
  const chaveAnterior = `${anterior.getFullYear()}-${String(
    anterior.getMonth() + 1,
  ).padStart(2, '0')}`

  const totalAtual = itens.filter((item) =>
    mesDaData(item.data_ocorrencia) === mes,
  ).length
  const totalAnterior = itens.filter(
    (item) => mesDaData(item.data_ocorrencia) === chaveAnterior,
  ).length

  if (!totalAnterior) return null

  return {
    mesAnterior: chaveAnterior,
    totalAnterior,
    totalAtual,
    variacao: ((totalAtual - totalAnterior) / totalAnterior) * 100,
  }
}

export function distribuirPorEstado(itens = []) {
  const grupos = new Map()
  let areaTotal = 0

  for (const item of itens) {
    areaTotal += Number(item.area_estimada) || 0

    const chave = item.estado || '—'
    if (!grupos.has(chave)) {
      grupos.set(chave, {
        estado: chave,
        ocorrencias: 0,
        area: 0,
        queimadas: 0,
        desmatamentos: 0,
      })
    }

    const grupo = grupos.get(chave)
    grupo.ocorrencias += 1
    grupo.area += Number(item.area_estimada) || 0
    if (item.tipo === 'queimada') grupo.queimadas += 1
    if (item.tipo === 'desmatamento') grupo.desmatamentos += 1
  }

  return [...grupos.values()]
    .map((grupo) => ({
      ...grupo,
      area: Math.round(grupo.area * 10) / 10,
      percentual:
        itens.length > 0 ? (grupo.ocorrencias / itens.length) * 100 : 0,
      participacaoArea:
        areaTotal > 0 ? (grupo.area / areaTotal) * 100 : 0,
    }))
    .sort(
      (a, b) =>
        b.ocorrencias - a.ocorrencias ||
        a.estado.localeCompare(b.estado, 'pt-BR'),
    )
}

export function distribuirPorTipo(itens = []) {
  const base = {
    queimada: { tipo: 'queimada', ocorrencias: 0, area: 0 },
    desmatamento: { tipo: 'desmatamento', ocorrencias: 0, area: 0 },
  }

  for (const item of itens) {
    const grupo = base[item.tipo]
    if (!grupo) continue
    grupo.ocorrencias += 1
    grupo.area += Number(item.area_estimada) || 0
  }

  return Object.values(base).map((grupo) => ({
    ...grupo,
    area: Math.round(grupo.area * 10) / 10,
    percentual:
      itens.length > 0 ? (grupo.ocorrencias / itens.length) * 100 : 0,
  }))
}
