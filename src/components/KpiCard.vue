<script setup>
import { computed } from 'vue'

import { formatarNumero } from '@/utils/format'

const props = defineProps({
  titulo: {
    type: String,
    required: true,
  },
  valor: {
    type: [Number, String],
    default: 0,
  },
  icone: {
    type: String,
    default: 'bi-clipboard-data',
  },
  cor: {
    type: String,
    default: '#15803D',
  },
  descricao: {
    type: String,
    default: '',
  },
})

const valorFormatado = computed(() => formatarNumero(props.valor))
</script>

<template>
  <div class="card kpi-card h-100">
    <div class="card-body d-flex align-items-center gap-3">
      <div
        class="kpi-icon"
        :style="{ backgroundColor: `${cor}1A`, color: cor }"
        aria-hidden="true"
      >
        <i class="bi" :class="icone"></i>
      </div>

      <div class="min-w-0">
        <p class="kpi-label mb-1">{{ titulo }}</p>
        <p class="kpi-value mb-0">{{ valorFormatado }}</p>
        <small v-if="descricao" class="text-secondary">
          {{ descricao }}
        </small>
      </div>
    </div>
  </div>
</template>
