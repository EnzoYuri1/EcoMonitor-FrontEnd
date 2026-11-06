<script setup>
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogRoot,
  DialogTitle,
} from 'reka-ui'
import { X } from 'lucide-vue-next'
import { cn } from '@/lib/utils'

defineProps({
  open: {
    type: Boolean,
    default: false,
  },
  side: {
    type: String,
    default: 'left',
  },
  class: {
    type: [String, Array, Object],
    default: '',
  },
})

const emit = defineEmits(['update:open'])
</script>

<template>
  <DialogRoot :open="open" @update:open="emit('update:open', $event)">
    <DialogPortal>
      <DialogOverlay class="sheet-overlay" />
      <DialogContent
        :class="cn('sheet-content', `sheet-content-${side}`, $props.class)"
        aria-describedby="sheet-description"
      >
        <DialogTitle class="sr-only">Menu principal</DialogTitle>
        <DialogDescription id="sheet-description" class="sr-only">
          Navegação principal do EcoMonitor.
        </DialogDescription>
        <slot />
        <DialogClose class="sheet-close" aria-label="Fechar menu">
          <X :size="18" aria-hidden="true" />
        </DialogClose>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>
