<script setup>
import {
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from 'vue'

import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

import { TIPOS } from '@/utils/constants'
import { corTipo } from '@/utils/format'
import {
  dentroDoBrasil,
  formatarCoordenadas,
  MAPA_CENTRO_BRASIL,
} from '@/utils/map'

const props = defineProps({
  pontos: {
    type: Array,
    default: () => [],
  },
  poligonos: {
    type: Array,
    default: () => [],
  },
  altura: {
    type: String,
    default: '260px',
  },
  centro: {
    type: Array,
    default: null,
  },
  zoom: {
    type: Number,
    default: 4,
  },
  interativo: {
    type: Boolean,
    default: true,
  },
  editavel: {
    type: Boolean,
    default: false,
  },
  valor: {
    type: Array,
    default: null,
  },
  mostrarLegenda: {
    type: Boolean,
    default: false,
  },
  mostrarEscala: {
    type: Boolean,
    default: true,
  },
  rotulo: {
    type: String,
    default: 'Mapa de ocorrências',
  },
})

const emit = defineEmits(['selecionar', 'clique'])

const el = ref(null)

let mapa = null
let camadaPoligonos = null
let camadaPontos = null
let camadaValor = null
let escala = null

function coordenadaValida(latitude, longitude) {
  const lat = Number(latitude)
  const lon = Number(longitude)

  return (
    Number.isFinite(lat) &&
    Number.isFinite(lon) &&
    lat >= -90 &&
    lat <= 90 &&
    lon >= -180 &&
    lon <= 180
  )
}

function criarIcone(tipo) {
  return L.divIcon({
    className: 'mapa-marcador',
    html: `<span class="mapa-marcador-pino" style="--mapa-cor:${corTipo(
      tipo,
    )}"></span>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  })
}

function ajustar() {
  if (!mapa) return

  const coordsLimites = []

  for (const poly of props.poligonos || []) {
    const lista = Array.isArray(poly?.coordenadas) ? poly.coordenadas : []
    for (const par of lista) {
      if (Array.isArray(par) && coordenadaValida(par[0], par[1])) {
        coordsLimites.push([Number(par[0]), Number(par[1])])
      }
    }
  }

  const pontos = props.pontos.filter(
    (item) =>
      coordenadaValida(item.latitude, item.longitude) &&
      dentroDoBrasil(item.latitude, item.longitude),
  )

  for (const item of pontos) {
    coordsLimites.push([Number(item.latitude), Number(item.longitude)])
  }

  if (coordsLimites.length) {
    const limites = L.latLngBounds(coordsLimites)
    mapa.fitBounds(limites, { padding: [32, 32], maxZoom: 9 })
    return
  }

  if (props.valor && coordenadaValida(props.valor[0], props.valor[1])) {
    mapa.setView(
      [Number(props.valor[0]), Number(props.valor[1])],
      Math.max(props.zoom, 8),
    )
    return
  }

  mapa.setView(props.centro || MAPA_CENTRO_BRASIL, props.zoom)
}

function desenhar() {
  if (!mapa || !camadaPoligonos || !camadaPontos || !camadaValor) return

  camadaPoligonos.clearLayers()
  camadaPontos.clearLayers()
  camadaValor.clearLayers()

  for (const poly of props.poligonos || []) {
    const coords = (poly?.coordenadas || []).filter(
      (par) => Array.isArray(par) && coordenadaValida(par[0], par[1]),
    )
    if (coords.length < 3) continue

    const corBorda = poly.cor || '#dc2626'
    const corFill = poly.preenchimento || '#ef4444'
    const opacidadeFill =
      typeof poly.opacidade === 'number' ? poly.opacidade : 0.42

    const poligonoLeaflet = L.polygon(coords, {
      color: corBorda,
      weight: 2,
      opacity: 0.88,
      fillColor: corFill,
      fillOpacity: opacidadeFill,
      smoothFactor: 1.5,
      className: 'mapa-area-afetada',
    })

    if (poly.rotulo) {
      const textoTooltip = poly.subtitulo
        ? `<strong>${poly.rotulo}</strong><br/><span>${poly.subtitulo}</span>`
        : `<strong>${poly.rotulo}</strong>`
      poligonoLeaflet.bindTooltip(textoTooltip, {
        sticky: true,
        direction: 'top',
      })
    }

    poligonoLeaflet.on('click', () => {
      if (poly.aoClicar) poly.aoClicar(poly)
    })

    camadaPoligonos.addLayer(poligonoLeaflet)
  }

  for (const item of props.pontos) {
    if (
      !coordenadaValida(item.latitude, item.longitude) ||
      !dentroDoBrasil(item.latitude, item.longitude)
    ) {
      continue
    }

    const marcador = L.marker(
      [Number(item.latitude), Number(item.longitude)],
      {
        icon: criarIcone(item.tipo),
        title:
          item.codigo ||
          `${item.municipio || 'Ocorrência'}/${item.estado || ''}`,
      },
    )

    if (item.codigo || item.municipio) {
      marcador.bindTooltip(
        `${item.codigo ? `${item.codigo} · ` : ''}${
          item.municipio || ''
        }${item.estado ? `/${item.estado}` : ''}`,
        { direction: 'top', offset: [0, -8] },
      )
    }

    marcador.on('click', () => emit('selecionar', item))
    camadaPontos.addLayer(marcador)
  }

  if (props.valor && coordenadaValida(props.valor[0], props.valor[1])) {
    const latitude = Number(props.valor[0])
    const longitude = Number(props.valor[1])

    L.circleMarker([latitude, longitude], {
      radius: 9,
      color: '#3DDC97',
      weight: 2,
      fillColor: '#3DDC97',
      fillOpacity: 0.28,
    }).addTo(camadaValor)
  }

  ajustar()
}

function inicializar() {
  if (mapa || !el.value) return

  mapa = L.map(el.value, {
    center: props.centro || MAPA_CENTRO_BRASIL,
    zoom: props.zoom,
    minZoom: 3,
    zoomControl: props.interativo,
    scrollWheelZoom: props.interativo,
    dragging: props.interativo,
    doubleClickZoom: props.interativo,
    boxZoom: props.interativo,
    keyboard: props.interativo,
    tap: props.interativo,
    attributionControl: true,
  })

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>',
  }).addTo(mapa)

  camadaPoligonos = L.layerGroup().addTo(mapa)
  camadaPontos = L.layerGroup().addTo(mapa)
  camadaValor = L.layerGroup().addTo(mapa)

  if (props.mostrarEscala) {
    escala = L.control.scale({
      imperial: false,
      position: 'bottomleft',
      maxWidth: 90,
    })
    escala.addTo(mapa)
  }

  if (props.editavel) {
    mapa.on('click', (evento) => {
      emit('clique', {
        latitude: Number(evento.latlng.lat.toFixed(5)),
        longitude: Number(evento.latlng.lng.toFixed(5)),
      })
    })
  }

  desenhar()
  nextTick(() => mapa?.invalidateSize())
}

onMounted(inicializar)

watch(
  () => props.pontos,
  () => {
    desenhar()
  },
  { deep: true },
)

watch(
  () => props.poligonos,
  () => {
    desenhar()
  },
  { deep: true },
)

watch(
  () => props.valor,
  () => {
    desenhar()
  },
  { deep: true },
)

onBeforeUnmount(() => {
  if (mapa) {
    mapa.remove()
    mapa = null
  }

  camadaPoligonos = null
  camadaPontos = null
  camadaValor = null
  escala = null
})
</script>

<template>
  <div class="mini-mapa-wrap">
    <div
      ref="el"
      class="mini-mapa"
      :style="{ height: altura }"
      role="application"
      :aria-label="rotulo"
    ></div>

    <div v-if="mostrarLegenda" class="mini-mapa-legenda">
      <span
        v-for="tipo in TIPOS"
        :key="tipo.value"
        class="mini-mapa-legenda-item"
      >
        <span
          class="mini-mapa-ponto"
          :style="{ backgroundColor: corTipo(tipo.value) }"
          aria-hidden="true"
        ></span>
        {{ tipo.label }}
      </span>
    </div>

    <p v-if="editavel" class="mini-mapa-dica">
      Clique no mapa para preencher as coordenadas.
    </p>

    <p v-else-if="valor" class="mini-mapa-coordenadas">
      {{ formatarCoordenadas(valor[0], valor[1]) }}
    </p>
  </div>
</template>
