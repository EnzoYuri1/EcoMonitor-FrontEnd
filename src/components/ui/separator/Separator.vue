<script setup>
import { cn } from '@/lib/utils'

defineProps({
  class: {
    type: String,
    default: '',
  },
})
</script>

<template>
  <div role="separator" :class="cn('shrink-0 bg-border h-px w-full', $props.class)"></div>
</template>
