<script setup>
import { cn } from '@/lib/utils'

defineProps({
  modelValue: {
    type: [String, Number],
    default: '',
  },
  class: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['update:modelValue'])
</script>

<template>
  <select
    :value="modelValue"
    :class="
      cn(
        'flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm text-foreground shadow-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
        $props.class,
      )
    "
    v-bind="$attrs"
    @change="emit('update:modelValue', $event.target.value)"
  >
    <slot />
  </select>
</template>
