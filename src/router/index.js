import { createRouter, createWebHistory } from 'vue-router'

import { useAuthStore } from '../stores/auth'
import AppLayout from '../layouts/AppLayout.vue'

const routes = [
  {
    path: '/login',
    name: 'login',
    component: () => import('../views/LoginView.vue'),
    meta: { guestOnly: true, title: 'Entrar' },
  },
  {
    path: '/cadastro',
    name: 'cadastro',
    component: () => import('../views/RegisterView.vue'),
    meta: { guestOnly: true, title: 'Criar conta' },
  },
  {
    path: '/',
    component: AppLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        redirect: { name: 'visao-geral' },
      },
      {
        path: 'visao-geral',
        alias: 'dashboard',
        name: 'visao-geral',
        component: () => import('../views/DashboardView.vue'),
        meta: { title: 'Visão geral' },
      },
      {
        path: 'ocorrencias',
        name: 'ocorrencias',
        component: () => import('../views/OcorrenciasView.vue'),
        meta: { title: 'Ocorrências' },
      },
      {
        path: 'ocorrencias/nova',
        name: 'nova-ocorrencia',
        component: () => import('../views/NovaOcorrenciaView.vue'),
        meta: { title: 'Nova ocorrência' },
      },
      {
        path: 'ocorrencias/:id',
        name: 'ocorrencia-detalhe',
        component: () => import('../views/OcorrenciaDetalheView.vue'),
        meta: { title: 'Detalhe da ocorrência' },
      },
      {
        path: 'mapa',
        name: 'mapa',
        component: () => import('../views/MapaView.vue'),
        meta: { title: 'Mapa de monitoramento' },
      },
      {
        path: 'relatorios',
        name: 'relatorios',
        component: () => import('../views/RelatoriosView.vue'),
        meta: { title: 'Relatórios' },
      },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: { name: 'visao-geral' },
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior: () => ({ top: 0 }),
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()

  if (to.meta.requiresAuth) {
    if (!auth.token) {
      return {
        name: 'login',
        query: { redirect: to.fullPath },
      }
    }

    const sessaoValida = await auth.ensureSession()
    if (!sessaoValida) {
      return {
        name: 'login',
        query: { redirect: to.fullPath },
      }
    }
  }

  if (to.meta.guestOnly && auth.isAuthenticated && auth.user) {
    return { name: 'visao-geral' }
  }

  return true
})

router.afterEach((to) => {
  const titulo = to.meta.title
  document.title = titulo
    ? `${titulo} | EcoMonitor`
    : 'EcoMonitor | Monitoramento ambiental'
})

export default router
