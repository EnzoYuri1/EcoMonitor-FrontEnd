<script setup>
import { computed } from 'vue'

import { formatarNumero } from '@/utils/format'

const props = defineProps({
  page: {
    type: Number,
    default: 1,
  },
  pages: {
    type: Number,
    default: 0,
  },
  total: {
    type: Number,
    default: 0,
  },
  pageSize: {
    type: Number,
    default: 8,
  },
  pageSizeOptions: {
    type: Array,
    default: () => [8, 10, 20, 50, 100],
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  substantivo: {
    type: String,
    default: 'ocorrências',
  },
})

const emit = defineEmits(['update:page', 'update:pageSize'])

const totalPaginas = computed(() => Math.max(props.pages || 0, 1))

const inicio = computed(() =>
  props.total === 0 ? 0 : (props.page - 1) * props.pageSize + 1,
)

const fim = computed(() =>
  props.total === 0
    ? 0
    : Math.min(props.page * props.pageSize, props.total),
)

const itensPagina = computed(() => {
  const total = totalPaginas.value
  const atual = props.page
  const janela = 2
  const paginas = []

  let inicioJanela = Math.max(1, atual - janela)
  let fimJanela = Math.min(total, atual + janela)

  if (fimJanela - inicioJanela < janela * 2) {
    inicioJanela = Math.max(1, fimJanela - janela * 2)
  }

  if (inicioJanela > 1) {
    paginas.push(1)
    if (inicioJanela > 2) paginas.push('…')
  }

  for (let numero = inicioJanela; numero <= fimJanela; numero += 1) {
    paginas.push(numero)
  }

  if (fimJanela < total) {
    if (fimJanela < total - 1) paginas.push('…')
    paginas.push(total)
  }

  return paginas
})

function irPara(numero) {
  if (props.disabled) return
  if (typeof numero !== 'number') return
  if (numero < 1 || numero > props.pages) return
  if (numero === props.page) return
  emit('update:page', numero)
}

function alterarTamanho(evento) {
  emit('update:pageSize', Number(evento.target.value))
}
</script>

<template>
  <div class="table-footer">
    <p class="table-footer-info">
      Exibindo <strong>{{ formatarNumero(inicio) }}–{{ formatarNumero(fim) }}</strong>
      de <strong>{{ formatarNumero(total) }}</strong> {{ substantivo }}
    </p>

    <div class="table-footer-controls">
      <label class="page-size-control">
        <select
          class="form-select form-select-sm"
          :value="pageSize"
          :disabled="disabled"
          aria-label="Itens por página"
          @change="alterarTamanho"
        >
          <option
            v-for="opcao in pageSizeOptions"
            :key="opcao"
            :value="opcao"
          >
            {{ opcao }}
          </option>
        </select>
        <span>por página</span>
      </label>

      <nav class="eco-pagination" aria-label="Paginação">
        <button
          type="button"
          class="eco-page-btn"
          :disabled="disabled || page <= 1"
          aria-label="Página anterior"
          @click="irPara(page - 1)"
        >
          <i class="bi bi-chevron-left" aria-hidden="true"></i>
        </button>

        <template v-for="(numero, indice) in itensPagina" :key="`${numero}-${indice}`">
          <span v-if="numero === '…'" class="eco-page-gap" aria-hidden="true">…</span>
          <button
            v-else
            type="button"
            class="eco-page-btn"
            :class="{ 'eco-page-btn-ativa': numero === page }"
            :aria-current="numero === page ? 'page' : undefined"
            :disabled="disabled"
            @click="irPara(numero)"
          >
            {{ numero }}
          </button>
        </template>

        <button
          type="button"
          class="eco-page-btn"
          :disabled="disabled || page >= pages"
          aria-label="Próxima página"
          @click="irPara(page + 1)"
        >
          <i class="bi bi-chevron-right" aria-hidden="true"></i>
        </button>
      </nav>
    </div>
  </div>
</template>
