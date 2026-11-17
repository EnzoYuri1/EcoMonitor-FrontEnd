import { ref } from 'vue'
import { defineStore } from 'pinia'

const CHAVE_TEMA = 'ecomonitor.tema'
const TEMA_PADRAO = 'claro'
const TEMAS = ['claro', 'escuro']

function lerTemaSalvo() {
  try {
    const salvo = window.localStorage.getItem(CHAVE_TEMA)
    return TEMAS.includes(salvo) ? salvo : null
  } catch {
    return null
  }
}

function salvarTema(tema) {
  try {
    window.localStorage.setItem(CHAVE_TEMA, tema)
  } catch {
    // Armazenamento indisponível: o tema vale só para a sessão atual.
  }
}

export const useTemaStore = defineStore('tema', () => {
  const atual = ref(lerTemaSalvo() ?? TEMA_PADRAO)
  /** Incrementada a cada troca para forçar remontagem de gráficos etc. */
  const versao = ref(0)

  function aplicarNoDocumento() {
    const raiz = document.documentElement
    raiz.setAttribute('data-theme', atual.value)
    // Sincroniza a classe `.dark` usada pela variante escura do Tailwind
    // (tokens shadcn dos componentes ui/).
    raiz.classList.toggle('dark', atual.value === 'escuro')
  }

  function iniciar() {
    // Se nada foi salvo, garante o padrão claro no documento.
    if (!lerTemaSalvo()) salvarTema(atual.value)
    aplicarNoDocumento()
  }

  function alternar() {
    atual.value = atual.value === 'claro' ? 'escuro' : 'claro'
    salvarTema(atual.value)
    aplicarNoDocumento()
    versao.value += 1
  }

  /**
   * Lê uma cor definida em CSS (ex.: '--eco-chart-grid') já resolvida
   * para o tema ativo. Chart.js não entende `var()`, por isso o valor
   * computado precisa ser lido aqui.
   */
  function cor(nome, fallback = '') {
    if (typeof window === 'undefined') return fallback
    const valor = window
      .getComputedStyle(document.documentElement)
      .getPropertyValue(nome)
      .trim()
    return valor || fallback
  }

  return { atual, versao, iniciar, alternar, cor }
})
