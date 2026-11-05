import { describe, expect, it } from 'vitest'

import {
  corTipo,
  dataHojeISO,
  formatarData,
  formatarDataHora,
  formatarMes,
  formatarNumero,
  formatarResponsavel,
  rotuloTipo,
  truncar,
} from '@/utils/format'

describe('formatarData', () => {
  it('converte uma data ISO em dd/mm/aaaa', () => {
    expect(formatarData('2026-10-01')).toBe('01/10/2026')
  })

  it('ignora a parte de horário de um datetime', () => {
    expect(formatarData('2026-10-01T14:30:00Z')).toBe('01/10/2026')
  })

  it('retorna travessão para valores vazios', () => {
    expect(formatarData('')).toBe('—')
    expect(formatarData(null)).toBe('—')
    expect(formatarData(undefined)).toBe('—')
  })

  it('devolve o valor original quando não é uma data reconhecível', () => {
    expect(formatarData('texto')).toBe('texto')
  })
})

describe('formatarDataHora', () => {
  it('formata data e hora em pt-BR', () => {
    expect(formatarDataHora('2026-10-01T12:00:00')).toContain(
      '01/10/2026',
    )
  })

  it('retorna travessão para valor vazio', () => {
    expect(formatarDataHora(null)).toBe('—')
  })

  it('devolve o valor original quando a data é inválida', () => {
    expect(formatarDataHora('data-invalida')).toBe('data-invalida')
  })
})

describe('formatarNumero', () => {
  it('usa separadores pt-BR', () => {
    expect(formatarNumero(1234567)).toBe('1.234.567')
    expect(formatarNumero('1234.5')).toBe('1.234,5')
  })

  it('trata valores vazios ou inválidos como zero', () => {
    expect(formatarNumero(0)).toBe('0')
    expect(formatarNumero(null)).toBe('0')
    expect(formatarNumero(undefined)).toBe('0')
    expect(formatarNumero('abc')).toBe('0')
  })
})

describe('rótulos e cores de tipo', () => {
  it('traduz os tipos conhecidos', () => {
    expect(rotuloTipo('queimada')).toBe('Queimada')
    expect(rotuloTipo('desmatamento')).toBe('Desmatamento')
  })

  it('devolve o próprio valor para tipos desconhecidos', () => {
    expect(rotuloTipo('outro')).toBe('outro')
  })

  it('usa as cores da identidade visual', () => {
    expect(corTipo('queimada')).toBe('#FF8A4C')
    expect(corTipo('desmatamento')).toBe('#4ADEC0')
    expect(corTipo('outro')).toBe('#6B7280')
  })
})

describe('formatarResponsavel', () => {
  it('identifica o próprio usuário', () => {
    expect(formatarResponsavel(1, 1)).toBe('Você')
    expect(formatarResponsavel('1', 1)).toBe('Você')
  })

  it('identifica outro usuário', () => {
    expect(formatarResponsavel(2, 1)).toBe('Outro usuário')
    expect(formatarResponsavel(null, 1)).toBe('Outro usuário')
  })
})

describe('dataHojeISO', () => {
  it('retorna a data local no formato AAAA-MM-DD', () => {
    const agora = new Date()
    const esperado = `${agora.getFullYear()}-${String(
      agora.getMonth() + 1,
    ).padStart(2, '0')}-${String(agora.getDate()).padStart(2, '0')}`

    expect(dataHojeISO()).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(dataHojeISO()).toBe(esperado)
  })
})

describe('formatarMes', () => {
  it('converte AAAA-MM em MM/AAAA', () => {
    expect(formatarMes('2026-10')).toBe('10/2026')
  })

  it('devolve o valor original quando o formato não é reconhecido', () => {
    expect(formatarMes('2026')).toBe('2026')
  })
})

describe('truncar', () => {
  it('mantém textos curtos intactos', () => {
    expect(truncar('texto curto', 20)).toBe('texto curto')
  })

  it('adiciona reticências ao ultrapassar o limite', () => {
    expect(truncar('abcdefghij', 5)).toBe('abcde...')
  })

  it('trata valores vazios', () => {
    expect(truncar(null)).toBe('')
    expect(truncar('')).toBe('')
  })
})
