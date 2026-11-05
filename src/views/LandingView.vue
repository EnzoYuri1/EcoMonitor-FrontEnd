<script setup>
import { RouterLink } from 'vue-router'
import amazonRainforest from '../assets/amazon-rainforest.jpg'
</script>

<template>
  <div class="landing-page">
    <header class="landing-header">
      <RouterLink class="brand" :to="{ name: 'inicio' }">
        <span class="brand-symbol" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="8.5" stroke="currentColor" stroke-width="1.4" />
            <path d="M3.5 12h3.2l1.8-4.4 2.6 8.8 2.2-4.4h3.2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </span>
        <span class="brand-name">EcoMonitor</span>
      </RouterLink>

      <nav class="landing-nav" aria-label="Navegação principal">
        <a href="#funcionalidades">Funcionalidades</a>
        <a href="#como-funciona">Como funciona</a>
      </nav>

      <div class="landing-actions">
        <RouterLink class="btn btn-outline-secondary btn-sm" :to="{ name: 'login' }">Entrar</RouterLink>
        <RouterLink class="btn btn-primary btn-sm" :to="{ name: 'cadastro' }">Criar conta</RouterLink>
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
        </div>

        <div class="landing-preview" aria-label="Prévia demonstrativa da plataforma">
          <div class="landing-preview-bar">
            <span class="landing-preview-title">EcoMonitor / Visão geral</span>
            <span class="landing-demo-label">Dados demonstrativos</span>
          </div>
          <div class="landing-preview-heading">
            <div><h2>Pressão no território</h2><span>Ocorrências ambientais organizadas por região</span></div>
            <small>Outubro de 2026</small>
          </div>
          <div class="landing-preview-kpis">
            <div><strong>128</strong><small>Ocorrências</small></div>
            <div><strong>3.842 <em>ha</em></strong><small>Área estimada</small></div>
            <div><strong>41</strong><small>Em análise</small></div>
          </div>
          <div class="landing-preview-body">
            <div class="landing-preview-map">
              <img class="landing-map-photo" :src="amazonRainforest" alt="Imagem aérea da Amazônia com o rio atravessando a floresta" />
              <span class="landing-map-photo-title">Amazônia</span>
              <span class="landing-map-pin landing-map-pin-a"><i class="bi bi-geo-alt-fill" aria-hidden="true"></i></span>
              <span class="landing-map-pin landing-map-pin-b"><i class="bi bi-geo-alt-fill" aria-hidden="true"></i></span>
              <div class="landing-map-tools" aria-hidden="true">
                <span><i class="bi bi-plus"></i></span>
                <span><i class="bi bi-dash"></i></span>
              </div>
              <span class="landing-map-label">Imagem aérea demonstrativa · N ↑</span>
            </div>
          </div>
          <div class="landing-preview-footer">
            <span><i class="landing-legend-dot landing-legend-fire"></i> Queimadas</span>
            <span><i class="landing-legend-dot landing-legend-forest"></i> Desmatamento</span>
            <strong>EC-2026-0128 · São Félix do Xingu · PA</strong>
            <small>Em análise</small>
          </div>
        </div>
      </section>

      <section class="landing-evidence landing-container">
        <div class="landing-evidence-copy">
          <p class="landing-eyebrow">Registros e evidências</p>
          <h2>O que aconteceu, reunido em um só registro.</h2>
          <p>Consulte a caracterização da ocorrência, a localização e os anexos que sustentam a análise da equipe.</p>
        </div>
        <div class="landing-evidence-card" aria-label="Prévia demonstrativa de evidências ambientais">
          <div class="landing-evidence-header"><strong>EC-2026-0128</strong><span>Em análise</span></div>
          <small>São Félix do Xingu · Pará · Amazônia</small>
          <div class="landing-evidence-images">
            <div class="landing-evidence-item">
              <img class="landing-evidence-image" :src="amazonRainforest" alt="Imagem aérea demonstrativa da Amazônia" />
              <span>Vista aérea do perímetro</span>
            </div>
            <div class="landing-evidence-item">
              <svg class="landing-evidence-image" viewBox="0 0 220 110" role="img" aria-label="Frente de fumaça demonstrativa">
                <rect width="220" height="110" fill="#244433" />
                <path d="M0 72 32 48l29 13 27-27 35 28 26-21 34 24 37-18v63H0Z" fill="#173323" />
                <path d="M117 65c-16-16-8-30 4-36-5-13 9-21 17-28 1 16 13 23 8 37 15 11 8 25-2 36-8 9-18 5-27-9Z" fill="#b8c9be" fill-opacity=".72" />
                <path d="M125 54c-8-18 2-30 14-41" fill="none" stroke="#f3f7f5" stroke-opacity=".4" stroke-width="5" />
              </svg>
              <span>Frente de fumaça</span>
            </div>
          </div>
          <small class="landing-evidence-meta">Dados demonstrativos · sem vínculo com eventos reais</small>
        </div>
      </section>

      <section id="funcionalidades" class="landing-section landing-container">
        <div class="landing-section-heading">
          <p class="landing-eyebrow">Uma base organizada</p>
          <h2>Informação clara para acompanhar cada registro.</h2>
        </div>
        <div class="landing-feature-grid">
          <article v-for="item in [
            ['bi-geo-alt', 'Monitoramento no mapa', 'Visualize a distribuição das ocorrências no território.'],
            ['bi-journal-text', 'Registro organizado', 'Reúna localização, descrição e evidências em um só lugar.'],
            ['bi-activity', 'Acompanhamento das análises', 'Consulte status, severidade e histórico do registro.'],
            ['bi-file-earmark-bar-graph', 'Relatórios do período', 'Transforme registros em uma leitura consolidada.'],
          ]" :key="item[1]" class="landing-feature">
            <span class="landing-feature-icon"><i class="bi" :class="item[0]" aria-hidden="true"></i></span>
            <h3>{{ item[1] }}</h3>
            <p>{{ item[2] }}</p>
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
      <div><strong>EcoMonitor</strong><span>Registros ambientais organizados para análise.</span></div>
      <nav aria-label="Links do rodapé"><a href="#inicio">Privacidade</a><a href="#inicio">Termos de uso</a></nav>
    </footer>
  </div>
</template>
