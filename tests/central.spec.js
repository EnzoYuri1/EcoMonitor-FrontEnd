import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import ArtigoCard from '@/components/ArtigoCard.vue'
import NoticiaCard from '@/components/NoticiaCard.vue'
import api from '@/services/api'
import {
  buscarNaCentral,
  dispararAtualizacaoCentral,
  listarArtigosCentral,
  listarNoticiasCentral,
  obterDestaquesCentral,
  obterMonitoramentoCentral,
  obterStatusCentral,
} from '@/services/central'
import {
  construirPoligonoAreaAfetadaNoticia,
  construirPontoMapaNoticia,
  cruzarImpactoComMonitoramento,
  inferirLocalizacaoNoticia,
  REGIOES_AREA_AFETADA,
} from '@/utils/noticiaImpacto'

describe('serviço da Central de Informações Ambientais', () => {
  let adaptador

  beforeEach(() => {
    adaptador = vi.fn((config) =>
      Promise.resolve({
        data: { ok: true, url: config.url, params: config.params },
        status: 200,
        statusText: '200',
        headers: {},
        config,
      }),
    )
    api.defaults.adapter = adaptador
  })

  it('consulta destaques, notícias, artigos, monitoramento, busca e status removendo filtros vazios', async () => {
    await obterDestaquesCentral()
    expect(adaptador.mock.calls[0][0].url).toBe('/central/destaques')

    await listarNoticiasCentral({
      categoria: 'queimadas',
      termo: '',
      page: 2,
    })
    expect(adaptador.mock.calls[1][0].url).toBe('/central/noticias')
    expect(adaptador.mock.calls[1][0].params).toEqual({
      categoria: 'queimadas',
      page: 2,
    })

    await listarArtigosCentral({
      filtro: 'brasileiras',
      ordenar: 'relevantes',
    })
    expect(adaptador.mock.calls[2][0].url).toBe('/central/artigos')
    expect(adaptador.mock.calls[2][0].params).toEqual({
      filtro: 'brasileiras',
      ordenar: 'relevantes',
    })

    await obterMonitoramentoCentral({ estado: 'PA', tipo_metrica: '' })
    expect(adaptador.mock.calls[3][0].url).toBe('/central/monitoramento')
    expect(adaptador.mock.calls[3][0].params).toEqual({ estado: 'PA' })

    await buscarNaCentral({ q: 'Queimadas no Pará', escopo: 'todas' })
    expect(adaptador.mock.calls[4][0].url).toBe('/central/busca')
    expect(adaptador.mock.calls[4][0].params).toEqual({
      q: 'Queimadas no Pará',
      escopo: 'todas',
    })

    await obterStatusCentral()
    expect(adaptador.mock.calls[5][0].url).toBe('/central/status')

    await dispararAtualizacaoCentral('noticias')
    expect(adaptador.mock.calls[6][0].url).toBe('/central/atualizar')
    expect(adaptador.mock.calls[6][0].params).toEqual({ escopo: 'noticias' })
  })
})

