import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

import {
  enriquecerOcorrencia,
  historicoDemo,
} from '@/utils/demo'
import { rotuloStatus } from '@/utils/format'

/*
 * Estado demonstrativo de status.
 *
 * A API não possui campo de status. Para que os controles da interface
 * tenham comportamento real, a alteração fica apenas no navegador e é
 * identificada como demonstrativa. Nenhuma requisição é enviada.
 */

const CHAVE = 'ecomonitor.demo.status'

function lerStatus() {
  try {
    if (typeof window === 'undefined') return {}
    const bruto = window.localStorage.getItem(CHAVE)
    const dados = bruto ? JSON.parse(bruto) : {}
    return dados && typeof dados === 'object' ? dados : {}
  } catch {
    return {}
  }
}

function salvarStatus(valor) {
  try {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(CHAVE, JSON.stringify(valor))
  } catch {
    // O armazenamento local pode estar indisponível.
  }
}

export const useDemoStore = defineStore('demo', () => {
  const statusPorId = ref(lerStatus())

  watch(statusPorId, salvarStatus, { deep: true })

  function enriquecer(item, responsavel = 'Equipe de monitoramento') {
    const base = enriquecerOcorrencia(item)
    const override = statusPorId.value[String(item.id)]

    if (!override) {
      return {
        ...base,
        historico: historicoDemo(item, responsavel),
      }
    }

    return {
      ...base,
      status: override.status,
      statusRotulo: rotuloStatus(override.status),
      historico: [
        {
          data: override.data,
          titulo: `Status alterado para ${rotuloStatus(override.status)}`,
          descricao: `${override.responsavel} atualizou o status do registro.`,
        },
        ...historicoDemo(item, responsavel),
      ],
    }
  }

  function enriquecerLista(itens = [], responsavel) {
    return itens.map((item) => enriquecer(item, responsavel))
  }

  function atualizarStatus(id, status, responsavel) {
    statusPorId.value = {
      ...statusPorId.value,
      [String(id)]: {
        status,
        responsavel,
        data: new Date().toISOString(),
      },
    }
  }

  return {
    statusPorId,
    enriquecer,
    enriquecerLista,
    atualizarStatus,
  }
})
