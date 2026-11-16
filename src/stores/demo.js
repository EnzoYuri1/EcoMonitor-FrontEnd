import { defineStore } from 'pinia'

import { enriquecerOcorrencia } from '@/utils/demo'

export const useDemoStore = defineStore('demo', () => {
  function enriquecer(item) {
    const base = enriquecerOcorrencia(item)
    return {
      ...base,
      historico: (item.historico || []).map((evento) => ({
        data: evento.created_at,
        titulo: evento.acao.replaceAll('_', ' '),
        descricao: evento.descricao,
      })),
    }
  }

  function enriquecerLista(itens = []) {
    return itens.map(enriquecer)
  }

  return {
    enriquecer,
    enriquecerLista,
  }
})
