<script setup>
import { computed } from 'vue'

import { corTipo, rotuloTipo } from '@/utils/format'

const props = defineProps({
  tipo: {
    type: String,
    required: true,
  },
})

const rotulo = computed(() => rotuloTipo(props.tipo))
const cor = computed(() => corTipo(props.tipo))
const icone = computed(() =>
  props.tipo === 'queimada' ? 'bi-fire' : 'bi-tree',
)
</script>

<template>
  <span
    class="badge eco-badge tipo-badge"
    :style="{
      '--badge-cor': cor,
      color: cor,
      backgroundColor: `${cor}18`,
    }"
  >
    <i class="bi" :class="icone" aria-hidden="true"></i>
    {{ rotulo }}
  </span>
</template>
