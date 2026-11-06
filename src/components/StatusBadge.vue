<script setup>
import { computed } from 'vue'

import { Badge } from '@/components/ui/badge'
import { corStatus, rotuloStatus } from '@/utils/format'

const props = defineProps({
  status: {
    type: String,
    required: true,
  },
})

const rotulo = computed(() => rotuloStatus(props.status))
const cor = computed(() => corStatus(props.status))
</script>

<template>
  <Badge
    variant="outline"
    class="eco-badge status-badge"
    :style="{
      color: cor,
      backgroundColor: `${cor}18`,
    }"
  >
    <span class="badge-dot" aria-hidden="true"></span>
    {{ rotulo }}
  </Badge>
</template>
