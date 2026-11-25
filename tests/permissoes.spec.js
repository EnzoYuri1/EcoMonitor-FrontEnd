import { describe, expect, it } from 'vitest'

import {
  ehResponsavel,
  podeGerenciarOcorrencia,
} from '@/utils/permissoes'

const OCORRENCIA = { id: 10, created_by: 2 }

const FUNCIONARIO_DONO = { id: 2, perfil: 'funcionario' }
const FUNCIONARIO_OUTRO = { id: 3, perfil: 'funcionario' }
const ADMIN = { id: 3, perfil: 'admin' }

describe('permissões de ocorrência', () => {
  it('reconhece o responsável pelo registro', () => {
    expect(ehResponsavel(OCORRENCIA, FUNCIONARIO_DONO)).toBe(true)
    expect(ehResponsavel(OCORRENCIA, FUNCIONARIO_OUTRO)).toBe(false)
  })

  it('libera edição e exclusão para o responsável', () => {
    expect(
      podeGerenciarOcorrencia(OCORRENCIA, FUNCIONARIO_DONO),
    ).toBe(true)
  })

  it('bloqueia funcionário que não criou o registro', () => {
    expect(
      podeGerenciarOcorrencia(OCORRENCIA, FUNCIONARIO_OUTRO),
    ).toBe(false)
  })

  it('libera qualquer registro para administrador', () => {
    expect(podeGerenciarOcorrencia(OCORRENCIA, ADMIN)).toBe(true)
  })

  it('trata usuário ou ocorrência ausente sem liberar acesso', () => {
    expect(podeGerenciarOcorrencia(null, ADMIN)).toBe(false)
    expect(podeGerenciarOcorrencia(OCORRENCIA, null)).toBe(false)
  })
})
