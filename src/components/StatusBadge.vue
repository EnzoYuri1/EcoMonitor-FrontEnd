<script setup>
import { computed } from 'vue'

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
  <span
    class="badge eco-badge status-badge"
    :style="{
      color: cor,
      backgroundColor: `${cor}18`,
    }"
  >
    <span class="badge-dot" aria-hidden="true"></span>
    {{ rotulo }}
  </span>
</template>
