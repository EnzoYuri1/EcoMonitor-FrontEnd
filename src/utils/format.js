import { TIPO_CORES, TIPO_LABELS } from './constants'

export function formatarData(valor) {
  if (!valor) return '—'

  const texto = String(valor).slice(0, 10)
  const [ano, mes, dia] = texto.split('-')

  if (!ano || !mes || !dia) return String(valor)

  return `${dia}/${mes}/${ano}`
}

export function formatarDataHora(valor) {
  if (!valor) return '—'

  const data = new Date(valor)

  if (Number.isNaN(data.getTime())) return String(valor)

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(data)
}

export function formatarNumero(valor) {
  return new Intl.NumberFormat('pt-BR').format(Number(valor) || 0)
}

export function rotuloTipo(tipo) {
  return TIPO_LABELS[tipo] || tipo
}

export function corTipo(tipo) {
  return TIPO_CORES[tipo] || '#6B7280'
}

export function formatarResponsavel(createdBy, userId) {
  return Number(createdBy) === Number(userId) ? 'Você' : 'Outro usuário'
}

export function dataHojeISO() {
  const agora = new Date()
  const local = new Date(agora.getTime() - agora.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 10)
}

export function formatarMes(chave) {
  const [ano, mes] = String(chave).split('-')
  return ano && mes ? `${mes}/${ano}` : String(chave)
}

export function truncar(texto, limite = 80) {
  if (!texto) return ''
  const valor = String(texto)
  return valor.length > limite ? `${valor.slice(0, limite).trimEnd()}...` : valor
}
