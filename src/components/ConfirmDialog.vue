<script setup>
import BaseModal from './BaseModal.vue'

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
      <button
        type="button"
        class="btn btn-outline-secondary"
        :disabled="loading"
        @click="fechar"
      >
        {{ cancelLabel }}
      </button>
      <button
        type="button"
        class="btn"
        :class="`btn-${variant}`"
        :disabled="loading"
        @click="emit('confirm')"
      >
        <span
          v-if="loading"
          class="spinner-border spinner-border-sm me-2"
          aria-hidden="true"
        ></span>
        {{ confirmLabel }}
      </button>
    </template>
  </BaseModal>
</template>
