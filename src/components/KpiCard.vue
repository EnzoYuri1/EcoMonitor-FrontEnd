<script setup>
import { computed } from 'vue'

import { Card } from '@/components/ui/card'

const props = defineProps({
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

const classeDestaque = computed(() =>
  props.destaque ? `kpi-card-${props.destaque}` : '',
)
</script>

<template>
  <Card class="kpi-card" :class="classeDestaque">
    <p class="kpi-label">{{ titulo }}</p>
    <p class="kpi-value">
      <span class="kpi-numero">{{ valor }}</span>
      <span v-if="unidade" class="kpi-unidade">{{ unidade }}</span>
    </p>
    <p v-if="descricao" class="kpi-descricao">{{ descricao }}</p>
  </Card>
</template>
