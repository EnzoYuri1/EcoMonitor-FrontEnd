import {
  SEVERIDADE_CORES,
  SEVERIDADE_LABELS,
  STATUS_CORES,
  STATUS_LABELS,
  TIPO_CORES,
  TIPO_LABELS,
} from './constants'

const MESES_CURTOS = [
  'jan',
  'fev',
  'mar',
  'abr',
  'mai',
  'jun',
  'jul',
  'ago',
  'set',
  'out',
  'nov',
  'dez',
]

const MESES_LONGOS = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
]

function partesData(valor) {
  const texto = String(valor || '').slice(0, 10)
  const [ano, mes, dia] = texto.split('-').map(Number)

  if (!ano || !mes || !dia) return null
  return { ano, mes, dia }
}

function paraDataLocal(valor) {
  const partes = partesData(valor)
  if (!partes) return null

  const data = new Date(partes.ano, partes.mes - 1, partes.dia)
  return Number.isNaN(data.getTime()) ? null : data
}

export function formatarData(valor) {
  if (!valor) return '—'

  const partes = partesData(valor)
  if (!partes) return String(valor)

  const { ano, mes, dia } = partes
  return `${String(dia).padStart(2, '0')}/${String(mes).padStart(
    2,
    '0',
  )}/${ano}`
}

export function formatarDataHora(valor) {
  if (!valor) return '—'

  const ehDataSimples = /^\d{4}-\d{2}-\d{2}$/.test(String(valor))
  const data = ehDataSimples
    ? paraDataLocal(valor)
    : new Date(valor)

  if (!data || Number.isNaN(data.getTime())) return String(valor)

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(data)
}

export function formatarDataLonga(valor) {
  if (!valor) return '—'

  const data = paraDataLocal(valor)
  if (!data) return String(valor)

  const { ano, mes, dia } = partesData(valor)
  return `${String(dia).padStart(2, '0')} ${
    MESES_CURTOS[mes - 1]
  } ${ano}`
}

export function formatarDataHoraLonga(valor) {
  if (!valor) return '—'

  const data = new Date(valor)
  if (Number.isNaN(data.getTime())) return String(valor)

  const dataLonga = formatarDataLonga(valor)
  const horario = new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(data)

  return `${dataLonga}, ${horario}`
}

export function formatarHorario(valor) {
  if (!valor) return '—'

  const data = new Date(valor)
  if (Number.isNaN(data.getTime())) return String(valor)

  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(data)
}

export function formatarNumero(valor) {
  return new Intl.NumberFormat('pt-BR').format(Number(valor) || 0)
}

export function formatarArea(valor, casas = 1) {
  const numero = Number(valor)
  if (!Number.isFinite(numero)) return '—'

  const decimais = Number.isInteger(numero) ? 0 : casas

  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: decimais,
    maximumFractionDigits: decimais,
  }).format(numero)
}

export function formatarAreaComUnidade(valor, casas = 1) {
  return `${formatarArea(valor, casas)} ha`
}

export function formatarPercentual(valor, casas = 1) {
  const numero = Number(valor)
  if (!Number.isFinite(numero)) return '—'

  return `${new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: casas,
    maximumFractionDigits: casas,
  }).format(numero)}%`
}

export function formatarCoordenada(valor) {
  const numero = Number(valor)
  if (!Number.isFinite(numero)) return '—'

  return `${new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  }).format(numero)}°`
}

export function rotuloTipo(tipo) {
  return TIPO_LABELS[tipo] || tipo
}

export function corTipo(tipo) {
  return TIPO_CORES[tipo] || '#6B7280'
}

export function rotuloSeveridade(severidade) {
  return SEVERIDADE_LABELS[severidade] || severidade || '—'
}

export function corSeveridade(severidade) {
  return SEVERIDADE_CORES[severidade] || '#A9BAB1'
}

export function rotuloStatus(status) {
  return STATUS_LABELS[status] || status || '—'
}

export function corStatus(status) {
  return STATUS_CORES[status] || '#A9BAB1'
}

export function formatarResponsavel(createdBy, userId) {
  return Number(createdBy) === Number(userId) ? 'Você' : 'Outro usuário'
}

export function dataHojeISO() {
  const agora = new Date()
  const local = new Date(
    agora.getTime() - agora.getTimezoneOffset() * 60000,
  )
  return local.toISOString().slice(0, 10)
}

export function formatarMes(chave) {
  const [ano, mes] = String(chave).split('-')
  return ano && mes ? `${mes}/${ano}` : String(chave)
}

export function formatarMesLongo(chave) {
  const [ano, mes] = String(chave).split('-').map(Number)
  if (!ano || !mes || mes < 1 || mes > 12) return String(chave)

  return `${MESES_LONGOS[mes - 1]} de ${ano}`
}

export function formatarMesCurto(chave) {
  const [ano, mes] = String(chave).split('-').map(Number)
  if (!ano || !mes || mes < 1 || mes > 12) return String(chave)

  return `${MESES_CURTOS[mes - 1]}/${ano}`
}

export function truncar(texto, limite = 80) {
  if (!texto) return ''
  const valor = String(texto)
  return valor.length > limite
    ? `${valor.slice(0, limite).trimEnd()}...`
    : valor
}

export function normalizarNumeroBrasileiro(valor) {
  if (typeof valor === 'number') return valor

  let texto = String(valor ?? '').trim().replace(/\s+/g, '')
  if (!texto) return null

  if (texto.includes(',')) {
    // Formato brasileiro: ponto como milhar e vírgula como decimal.
    texto = texto.replace(/\./g, '').replace(',', '.')
  } else if ((texto.match(/\./g) || []).length > 1) {
    // Vários pontos: o último é o separador decimal.
    const partes = texto.split('.')
    texto = `${partes.slice(0, -1).join('')}.${partes.at(-1)}`
  }

  const numero = Number(texto)
  return Number.isFinite(numero) ? numero : null
}
