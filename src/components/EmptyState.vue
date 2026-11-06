<script setup>
import {
  ChartNoAxesColumnIncreasing,
  CheckCircle,
  ClipboardPlus,
  ClipboardX,
  CircleAlert,
  FileChartColumn,
  Inbox,
  MapPin,
} from 'lucide-vue-next'
import { computed } from 'vue'

const props = defineProps({
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

const icones = {
  'bi-inbox': Inbox,
  'bi-file-earmark-bar-graph': FileChartColumn,
  'bi-clipboard-x': ClipboardX,
  'bi-exclamation-circle': CircleAlert,
  'bi-geo-alt': MapPin,
  'bi-check2-circle': CheckCircle,
  'bi-clipboard-plus': ClipboardPlus,
}

const componenteIcone = computed(
  () => icones[props.icone] || ChartNoAxesColumnIncreasing,
)
</script>

<template>
  <div class="text-center py-5 px-3 empty-state">
    <div class="empty-icon" aria-hidden="true">
      <component
        :is="componenteIcone"
        :size="24"
        :stroke-width="1.8"
      />
    </div>
    <h3 class="h5 mt-3 mb-2">{{ titulo }}</h3>
    <p v-if="descricao" class="text-secondary mb-4 mx-auto empty-descricao">
      {{ descricao }}
    </p>
    <div class="empty-actions">
      <slot />
    </div>
  </div>
</template>
