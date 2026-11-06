<script setup>
import { computed } from 'vue'

import { Badge } from '@/components/ui/badge'
import { corSeveridade, rotuloSeveridade } from '@/utils/format'

const props = defineProps({
  severidade: {
    type: String,
    required: true,
  },
  comRotulo: {
    type: Boolean,
    default: true,
  },
})

const rotulo = computed(() => rotuloSeveridade(props.severidade))
const cor = computed(() => corSeveridade(props.severidade))
</script>

<template>
  <Badge
    variant="outline"
    class="eco-badge severity-badge"
    :style="{
      color: cor,
      backgroundColor: `${cor}18`,
    }"
  >
    <span class="severity-bars" aria-hidden="true">
      <span></span>
      <span></span>
      <span></span>
    </span>
    <span v-if="comRotulo">{{ rotulo }}</span>
  </Badge>
</template>
