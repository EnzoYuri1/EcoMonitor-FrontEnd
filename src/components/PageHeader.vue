<script setup>
defineProps({
  eyebrow: {
    type: String,
    default: '',
  },
  titulo: {
    type: String,
    required: true,
  },
  descricao: {
    type: String,
    default: '',
  },
})
</script>

<template>
  <header class="page-header">
    <div class="page-header-texto">
      <p v-if="eyebrow" class="page-eyebrow">{{ eyebrow }}</p>
      <h1 class="page-title">{{ titulo }}</h1>
      <p v-if="descricao" class="page-description">{{ descricao }}</p>
    </div>

    <div v-if="$slots.acoes" class="page-actions">
      <slot name="acoes" />
    </div>
  </header>
</template>
