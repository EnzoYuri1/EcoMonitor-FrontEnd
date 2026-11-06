<script setup>
import BaseModal from './BaseModal.vue'
import { Button } from '@/components/ui/button'

defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    default: 'Confirmar ação',
  },
  message: {
    type: String,
    default: '',
  },
  confirmLabel: {
    type: String,
    default: 'Confirmar',
  },
  cancelLabel: {
    type: String,
    default: 'Cancelar',
  },
  variant: {
    type: String,
    default: 'danger',
  },
  loading: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue', 'confirm'])

function fechar() {
  emit('update:modelValue', false)
}
</script>

<template>
  <BaseModal
    :model-value="modelValue"
    :title="title"
    size="sm"
    :close-on-backdrop="!loading"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <p class="mb-0 mensagem-confirmacao">{{ message }}</p>

    <template #footer>
      <Button
        type="button"
        variant="outline"
        :disabled="loading"
        @click="fechar"
      >
        {{ cancelLabel }}
      </Button>
      <Button
        type="button"
        :variant="variant === 'danger' ? 'destructive' : 'default'"
        :disabled="loading"
        @click="emit('confirm')"
      >
        {{ confirmLabel }}
      </Button>
    </template>
  </BaseModal>
</template>
