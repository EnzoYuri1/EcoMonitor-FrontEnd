<script setup>
import { computed, onMounted, ref } from 'vue'
import { ShieldCheck, UserCog } from 'lucide-vue-next'

import ConfirmDialog from '@/components/ConfirmDialog.vue'
import EmptyState from '@/components/EmptyState.vue'
import PageHeader from '@/components/PageHeader.vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  alterarPerfilUsuario,
  listarUsuarios,
} from '@/services/usuarios'
import { useAuthStore } from '@/stores/auth'
import { formatarData } from '@/utils/format'

const auth = useAuthStore()

const usuarios = ref([])
const carregando = ref(true)
const erro = ref('')
const mensagemSucesso = ref('')
const erroAcao = ref('')
const dialogoAberto = ref(false)
const alvo = ref(null)
const alterando = ref(false)

const totalAdmins = computed(
  () => usuarios.value.filter((item) => item.perfil === 'admin').length,
)

const perfilNovo = computed(() =>
  alvo.value?.perfil === 'admin' ? 'funcionario' : 'admin',
)

const tituloDialogo = computed(() =>
  perfilNovo.value === 'admin'
    ? 'Tornar administrador'
    : 'Tornar funcionário',
)

const mensagemDialogo = computed(() => {
  if (!alvo.value) return ''

  if (perfilNovo.value === 'admin') {
    return `${alvo.value.nome} poderá editar e excluir qualquer ocorrência e gerenciar os perfis das contas.`
  }

  return `${alvo.value.nome} deixará de editar e excluir ocorrências de outras pessoas e não verá mais esta tela.`
})

function souEu(usuario) {
  return Number(usuario.id) === Number(auth.userId)
}

function rotuloAcao(usuario) {
  return usuario.perfil === 'admin'
    ? 'Tornar funcionário'
    : 'Tornar administrador'
}

async function carregar() {
  carregando.value = true
  erro.value = ''

  try {
    usuarios.value = await listarUsuarios()
  } catch (error) {
    usuarios.value = []
    erro.value =
      error?.statusCode === 403
        ? 'Apenas administradores podem gerenciar os perfis das contas.'
        : error?.message || 'Não foi possível carregar as contas.'
  } finally {
    carregando.value = false
  }
}

function abrirDialogo(usuario) {
  alvo.value = usuario
  erroAcao.value = ''
  dialogoAberto.value = true
}

function fecharDialogo() {
  if (alterando.value) return
  dialogoAberto.value = false
  alvo.value = null
}

async function confirmarAlteracao() {
  if (!alvo.value || alterando.value) return

  alterando.value = true
  erroAcao.value = ''

  try {
    const atualizado = await alterarPerfilUsuario(
      alvo.value.id,
      perfilNovo.value,
    )

    usuarios.value = usuarios.value.map((item) =>
      item.id === atualizado.id ? atualizado : item,
    )

    const rotulo =
      atualizado.perfil === 'admin' ? 'administrador' : 'funcionário'
    mensagemSucesso.value = `Perfil de ${atualizado.nome} atualizado para ${rotulo}.`
    dialogoAberto.value = false
    alvo.value = null
  } catch (error) {
    erroAcao.value =
      error?.statusCode === 403
        ? 'Apenas administradores podem alterar perfis.'
        : error?.message || 'Não foi possível alterar o perfil.'
  } finally {
    alterando.value = false
  }
}

onMounted(carregar)
</script>

<template>
  <div>
    <PageHeader
      eyebrow="Administração"
      titulo="Usuários"
      descricao="Gerencie quem pode editar qualquer ocorrência e administrar os perfis das contas."
    />

    <div
      v-if="mensagemSucesso"
      class="alert alert-success alert-dismissible fade show"
      role="status"
    >
      <i class="bi bi-check-circle me-2" aria-hidden="true"></i>
      {{ mensagemSucesso }}
      <button
        type="button"
        class="btn-close"
        aria-label="Fechar"
        @click="mensagemSucesso = ''"
      ></button>
    </div>

    <div
      v-if="erroAcao"
      class="alert alert-danger alert-dismissible fade show mensagem-erro"
      role="alert"
    >
      <i class="bi bi-exclamation-triangle me-2" aria-hidden="true"></i>
      {{ erroAcao }}
      <button
        type="button"
        class="btn-close"
        aria-label="Fechar"
        @click="erroAcao = ''"
      ></button>
    </div>

    <section class="panel">
      <div class="panel-header">
        <div>
          <h2 class="panel-title">Contas cadastradas</h2>
          <p class="panel-subtitle">
            {{ usuarios.length }} conta(s) · {{ totalAdmins }} administrador(es)
          </p>
        </div>
        <ShieldCheck
          v-if="!carregando && !erro"
          :size="20"
          class="texto-3"
          aria-hidden="true"
        />
      </div>

      <div v-if="carregando" class="text-center py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Carregando contas...</span>
        </div>
        <p class="texto-3 mt-3 mb-0">Carregando contas...</p>
      </div>

      <div v-else-if="erro" class="p-4">
        <div
          class="alert alert-danger d-flex flex-wrap align-items-center gap-2 mb-0"
          role="alert"
        >
          <i class="bi bi-wifi-off" aria-hidden="true"></i>
          <span class="flex-grow-1">{{ erro }}</span>
          <button
            type="button"
            class="btn btn-sm btn-outline-danger"
            @click="carregar"
          >
            Tentar novamente
          </button>
        </div>
      </div>

      <EmptyState
        v-else-if="!usuarios.length"
        titulo="Nenhuma conta encontrada"
        descricao="As contas cadastradas aparecerão aqui."
        icone="bi-inbox"
      />

      <div v-else class="table-responsive">
        <table class="table table-hover align-middle">
          <thead>
            <tr>
              <th scope="col">Nome</th>
              <th scope="col">Email</th>
              <th scope="col">Perfil</th>
              <th scope="col">Desde</th>
              <th scope="col" class="text-end">Ações</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="usuario in usuarios" :key="usuario.id">
              <td>
                <span class="celula-principal">
                  {{ usuario.nome }}
                  <span v-if="souEu(usuario)" class="texto-3 small">
                    (você)
                  </span>
                </span>
              </td>
              <td>{{ usuario.email }}</td>
              <td>
                <Badge
                  :variant="usuario.perfil === 'admin' ? 'default' : 'outline'"
                >
                  {{ usuario.perfil === 'admin' ? 'Admin' : 'Funcionário' }}
                </Badge>
              </td>
              <td class="text-nowrap">
                {{ formatarData(usuario.created_at) }}
              </td>
              <td class="text-end text-nowrap">
                <span v-if="souEu(usuario)" class="texto-3 small">
                  Sua conta
                </span>
                <Button
                  v-else
                  type="button"
                  variant="outline"
                  size="sm"
                  @click="abrirDialogo(usuario)"
                >
                  <UserCog :size="15" aria-hidden="true" />
                  {{ rotuloAcao(usuario) }}
                </Button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <ConfirmDialog
      v-model="dialogoAberto"
      :title="tituloDialogo"
      :message="mensagemDialogo"
      confirm-label="Confirmar"
      :variant="perfilNovo === 'funcionario' ? 'danger' : 'default'"
      :loading="alterando"
      @confirm="confirmarAlteracao"
    />
  </div>
</template>
