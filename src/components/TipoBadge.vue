<script setup>
import { computed } from 'vue'
import { Flame, TreePine } from 'lucide-vue-next'

import { Badge } from '@/components/ui/badge'
import { corTipo, rotuloTipo } from '@/utils/format'

const props = defineProps({
  tipo: {
    type: String,
    required: true,
  },
})

const rotulo = computed(() => rotuloTipo(props.tipo))
const cor = computed(() => corTipo(props.tipo))
const icone = computed(() => (props.tipo === 'queimada' ? Flame : TreePine))
</script>

<template>
  <Badge
    variant="outline"
    class="eco-badge tipo-badge"
    :style="{
      '--badge-cor': cor,
      color: cor,
      backgroundColor: `${cor}18`,
    }"
  >
    <component :is="icone" :size="13" :stroke-width="2.5" aria-hidden="true" />
    {{ rotulo }}
  </Badge>
</template>
