import { describe, expect, it } from 'vitest'

import {
  calcularLimites,
  coordenadaValida,
  contarPorTipo,
  dentroDoBrasil,
  escaparHtml,
  formatarCoordenadas,
  montarConteudoPopup,
  separarOcorrenciasMapeaveis,
} from '@/utils/map'

describe('coordenadaValida', () => {
  it('aceita números e textos numéricos dentro dos limites', () => {
    expect(coordenadaValida(-11.8642, -55.5025)).toBe(true)
    expect(coordenadaValida('0', '0')).toBe(true)
    expect(coordenadaValida(-90, -180)).toBe(true)
    expect(coordenadaValida(90, 180)).toBe(true)
  })

  it('rejeita coordenadas ausentes, vazias ou inválidas', () => {
    expect(coordenadaValida(null, -55)).toBe(false)
    expect(coordenadaValida('', -55)).toBe(false)
    expect(coordenadaValida(undefined, -55)).toBe(false)
    expect(coordenadaValida('texto', -55)).toBe(false)
    expect(coordenadaValida(Number.NaN, -55)).toBe(false)
    expect(coordenadaValida(Infinity, -55)).toBe(false)
  })

  it('rejeita valores fora dos limites geográficos', () => {
    expect(coordenadaValida(91, 0)).toBe(false)
    expect(coordenadaValida(-91, 0)).toBe(false)
    expect(coordenadaValida(0, 181)).toBe(false)
    expect(coordenadaValida(0, -181)).toBe(false)
  })
})

describe('dentroDoBrasil', () => {
  it('aceita coordenadas dentro do território brasileiro', () => {
    expect(dentroDoBrasil(-11.8642, -55.5025)).toBe(true)
    expect(dentroDoBrasil(-3.1, -60.2)).toBe(true)
    expect(dentroDoBrasil(-23.55, -46.63)).toBe(true)
  })

  it('rejeita coordenadas fora do Brasil ou inválidas', () => {
    expect(dentroDoBrasil(86, -6)).toBe(false)
    expect(dentroDoBrasil(0, 0)).toBe(false)
    expect(dentroDoBrasil(40.7, -74)).toBe(false)
    expect(dentroDoBrasil(null, null)).toBe(false)
  })
})

describe('separarOcorrenciasMapeaveis', () => {
  it('separa itens com e sem coordenadas válidas', () => {
    const itens = [
      { id: 1, latitude: -11.86, longitude: -55.5 },
      { id: 2, latitude: null, longitude: null },
      { id: 3, latitude: -12.5, longitude: '' },
      { id: 4, latitude: '-3.1', longitude: '-60.2' },
    ]

    const resultado = separarOcorrenciasMapeaveis(itens)

    expect(resultado.comCoordenadas.map((item) => item.id)).toEqual([1, 4])
    expect(resultado.semCoordenadas.map((item) => item.id)).toEqual([
      2, 3,
    ])
  })

  it('trata listas vazias ou ausentes', () => {
    expect(separarOcorrenciasMapeaveis([])).toEqual({
      comCoordenadas: [],
      semCoordenadas: [],
    })
    expect(separarOcorrenciasMapeaveis()).toEqual({
      comCoordenadas: [],
      semCoordenadas: [],
    })
  })
})

describe('calcularLimites', () => {
  it('calcula o retângulo que envolve todas as coordenadas', () => {
    const limites = calcularLimites([
      { latitude: -11.86, longitude: -55.5 },
      { latitude: -3.1, longitude: -60.2 },
      { latitude: -20.4, longitude: -47.9 },
    ])

    expect(limites).toEqual([
      [-20.4, -60.2],
      [-3.1, -47.9],
    ])
  })

  it('ignora itens sem coordenadas válidas', () => {
    expect(
      calcularLimites([
        { latitude: null, longitude: null },
        { latitude: -10, longitude: -50 },
      ]),
    ).toEqual([
      [-10, -50],
      [-10, -50],
    ])
  })

  it('retorna null quando não há coordenadas válidas', () => {
    expect(calcularLimites([])).toBeNull()
    expect(
      calcularLimites([{ latitude: null, longitude: null }]),
    ).toBeNull()
  })
})

describe('contarPorTipo', () => {
  it('conta queimadas e desmatamentos', () => {
    const contagens = contarPorTipo([
      { tipo: 'queimada' },
      { tipo: 'desmatamento' },
      { tipo: 'queimada' },
      { tipo: 'outro' },
      { tipo: null },
    ])

    expect(contagens).toEqual({
      queimada: 2,
      desmatamento: 1,
    })
  })

  it('inicia todos os tipos conhecidos com zero', () => {
    expect(contarPorTipo([])).toEqual({
      queimada: 0,
      desmatamento: 0,
    })
  })
})

describe('escaparHtml', () => {
  it('escapa os caracteres especiais de HTML', () => {
    expect(escaparHtml('<b>"Eco" & \'Monitor\'</b>')).toBe(
      '&lt;b&gt;&quot;Eco&quot; &amp; &#39;Monitor&#39;&lt;/b&gt;',
    )
  })

  it('trata valores vazios', () => {
    expect(escaparHtml(null)).toBe('')
    expect(escaparHtml(undefined)).toBe('')
    expect(escaparHtml('')).toBe('')
  })
})

describe('formatarCoordenadas', () => {
  it('usa quatro casas decimais com vírgula', () => {
    expect(formatarCoordenadas(-11.8642, -55.5025)).toBe(
      '-11,8642, -55,5025',
    )
  })

  it('retorna travessão para coordenadas inválidas', () => {
    expect(formatarCoordenadas(null, null)).toBe('—')
    expect(formatarCoordenadas(100, 0)).toBe('—')
  })
})

describe('montarConteudoPopup', () => {
  it('monta o resumo da ocorrência com tipo, local, data e coordenadas', () => {
    const html = montarConteudoPopup({
      tipo: 'queimada',
      municipio: 'Sinop',
      estado: 'MT',
      descricao: 'Foco de queimada próximo à rodovia.',
      latitude: -11.8642,
      longitude: -55.5025,
      data_ocorrencia: '2026-10-01',
    })

    expect(html).toContain('Queimada')
    expect(html).toContain('Sinop/MT')
    expect(html).toContain('01/10/2026')
    expect(html).toContain('-11,8642, -55,5025')
    expect(html).toContain('#FF8A4C')
  })

  it('escapa conteúdo vindo da API', () => {
    const html = montarConteudoPopup({
      tipo: 'desmatamento',
      municipio: '<script>alert(1)</script>',
      estado: 'MT',
      descricao: '<b>Área desmatada</b>',
      latitude: -12,
      longitude: -55,
      data_ocorrencia: '2026-10-01',
    })

    expect(html).not.toContain('<script>')
    expect(html).not.toContain('<b>')
    expect(html).toContain('&lt;script&gt;')
    expect(html).toContain('&lt;b&gt;Área desmatada&lt;/b&gt;')
  })

  it('funciona com campos ausentes', () => {
    const html = montarConteudoPopup({})

    expect(html).toContain('Local não informado')
    expect(html).toContain('—')
  })
})
