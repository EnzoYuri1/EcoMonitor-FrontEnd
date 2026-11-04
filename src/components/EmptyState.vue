<script setup>
defineProps({
  titulo: {
    type: String,
    default: 'Nenhum registro encontrado',
  },
  descricao: {
    type: String,
    default: '',
  },
  icone: {
    type: String,
    default: 'bi-inbox',
  },
})
</script>

<template>
  <div class="text-center py-5 px-3 empty-state">
    <div class="empty-icon" aria-hidden="true">
      <i class="bi" :class="icone"></i>
    </div>
    <h3 class="h5 mt-3 mb-2">{{ titulo }}</h3>
    <p v-if="descricao" class="text-secondary mb-4 mx-auto empty-descricao">
      {{ descricao }}
    </p>
    <slot />
  </div>
</template>
