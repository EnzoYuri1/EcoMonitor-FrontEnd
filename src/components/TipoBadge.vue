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
  props.tipo === 'queimada' ? '🔥' : '🌳',
)
</script>

<template>
  <span
    class="badge tipo-badge"
    :style="{
      backgroundColor: `${cor}14`,
      color: cor,
      borderColor: `${cor}55`,
    }"
  >
    <span aria-hidden="true">{{ icone }}</span>
    {{ rotulo }}
  </span>
</template>
