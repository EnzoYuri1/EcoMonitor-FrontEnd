<script setup>
import { RouterLink } from 'vue-router'
import {
  Activity,
  BookOpen,
  FileChartColumn,
  LogIn,
  MapPin,
  TreePine,
  UserPlus,
} from 'lucide-vue-next'

import { Button } from '@/components/ui/button'

const funcionalidades = [
  {
    icone: MapPin,
    titulo: 'Monitoramento no mapa',
    descricao: 'Visualize a distribuição das ocorrências no território.',
  },
  {
    icone: BookOpen,
    titulo: 'Registro organizado',
    descricao: 'Reúna localização, descrição e evidências em um só lugar.',
  },
  {
    icone: Activity,
    titulo: 'Acompanhamento das análises',
    descricao: 'Consulte status, severidade e histórico do registro.',
  },
  {
    icone: FileChartColumn,
    titulo: 'Relatórios do período',
    descricao: 'Transforme registros em uma leitura consolidada.',
  },
]
</script>

<template>
  <div class="landing-page">
    <header class="landing-header">
      <RouterLink class="brand" :to="{ name: 'inicio' }">
        <img class="brand-logo" src="/logo-ecomonitor-original.png" alt="" aria-hidden="true" />
        <span class="brand-name">EcoMonitor</span>
      </RouterLink>

      <nav class="landing-nav" aria-label="Navegação principal">
        <a href="#funcionalidades">Funcionalidades</a>
        <a href="#como-funciona">Como funciona</a>
      </nav>

      <div class="landing-actions">
        <Button variant="outline" size="sm" @click="$router.push({ name: 'login' })">
          <LogIn :size="14" aria-hidden="true" />
          Entrar
        </Button>
        <Button size="sm" @click="$router.push({ name: 'cadastro' })">
          <UserPlus :size="14" aria-hidden="true" />
          Criar conta
        </Button>
      </div>
    </header>

    <main>
      <section class="landing-hero landing-container">
        <div class="landing-hero-copy">
          <p class="landing-eyebrow">Monitoramento ambiental</p>
          <h1>Uma visão clara das ocorrências ambientais.</h1>
          <p class="landing-lead">
            Registre queimadas e desmatamentos, acompanhe o território e reúna
            informações para apoiar a análise da sua equipe.
          </p>
          <a class="landing-text-link" href="#o-que-e">
            Entenda como funciona
          </a>
          <div class="landing-proof">
            <span class="landing-proof-dot" aria-hidden="true"></span>
            <span>Uma base única para decisões ambientais mais contextualizadas</span>
          </div>
        </div>

        <div class="landing-hero-image">
          <img
            src="/hero-amazonia.jpg"
            alt="Vista aérea da floresta amazônica"
          />
        </div>
      </section>

      <section id="o-que-e" class="landing-intro landing-container">
        <div class="landing-intro-mark" aria-hidden="true">
          <TreePine :size="22" />
        </div>
        <div>
          <p class="landing-eyebrow">O que é o EcoMonitor?</p>
          <h2>Um espaço de trabalho para transformar registros em contexto.</h2>
          <p>
            O EcoMonitor ajuda equipes a registrar, localizar e acompanhar
            ocorrências ambientais. Tudo fica organizado para que a análise do
            território seja mais rápida, clara e responsável.
          </p>
        </div>
        <div class="landing-intro-stats" aria-label="Resumo da plataforma">
          <div><strong>01</strong><span>base centralizada</span></div>
          <div><strong>24h</strong><span>visão do período</span></div>
          <div><strong>100%</strong><span>contexto no registro</span></div>
        </div>
      </section>

      <section class="landing-evidence landing-container">
        <div class="landing-evidence-copy">
          <p class="landing-eyebrow">Registros e evidências</p>
          <h2>O que aconteceu, reunido em um só registro.</h2>
          <p>Consulte a caracterização da ocorrência, a localização e os anexos que sustentam a análise da equipe.</p>
        </div>
        <div class="landing-evidence-card">
          <img
            src="/evidence-amazonia.jpg"
            alt="Floresta amazônica às margens de um rio"
          />
        </div>
      </section>

      <section id="funcionalidades" class="landing-section landing-container">
        <div class="landing-section-heading">
          <p class="landing-eyebrow">Uma base organizada</p>
          <h2>Informação clara para acompanhar cada registro.</h2>
        </div>
        <div class="landing-feature-grid">
          <article v-for="item in funcionalidades" :key="item.titulo" class="landing-feature">
            <span class="landing-feature-icon"><component :is="item.icone" :size="19" aria-hidden="true" /></span>
            <h3>{{ item.titulo }}</h3>
            <p>{{ item.descricao }}</p>
          </article>
        </div>
      </section>

      <section id="como-funciona" class="landing-section landing-container landing-steps-section">
        <div class="landing-section-heading">
          <p class="landing-eyebrow">Como funciona</p>
          <h2>Do registro à análise, sem perder o contexto.</h2>
        </div>
        <ol class="landing-steps">
          <li><span>01</span><div><h3>Registre a ocorrência.</h3><p>Informe o tipo, o local, a data e uma descrição do evento.</p></div></li>
          <li><span>02</span><div><h3>Analise o contexto e as evidências.</h3><p>Consulte os registros no mapa e organize as informações disponíveis.</p></div></li>
          <li><span>03</span><div><h3>Acompanhe os dados e os relatórios.</h3><p>Use filtros, indicadores e relatórios para apoiar a leitura do período.</p></div></li>
        </ol>
      </section>

      <section class="landing-cta landing-container">
        <div><p class="landing-eyebrow">EcoMonitor</p><h2>Mais contexto para acompanhar o território.</h2><p>Organize as informações ambientais da sua equipe em uma base única.</p></div>
      </section>
    </main>

    <footer class="landing-footer landing-container">
      <div class="landing-footer-brand">
        <img class="brand-logo" src="/logo-ecomonitor-original.png" alt="" aria-hidden="true" />
        <div><strong>EcoMonitor</strong><span>Registros ambientais organizados para análise.</span></div>
      </div>
      <nav aria-label="Links do rodapé"><a href="#inicio">Privacidade</a><a href="#inicio">Termos de uso</a></nav>
    </footer>
  </div>
</template>
