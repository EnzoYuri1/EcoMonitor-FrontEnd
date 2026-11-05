import { describe, expect, it } from 'vitest'

import {
  agruparMensal,
  agruparPorMunicipio,
  descreverPeriodo,
  formatarPercentual,
  gerarCsv,
  linhasCsvOcorrencias,
  linhasCsvResumo,
  resumirOcorrencias,
} from '@/utils/reports'

const OCORRENCIAS = [
  {
    id: 1,
    tipo: 'queimada',
    municipio: 'Sinop',
    estado: 'MT',
    data_ocorrencia: '2026-08-10',
    descricao: 'Foco de queimada.',
  },
  {
    id: 2,
    tipo: 'desmatamento',
    municipio: 'Sinop',
    estado: 'MT',
    data_ocorrencia: '2026-09-05',
    descricao: 'Área desmatada.',
  },
  {
    id: 3,
    tipo: 'queimada',
    municipio: 'Cuiabá',
    estado: 'MT',
    data_ocorrencia: '2026-09-20',
    descricao: 'Queimada urbana.',
  },
  {
    id: 4,
    tipo: 'desmatamento',
    municipio: 'Sinop',
    estado: 'PA',
    data_ocorrencia: '2026-11-01',
    descricao: 'Desmatamento em outro estado.',
  },
  {
    id: 5,
    tipo: 'queimada',
    municipio: 'Sinop',
    estado: 'MT',
    data_ocorrencia: '2026-11-02',
    descricao: 'Novo foco.',
  },
]

describe('resumirOcorrencias', () => {
  it('calcula totais, municípios e período', () => {
    expect(resumirOcorrencias(OCORRENCIAS)).toEqual({
      total: 5,
      queimadas: 3,
      desmatamentos: 2,
      municipios: 3,
      dataMinima: '2026-08-10',
      dataMaxima: '2026-11-02',
    })
  })

  it('trata lista vazia e datas inválidas', () => {
    expect(resumirOcorrencias([])).toEqual({
      total: 0,
      queimadas: 0,
      desmatamentos: 0,
      municipios: 0,
      dataMinima: null,
      dataMaxima: null,
    })

    expect(
      resumirOcorrencias([
        { tipo: 'queimada', municipio: 'Sinop', data_ocorrencia: 'x' },
      ]),
    ).toMatchObject({
      total: 1,
      queimadas: 1,
      dataMinima: null,
      dataMaxima: null,
    })
  })
})

describe('agruparPorMunicipio', () => {
  it('agrupa por município e UF e calcula participação', () => {
    const linhas = agruparPorMunicipio(OCORRENCIAS)

    expect(linhas).toHaveLength(3)
    expect(linhas[0]).toMatchObject({
      municipio: 'Sinop',
      estado: 'MT',
      queimadas: 2,
      desmatamentos: 1,
      total: 3,
      percentual: 60,
    })
    expect(linhas[1]).toMatchObject({
      municipio: 'Cuiabá',
      estado: 'MT',
      total: 1,
      percentual: 20,
    })
    expect(linhas[2]).toMatchObject({
      municipio: 'Sinop',
      estado: 'PA',
      total: 1,
      percentual: 20,
    })
  })

  it('retorna lista vazia sem ocorrências', () => {
    expect(agruparPorMunicipio([])).toEqual([])
  })
})

describe('agruparMensal', () => {
  it('preenche meses sem ocorrências e separa por tipo', () => {
    expect(agruparMensal(OCORRENCIAS)).toEqual({
      labels: ['08/2026', '09/2026', '10/2026', '11/2026'],
      queimadas: [1, 1, 0, 1],
      desmatamentos: [0, 1, 0, 1],
      totais: [1, 2, 0, 2],
    })
  })

  it('retorna listas vazias sem datas válidas', () => {
    expect(agruparMensal([])).toEqual({
      labels: [],
      queimadas: [],
      desmatamentos: [],
      totais: [],
    })

    expect(
      agruparMensal([{ tipo: 'queimada', data_ocorrencia: 'inválida' }]),
    ).toEqual({
      labels: [],
      queimadas: [],
      desmatamentos: [],
      totais: [],
    })
  })
})

describe('descreverPeriodo', () => {
  it('descreve um intervalo de datas', () => {
    expect(descreverPeriodo('2026-08-10', '2026-11-02')).toBe(
      '10/08/2026 a 02/11/2026',
    )
  })

  it('descreve uma única data ou a ausência de dados', () => {
    expect(descreverPeriodo('2026-08-10', '2026-08-10')).toBe(
      '10/08/2026',
    )
    expect(descreverPeriodo(null, null)).toBe('Sem dados no período')
  })
})

describe('formatarPercentual', () => {
  it('usa uma casa decimal e vírgula', () => {
    expect(formatarPercentual(60)).toBe('60,0%')
    expect(formatarPercentual(33.333)).toBe('33,3%')
  })

  it('trata valores vazios', () => {
    expect(formatarPercentual(null)).toBe('0,0%')
  })
})

describe('gerarCsv', () => {
  it('adiciona BOM, usa ponto e vírgula e escapa células', () => {
    const csv = gerarCsv([
      ['Nome', 'Observação'],
      ['Sinop', 'Foco; área "rural"\nlinha 2'],
    ])

    expect(csv.startsWith('\uFEFF')).toBe(true)
    expect(csv).toContain('Nome;Observação')
    expect(csv).toContain('Sinop;"Foco; área ""rural""\nlinha 2"')
    expect(csv.endsWith('\r\n')).toBe(true)
  })
})

describe('linhasCsvOcorrencias', () => {
  it('monta o cabeçalho e as linhas detalhadas', () => {
    const linhas = linhasCsvOcorrencias([
      {
        ...OCORRENCIAS[0],
        latitude: -11.8642,
        longitude: -55.5025,
        created_at: '2026-10-30T14:00:00',
      },
    ])

    expect(linhas[0]).toEqual([
      'ID',
      'Tipo',
      'Município',
      'UF',
      'Data da ocorrência',
      'Latitude',
      'Longitude',
      'Descrição',
      'Criado em',
    ])
    expect(linhas[1][0]).toBe(1)
    expect(linhas[1][1]).toBe('Queimada')
    expect(linhas[1][2]).toBe('Sinop')
    expect(linhas[1][4]).toBe('10/08/2026')
    expect(linhas[1][5]).toBe(-11.8642)
    expect(linhas[1][6]).toBe(-55.5025)
    expect(linhas[1][7]).toBe('Foco de queimada.')
    expect(linhas[1][8]).toContain('30/10/2026')
  })

  it('mantém coordenadas ausentes como vazio', () => {
    const linhas = linhasCsvOcorrencias([{ ...OCORRENCIAS[0] }])

    expect(linhas[1][5]).toBe('')
    expect(linhas[1][6]).toBe('')
    expect(linhas[1][8]).toBe('')
  })
})

describe('linhasCsvResumo', () => {
  it('monta o resumo por município com percentual formatado', () => {
    const linhas = linhasCsvResumo([
      {
        municipio: 'Sinop',
        estado: 'MT',
        queimadas: 2,
        desmatamentos: 1,
        total: 3,
        percentual: 60,
      },
    ])

    expect(linhas[0]).toEqual([
      'Município',
      'UF',
      'Queimadas',
      'Desmatamentos',
      'Total',
      'Participação (%)',
    ])
    expect(linhas[1]).toEqual(['Sinop', 'MT', 2, 1, 3, '60,0'])
  })
})
