import { TIPOS } from './constants'
import { corTipo, formatarData, rotuloTipo, truncar } from './format'

export const MAPA_CENTRO_BRASIL = [-15.78, -47.93]
export const MAPA_ZOOM_INICIAL = 4
export const MAPA_ZOOM_AJUSTE_MAXIMO = 12
export const MAPA_PADDING_AJUSTE = [36, 36]
export const TAMANHO_PAGINA_MAPA = 100

export const BRASIL_LIMITES = [
  [-33.75, -73.99],
  [5.28, -34.79],
]

const FUNDOS_POPUP = {
  queimada: '#fff7ed',
  desmatamento: '#f0fdf4',
}

function numeroCoordenada(valor) {
  if (valor === null || valor === undefined || valor === '') return null

  const numero = typeof valor === 'number' ? valor : Number(valor)
  return Number.isFinite(numero) ? numero : null
}

export function coordenadaValida(latitude, longitude) {
  const lat = numeroCoordenada(latitude)
  const lon = numeroCoordenada(longitude)

  return (
    lat !== null &&
    lon !== null &&
    lat >= -90 &&
    lat <= 90 &&
    lon >= -180 &&
    lon <= 180
  )
}

export function separarOcorrenciasMapeaveis(itens = []) {
  const comCoordenadas = []
  const semCoordenadas = []

  for (const item of itens) {
    if (coordenadaValida(item?.latitude, item?.longitude)) {
      comCoordenadas.push(item)
    } else {
      semCoordenadas.push(item)
    }
  }

  return { comCoordenadas, semCoordenadas }
}

export function dentroDoBrasil(latitude, longitude) {
  if (!coordenadaValida(latitude, longitude)) return false

  const lat = Number(latitude)
  const lon = Number(longitude)

  return (
    lat >= BRASIL_LIMITES[0][0] &&
    lat <= BRASIL_LIMITES[1][0] &&
    lon >= BRASIL_LIMITES[0][1] &&
    lon <= BRASIL_LIMITES[1][1]
  )
}

export function calcularLimites(itens = []) {
  let sul = Infinity
  let oeste = Infinity
  let norte = -Infinity
  let leste = -Infinity

  for (const item of itens) {
    if (!coordenadaValida(item?.latitude, item?.longitude)) continue

    const latitude = Number(item.latitude)
    const longitude = Number(item.longitude)

    sul = Math.min(sul, latitude)
    oeste = Math.min(oeste, longitude)
    norte = Math.max(norte, latitude)
    leste = Math.max(leste, longitude)
  }

  if (sul === Infinity) return null

  return [
    [sul, oeste],
    [norte, leste],
  ]
}

export function contarPorTipo(itens = []) {
  const contagens = Object.fromEntries(
    TIPOS.map((tipo) => [tipo.value, 0]),
  )

  for (const item of itens) {
    if (Object.hasOwn(contagens, item?.tipo)) {
      contagens[item.tipo] += 1
    }
  }

  return contagens
}

export function escaparHtml(valor) {
  if (valor === null || valor === undefined) return ''

  return String(valor)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

export function formatarCoordenadas(latitude, longitude) {
  if (!coordenadaValida(latitude, longitude)) return '—'

  const formatar = (valor) =>
    Number(valor).toFixed(4).replace('.', ',')

  return `${formatar(latitude)}, ${formatar(longitude)}`
}

export function montarConteudoPopup(ocorrencia = {}) {
  const tipo = ocorrencia.tipo
  const cor = corTipo(tipo)
  const fundo = FUNDOS_POPUP[tipo] || '#f3f4f6'
  const local = [ocorrencia.municipio, ocorrencia.estado]
    .filter(Boolean)
    .map(escaparHtml)
    .join('/')

  return `
    <div class="mapa-popup">
      <span class="tipo-badge" style="color:${cor};background-color:${fundo};border-color:${cor}">
        ${escaparHtml(rotuloTipo(tipo))}
      </span>
      <h3 class="mapa-popup-titulo">${local || 'Local não informado'}</h3>
      <p class="mapa-popup-descricao">${escaparHtml(
        truncar(ocorrencia.descricao, 180),
      )}</p>
      <dl class="mapa-popup-lista">
        <dt>Data</dt>
        <dd>${escaparHtml(formatarData(ocorrencia.data_ocorrencia))}</dd>
        <dt>Coordenadas</dt>
        <dd>${escaparHtml(
          formatarCoordenadas(
            ocorrencia.latitude,
            ocorrencia.longitude,
          ),
        )}</dd>
      </dl>
    </div>
  `
}
