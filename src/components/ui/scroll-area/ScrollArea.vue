<script setup>
import { ref } from 'vue'

import { cn } from '@/lib/utils'

defineProps({
  class: {
    type: String,
    default: '',
  },
})

const viewport = ref(null)

defineExpose({
  get scrollTop() {
    return viewport.value?.scrollTop || 0
  },
  set scrollTop(value) {
    if (viewport.value) viewport.value.scrollTop = value
  },
  get scrollHeight() {
    return viewport.value?.scrollHeight || 0
  },
})
</script>

<template>
  <div ref="viewport" :class="cn('relative overflow-auto', $props.class)">
    <slot />
  </div>
</template>