describe('componentes NoticiaCard e ArtigoCard', () => {
  it('renderiza notícia identificando veículo, data de publicação, data de coleta e link original', () => {
    const wrapper = mount(NoticiaCard, {
      props: {
        noticia: {
          id: 10,
          titulo: 'Monitoramento registra novos focos no sul do Pará',
          descricao: 'Dados apontam concentração de calor em áreas de floresta.',
          imagem_url: 'https://exemplo.org/foto.jpg',
          veiculo: 'Mongabay Brasil',
          origem_integracao: 'rss:mongabay_brasil',
          url_original: 'https://brasil.mongabay.com/materia-teste',
          data_publicacao: '2026-11-15T12:00:00Z',
          categoria: 'para',
          coletado_em: '2026-11-16T10:30:00Z',
        },
      },
    })

    expect(wrapper.text()).toContain('Mongabay Brasil')
    expect(wrapper.text()).toContain('Pará')
    expect(wrapper.text()).toContain('Publicado: 15/11/2026')
    expect(wrapper.text()).toContain('Coletado:')
    const link = wrapper.find('a.central-card-link')
    expect(link.attributes('href')).toBe(
      'https://brasil.mongabay.com/materia-teste',
    )
  })

  it('renderiza artigo científico com base de origem, autores, periódico, DOI e citações', () => {
    const wrapper = mount(ArtigoCard, {
      props: {
        artigo: {
          id: 5,
          titulo: 'Deforestation dynamics in the Brazilian Amazon',
          autores: 'Ana Silva, Carlos Souza',
          instituicao_ou_periodico: 'Acta Amazonica',
          ano_publicacao: 2025,
          resumo: 'Análise das taxas do PRODES e alertas do DETER no Pará.',
          palavras_chave: 'Amazônia, Desmatamento, PRODES',
          doi: '10.1590/acta-2025',
          url_original: 'https://doi.org/10.1590/acta-2025',
          base_origem: 'OpenAlex / SciELO',
          categoria: 'desmatamento',
          citacoes: 14,
          pesquisa_brasileira: true,
          coletado_em: '2026-11-16T10:30:00Z',
        },
      },
    })

    expect(wrapper.text()).toContain('OpenAlex / SciELO')
    expect(wrapper.text()).toContain('Brasil / América Latina')
    expect(wrapper.text()).toContain('Acta Amazonica')
    expect(wrapper.text()).toContain('10.1590/acta-2025')
    expect(wrapper.text()).toContain('Citações: 14')
  })

  it('identifica localização territorial da notícia, cruza com dados do INPE e emite evento ver-impacto', async () => {
    const noticia = {
      id: 22,
      titulo: 'Operação combate queimadas em São Félix do Xingu e Altamira',
      descricao: 'Ações concentradas no Pará.',
      veiculo: '((o))eco',
      origem_integracao: 'rss:oeco',
      url_original: 'https://oeco.org.br/xingu',
      categoria: 'queimadas',
      coletado_em: '2026-11-16T10:30:00Z',
    }

    const loc = inferirLocalizacaoNoticia(noticia)
    expect(loc.estado).toBe('PA')
    expect(loc.municipio).toBe('São Félix do Xingu')
    expect(loc.tipoMapa).toBe('queimada')
    expect(loc.regiaoId).toBe('sul_para_xingu')

    const poly = construirPoligonoAreaAfetadaNoticia(noticia)
    expect(poly.coordenadas.length).toBeGreaterThanOrEqual(4)
    expect(poly.preenchimento).toBe('#ef4444')
    expect(REGIOES_AREA_AFETADA.length).toBeGreaterThanOrEqual(6)

    const ponto = construirPontoMapaNoticia(noticia, 0)
    expect(ponto.estado).toBe('PA')
    expect(ponto.latitude).toBeLessThan(0)

    const cruzamento = cruzarImpactoComMonitoramento(noticia, {
      por_estado: [
        { estado: 'PA', focos_calor_total: 5027, alertas_deter_km2: 0.45 },
      ],
      registros_recentes: [
        {
          id: 99,
          estado: 'PA',
          municipio: 'Portel',
          tipo_metrica: 'foco_de_calor',
          valor: 412,
          unidade: 'focos',
          latitude: -2.88,
          longitude: -50.75,
        },
      ],
    })
    expect(cruzamento.ufResumo.focos_calor_total).toBe(5027)
    expect(cruzamento.pontosOficiaisProximos).toHaveLength(1)

    const wrapper = mount(NoticiaCard, { props: { noticia } })
    const btn = wrapper.find('button.central-impacto-btn')
    expect(btn.exists()).toBe(true)
    await btn.trigger('click')
    expect(wrapper.emitted('ver-impacto')).toBeTruthy()
    expect(wrapper.emitted('ver-impacto')[0][0]).toEqual(noticia)
  })
})
