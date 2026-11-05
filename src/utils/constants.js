export const APP_NAME = 'EcoMonitor'

export const UFS = [
  'AC',
  'AL',
  'AP',
  'AM',
  'BA',
  'CE',
  'DF',
  'ES',
  'GO',
  'MA',
  'MT',
  'MS',
  'MG',
  'PA',
  'PB',
  'PR',
  'PE',
  'PI',
  'RJ',
  'RN',
  'RS',
  'RO',
  'RR',
  'SC',
  'SP',
  'SE',
  'TO',
]

export const TIPOS = [
  { value: 'queimada', label: 'Queimada' },
  { value: 'desmatamento', label: 'Desmatamento' },
]

export const TIPO_LABELS = {
  queimada: 'Queimada',
  desmatamento: 'Desmatamento',
}

/* Paleta semântica do tema escuro. */
export const TIPO_CORES = {
  queimada: '#FF8A4C',
  desmatamento: '#4ADEC0',
}

export const SEVERIDADES = [
  { value: 'baixa', label: 'Baixa' },
  { value: 'moderada', label: 'Moderada' },
  { value: 'alta', label: 'Alta' },
  { value: 'critica', label: 'Crítica' },
]

export const SEVERIDADE_LABELS = {
  baixa: 'Baixa',
  moderada: 'Moderada',
  alta: 'Alta',
  critica: 'Crítica',
}

export const SEVERIDADE_CORES = {
  baixa: '#91A69A',
  moderada: '#F6C453',
  alta: '#FF8A4C',
  critica: '#FF7A7A',
}

export const STATUS = [
  { value: 'em_analise', label: 'Em análise' },
  { value: 'confirmada', label: 'Confirmada' },
  { value: 'encerrada', label: 'Encerrada' },
]

export const STATUS_LABELS = {
  em_analise: 'Em análise',
  confirmada: 'Confirmada',
  encerrada: 'Encerrada',
}

export const STATUS_CORES = {
  em_analise: '#F6C453',
  confirmada: '#3DDC97',
  encerrada: '#74877D',
}

/* Bioma predominante por UF, usado apenas como metadado demonstrativo. */
export const BIOMAS_POR_UF = {
  AC: 'Amazônia',
  AP: 'Amazônia',
  AM: 'Amazônia',
  MA: 'Cerrado',
  MT: 'Amazônia',
  MS: 'Cerrado',
  PA: 'Amazônia',
  RO: 'Amazônia',
  RR: 'Amazônia',
  TO: 'Cerrado',
  BA: 'Caatinga',
  CE: 'Caatinga',
  DF: 'Cerrado',
  ES: 'Mata Atlântica',
  GO: 'Cerrado',
  MG: 'Cerrado',
  PB: 'Caatinga',
  PR: 'Mata Atlântica',
  PE: 'Caatinga',
  PI: 'Caatinga',
  RJ: 'Mata Atlântica',
  RN: 'Caatinga',
  RS: 'Pampa',
  SC: 'Mata Atlântica',
  SP: 'Mata Atlântica',
  SE: 'Caatinga',
}

export const PAGE_SIZE_OPTIONS = [8, 10, 20, 50, 100]
