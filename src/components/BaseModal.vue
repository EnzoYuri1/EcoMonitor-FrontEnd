<script setup>
import { onBeforeUnmount, watch } from 'vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    default: '',
  },
  size: {
    type: String,
    default: 'lg',
  },
  closeOnBackdrop: {
    type: Boolean,
    default: true,
  },
})

const emit = defineEmits(['update:modelValue'])

function fechar() {
  emit('update:modelValue', false)
}

function aoPressionarTecla(evento) {
  if (evento.key === 'Escape') fechar()
}

function ativarScrollLock(ativo) {
  if (typeof document === 'undefined') return

  document.body.classList.toggle('modal-open', ativo)
  if (ativo) {
    document.addEventListener('keydown', aoPressionarTecla)
  } else {
    document.removeEventListener('keydown', aoPressionarTecla)
  }
}

watch(
  () => props.modelValue,
  (aberto) => ativarScrollLock(aberto),
  { immediate: true },
)

onBeforeUnmount(() => ativarScrollLock(false))
</script>

<template>
  <Teleport to="body">
    <template v-if="modelValue">
      <div
        class="modal fade show d-block"
        tabindex="-1"
        role="dialog"
        aria-modal="true"
        @click.self="closeOnBackdrop && fechar()"
      >
        <div
          class="modal-dialog modal-dialog-centered modal-dialog-scrollable"
          :class="`modal-${size}`"
        >
          <div class="modal-content">
            <div class="modal-header">
              <h2 class="modal-title fs-5">{{ title }}</h2>
              <button
                type="button"
                class="btn-close"
                aria-label="Fechar"
                @click="fechar"
              ></button>
            </div>

            <div class="modal-body">
              <slot />
            </div>

            <div v-if="$slots.footer" class="modal-footer">
              <slot name="footer" />
            </div>
          </div>
        </div>
      </div>

      <div class="modal-backdrop fade show"></div>
    </template>
  </Teleport>
</template>
