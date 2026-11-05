<script setup>
import { reactive, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'

import AuthShell from '@/components/AuthShell.vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()

const form = reactive({
  nome: '',
  email: '',
  senha: '',
  confirmarSenha: '',
})

const campos = ref({})
const erro = ref('')
const carregando = ref(false)
const mostrarSenhas = ref(false)
const aceitouTermos = ref(false)

function limparCampo(campo) {
  if (campos.value[campo]) {
    const restantes = { ...campos.value }
    delete restantes[campo]
    campos.value = restantes
  }
}

function validar() {
  const erros = {}
  const nome = form.nome.trim()
  const email = form.email.trim()
  const bytesSenha = new TextEncoder().encode(form.senha).length

  if (!nome) {
    erros.nome = 'Informe o nome.'
  } else if (nome.length < 2) {
    erros.nome = 'O nome deve ter pelo menos 2 caracteres.'
  } else if (nome.length > 120) {
    erros.nome = 'O nome deve ter no máximo 120 caracteres.'
  }

  if (!email) {
    erros.email = 'Informe o email.'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    erros.email = 'Informe um email válido.'
  }

  if (!form.senha) {
    erros.senha = 'Informe a senha.'
  } else if (form.senha.length < 8) {
    erros.senha = 'A senha deve ter pelo menos 8 caracteres.'
  } else if (form.senha.length > 72 || bytesSenha > 72) {
    erros.senha = 'A senha deve ter no máximo 72 caracteres.'
  }

  if (!form.confirmarSenha) {
    erros.confirmarSenha = 'Confirme a senha.'
  } else if (form.confirmarSenha !== form.senha) {
    erros.confirmarSenha = 'As senhas não coincidem.'
  }

  if (!aceitouTermos.value) {
    erros.termos = 'Aceite os termos para criar a conta.'
  }

  campos.value = erros
  return Object.keys(erros).length === 0
}

async function cadastrar() {
  erro.value = ''

  if (!validar()) return

  carregando.value = true
  const email = form.email.trim()

  try {
    await auth.registrar({
      nome: form.nome.trim(),
      email,
      senha: form.senha,
    })
  } catch (error) {
    if (error?.statusCode === 409) {
      erro.value = 'Email já cadastrado.'
    } else {
      erro.value =
        error?.message ||
        'Não foi possível criar a conta. Tente novamente.'
      if (error?.campos) {
        campos.value = { ...campos.value, ...error.campos }
      }
    }
    carregando.value = false
    return
  }

  try {
    await auth.login(email, form.senha)
    router.push({ name: 'visao-geral' })
  } catch {
    router.push({
      name: 'login',
      query: { cadastro: 'sucesso' },
    })
  } finally {
    carregando.value = false
  }
}
</script>

<template>
  <AuthShell
    titulo="Criar conta"
    subtitulo="Cadastre-se para registrar e acompanhar ocorrências ambientais."
  >
    <div
      v-if="erro"
      class="alert alert-danger d-flex align-items-start gap-2 mensagem-erro"
      role="alert"
    >
      <i class="bi bi-exclamation-triangle mt-1" aria-hidden="true"></i>
      <span>{{ erro }}</span>
    </div>

    <form novalidate @submit.prevent="cadastrar">
      <div class="mb-3">
        <label for="cadastro-nome" class="form-label">Nome</label>
        <input
          id="cadastro-nome"
          v-model="form.nome"
          type="text"
          class="form-control form-control-lg"
          :class="{ 'is-invalid': campos.nome }"
          autocomplete="name"
          placeholder="Seu nome completo"
          @input="limparCampo('nome')"
        />
        <div v-if="campos.nome" class="invalid-feedback">
          {{ campos.nome }}
        </div>
      </div>

      <div class="mb-3">
        <label for="cadastro-email" class="form-label">Email</label>
        <input
          id="cadastro-email"
          v-model="form.email"
          type="email"
          class="form-control form-control-lg"
          :class="{ 'is-invalid': campos.email }"
          autocomplete="email"
          inputmode="email"
          placeholder="voce@example.com"
          @input="limparCampo('email')"
        />
        <div v-if="campos.email" class="invalid-feedback">
          {{ campos.email }}
        </div>
      </div>

      <div class="mb-3">
        <label for="cadastro-senha" class="form-label">Senha</label>
        <div class="input-group input-group-lg has-validation">
          <input
            id="cadastro-senha"
            v-model="form.senha"
            :type="mostrarSenhas ? 'text' : 'password'"
            class="form-control"
            :class="{ 'is-invalid': campos.senha }"
            autocomplete="new-password"
            placeholder="Mínimo de 8 caracteres"
            @input="limparCampo('senha')"
          />
          <button
            type="button"
            class="btn btn-outline-secondary"
            :aria-label="
              mostrarSenhas ? 'Ocultar senhas' : 'Mostrar senhas'
            "
            @click="mostrarSenhas = !mostrarSenhas"
          >
            <i
              class="bi"
              :class="mostrarSenhas ? 'bi-eye-slash' : 'bi-eye'"
              aria-hidden="true"
            ></i>
          </button>
          <div v-if="campos.senha" class="invalid-feedback">
            {{ campos.senha }}
          </div>
        </div>
        <div class="form-text">
          Use entre 8 e 72 caracteres.
        </div>
      </div>

      <div class="mb-4">
        <label for="cadastro-confirmar" class="form-label">
          Confirmar senha
        </label>
        <input
          id="cadastro-confirmar"
          v-model="form.confirmarSenha"
          :type="mostrarSenhas ? 'text' : 'password'"
          class="form-control form-control-lg"
          :class="{ 'is-invalid': campos.confirmarSenha }"
          autocomplete="new-password"
          placeholder="Repita a senha"
          @input="limparCampo('confirmarSenha')"
        />
        <div v-if="campos.confirmarSenha" class="invalid-feedback">
          {{ campos.confirmarSenha }}
        </div>

        <div class="form-check mb-4">
          <input id="cadastro-termos" v-model="aceitouTermos" class="form-check-input" type="checkbox" @change="limparCampo('termos')" />
          <label class="form-check-label" for="cadastro-termos">
            Li e aceito os <a href="#termos">Termos de uso</a> e a
            <a href="#privacidade">Política de privacidade</a>.
          </label>
          <div v-if="campos.termos" class="invalid-feedback d-block">{{ campos.termos }}</div>
        </div>
      </div>

      <button
        type="submit"
        class="btn btn-primary btn-lg w-100"
        :disabled="carregando"
      >
        <span
          v-if="carregando"
          class="spinner-border spinner-border-sm me-2"
          aria-hidden="true"
        ></span>
        <i v-else class="bi bi-person-plus me-2" aria-hidden="true"></i>
        {{ carregando ? 'Criando conta...' : 'Criar conta' }}
      </button>
    </form>

    <p class="text-center text-secondary mt-4 mb-0">
      Já tem uma conta?
      <RouterLink :to="{ name: 'login' }" class="fw-semibold">
        Entrar
      </RouterLink>
    </p>
  </AuthShell>
</template>
