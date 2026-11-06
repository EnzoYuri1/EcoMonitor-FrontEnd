<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { CheckCircle, Clock3, Eye, EyeOff, LogIn, TriangleAlert } from 'lucide-vue-next'

import AuthShell from '@/components/AuthShell.vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()

const form = reactive({
  email: '',
  senha: '',
})

const campos = ref({})
const erro = ref('')
const sucesso = ref('')
const mensagemSessao = ref('')
const carregando = ref(false)
const mostrarSenha = ref(false)

const emailValido = computed(() =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()),
)

onMounted(() => {
  mensagemSessao.value = auth.consumirMensagemSessao()

  if (route.query.cadastro === 'sucesso') {
    sucesso.value =
      'Conta criada com sucesso. Faça login para continuar.'
  }
})

function limparCampo(campo) {
  if (campos.value[campo]) {
    const restantes = { ...campos.value }
    delete restantes[campo]
    campos.value = restantes
  }
}

function validar() {
  const erros = {}

  if (!form.email.trim()) {
    erros.email = 'Informe o email.'
  } else if (!emailValido.value) {
    erros.email = 'Informe um email válido.'
  }

  if (!form.senha) {
    erros.senha = 'Informe a senha.'
  }

  campos.value = erros
  return Object.keys(erros).length === 0
}

function destinoSeguro() {
  const redirect = route.query.redirect

  if (
    typeof redirect === 'string' &&
    redirect.startsWith('/') &&
    !redirect.startsWith('//')
  ) {
    return redirect
  }

  return null
}

async function entrar() {
  erro.value = ''
  sucesso.value = ''

  if (!validar()) return

  carregando.value = true

  try {
    await auth.login(form.email.trim(), form.senha)
    const destino = destinoSeguro()

    if (destino) {
      router.push(destino)
    } else {
      router.push({ name: 'visao-geral' })
    }
  } catch (error) {
    if (error?.statusCode === 401) {
      erro.value = 'Email ou senha incorretos.'
    } else {
      erro.value =
        error?.message || 'Não foi possível entrar. Tente novamente.'
    }
  } finally {
    carregando.value = false
  }
}
</script>

<template>
  <AuthShell
    titulo="Entre na sua conta"
    subtitulo="Acesse seu espaço de monitoramento ambiental."
  >
    <div
      v-if="mensagemSessao"
      class="alert alert-warning d-flex align-items-start gap-2 mensagem-erro"
      role="alert"
    >
      <Clock3 :size="16" class="mt-1" aria-hidden="true" />
      <span>{{ mensagemSessao }}</span>
    </div>

    <div
      v-if="sucesso"
      class="alert alert-success d-flex align-items-start gap-2"
      role="alert"
    >
      <CheckCircle :size="16" class="mt-1" aria-hidden="true" />
      <span>{{ sucesso }}</span>
    </div>

    <div
      v-if="erro"
      class="alert alert-danger d-flex align-items-start gap-2 mensagem-erro"
      role="alert"
    >
      <TriangleAlert :size="16" class="mt-1" aria-hidden="true" />
      <span>{{ erro }}</span>
    </div>

    <form novalidate @submit.prevent="entrar">
      <div class="mb-3">
        <label for="login-email" class="form-label">Email</label>
        <Input
          id="login-email"
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

      <div class="mb-4">
        <label for="login-senha" class="form-label">Senha</label>
        <div class="input-group input-group-lg has-validation">
          <Input
            id="login-senha"
            v-model="form.senha"
            :type="mostrarSenha ? 'text' : 'password'"
            class="form-control"
            :class="{ 'is-invalid': campos.senha }"
            autocomplete="current-password"
            placeholder="Sua senha"
            @input="limparCampo('senha')"
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            :aria-label="
              mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'
            "
            @click="mostrarSenha = !mostrarSenha"
          >
            <EyeOff v-if="mostrarSenha" :size="17" aria-hidden="true" />
            <Eye v-else :size="17" aria-hidden="true" />
          </Button>
          <div v-if="campos.senha" class="invalid-feedback">
            {{ campos.senha }}
          </div>
        </div>
      </div>

      <Button
        type="submit"
        size="lg"
        class="w-100"
        :disabled="carregando"
      >
        <LogIn v-if="!carregando" :size="17" aria-hidden="true" />
        {{ carregando ? 'Entrando...' : 'Entrar' }}
      </Button>
    </form>

    <p class="text-center text-secondary mt-4 mb-0">
      Ainda não tem conta?
      <RouterLink :to="{ name: 'cadastro' }" class="fw-semibold">
        Criar conta
      </RouterLink>
    </p>
  </AuthShell>
</template>
