<script setup>
import { Check } from 'lucide-vue-next'
import { cn } from '@/lib/utils'

defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  class: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['update:modelValue'])
</script>

<template>
  <button
    type="button"
    role="checkbox"
    :aria-checked="modelValue"
    :class="
      cn(
        'inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border border-input bg-background text-foreground shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
        modelValue && 'bg-primary text-primary-foreground',
        $props.class,
      )
    "
    v-bind="$attrs"
    @click="emit('update:modelValue', !modelValue)"
  >
    <Check v-if="modelValue" :size="12" stroke-width="3" aria-hidden="true" />
  </button>
</template>
