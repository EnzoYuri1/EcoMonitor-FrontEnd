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
  disabled: {
    type: Boolean,
    default: false,
  },
})

defineEmits(['update:page'])

const totalPaginas = computed(() => Math.max(props.pages || 0, 1))
const podeVoltar = computed(
  () => !props.disabled && props.page > 1,
)
const podeAvancar = computed(
  () =>
    !props.disabled &&
    props.pages > 0 &&
    props.page < props.pages,
)
const rotuloTotal = computed(
  () =>
    `${formatarNumero(props.total)} ${
      props.total === 1 ? 'registro' : 'registros'
    }`,
)
</script>

<template>
  <nav
    v-if="total > 0"
    class="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-2 mt-3"
    aria-label="Paginação de ocorrências"
  >
    <span class="small text-secondary">
      Página {{ page }} de {{ totalPaginas }} — {{ rotuloTotal }}
    </span>

    <div class="btn-group" role="group" aria-label="Navegar entre páginas">
      <button
        type="button"
        class="btn btn-outline-secondary btn-sm"
        :disabled="!podeVoltar"
        @click="$emit('update:page', page - 1)"
      >
        <i class="bi bi-chevron-left me-1"></i>
        Anterior
      </button>
      <button
        type="button"
        class="btn btn-outline-secondary btn-sm"
        :disabled="!podeAvancar"
        @click="$emit('update:page', page + 1)"
      >
        Próxima
        <i class="bi bi-chevron-right ms-1"></i>
      </button>
    </div>
  </nav>
</template>
