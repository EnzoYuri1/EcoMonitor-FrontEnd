<script setup>
defineProps({
  titulo: {
    type: String,
    required: true,
  },
  valor: {
    type: [Number, String],
    default: '0',
  },
  unidade: {
    type: String,
    default: '',
  },
  descricao: {
    type: String,
    default: '',
  },
  destaque: {
    type: String,
    default: '',
  },
})
</script>

<template>
  <div class="kpi-card" :class="destaque ? `kpi-card-${destaque}` : ''">
    <p class="kpi-label">{{ titulo }}</p>
    <p class="kpi-value">
      <span class="kpi-numero">{{ valor }}</span>
      <span v-if="unidade" class="kpi-unidade">{{ unidade }}</span>
    </p>
    <p v-if="descricao" class="kpi-descricao">{{ descricao }}</p>
  </div>
</template>
