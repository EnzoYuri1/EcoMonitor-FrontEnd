# EcoMonitor Frontend

Interface web do **EcoMonitor**, plataforma de registro, consulta e análise de
ocorrências de queimadas e desmatamento. Construída com Vue 3 e Vite, consome a
API REST do backend FastAPI e inclui uma Central de Informações Ambientais
(notícias, artigos científicos e monitoramento oficial), mapa interativo,
relatórios exportáveis, gestão de perfis e um assistente de IA.

## Sumário

- [Visão geral](#visão-geral)
- [Stack tecnológica](#stack-tecnológica)
- [Requisitos](#requisitos)
- [Início rápido](#início-rápido)
- [Configuração](#configuração)
- [Scripts disponíveis](#scripts-disponíveis)
- [Estrutura do projeto](#estrutura-do-projeto)
- [Funcionalidades](#funcionalidades)
- [Rotas](#rotas)
- [Autenticação e perfis de acesso](#autenticação-e-perfis-de-acesso)
- [Dados demonstrativos](#dados-demonstrativos)
- [API consumida](#api-consumida)
- [Tratamento de erros](#tratamento-de-erros)
- [Testes](#testes)
- [Build e publicação](#build-e-publicação)
- [Solução de problemas](#solução-de-problemas)

## Visão geral

| Área | Descrição |
|---|---|
| Pública | Landing page, Central de Informações Ambientais, login e cadastro |
| Autenticada | Dashboard, ocorrências, mapa, relatórios, central e assistente de IA |
| Administrativa | Gestão de usuários e perfis (somente `admin`) |

As telas operacionais usam exclusivamente a API real, sem mocks ou CSV. Os
únicos dados simulados são metadados visuais claramente identificados como
demonstrativos (ver [Dados demonstrativos](#dados-demonstrativos)).

## Stack tecnológica

- **Vue 3** (Composition API, `<script setup>`) e **Vite**
- **Vue Router** e **Pinia**
- **Axios** com interceptors de autenticação e erros
- **Tailwind CSS 4**, **shadcn-vue** (Reka UI, class-variance-authority) e
  **Lucide** para ícones
- **Chart.js** com `vue-chartjs`
- **Leaflet** com tiles do OpenStreetMap
- **VueUse** para utilitários reativos
- **Vitest**, `@vue/test-utils` e `jsdom` para testes

## Requisitos

- Node.js 20.19+ ou 22.12+ (recomendado 22+)
- npm
- Backend do EcoMonitor em execução (padrão: `http://127.0.0.1:8000`)

## Início rápido

```powershell
# 1. Instalar dependências
npm install

# 2. (Opcional) criar o arquivo de ambiente
Copy-Item .env.example .env

# 3. Iniciar o backend em outro terminal
cd C:\Users\desenvolvimento4\EcoMonitor-Backend
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload

# 4. Iniciar o frontend
npm run dev
```

Acesse `http://localhost:5173`. Para validar o backend:

- API: `http://127.0.0.1:8000`
- Saúde: `http://127.0.0.1:8000/health`
- Documentação: `http://127.0.0.1:8000/docs`

## Configuração

### Variáveis de ambiente

| Variável | Padrão | Descrição |
|---|---|---|
| `VITE_API_URL` | `/api/v1` | URL base da API. Em desenvolvimento, use o caminho relativo (proxy do Vite) |
| `VITE_DOCS_URL` | derivada da API | Link da documentação exibido na interface |

O `.env` é opcional em desenvolvimento. Em produção, informe a URL completa:

```env
VITE_API_URL=https://seu-dominio.com/api/v1
VITE_DOCS_URL=https://seu-dominio.com/docs
```

### Proxy e CORS

O `vite.config.js` encaminha `/api` e `/health` para `http://127.0.0.1:8000`
em `npm run dev` (porta 5173) e `npm run preview` (porta 4173). Como o
navegador fala apenas com a origem do frontend, **não é necessário configurar
CORS em desenvolvimento**.

Em produção não há proxy: adicione a origem do frontend em `CORS_ORIGINS` no
`.env` do backend (valores separados por vírgula) e reinicie-o:

```env
CORS_ORIGINS=http://localhost:5173,https://seu-frontend.com
```

## Scripts disponíveis

| Comando | Descrição |
|---|---|
| `npm run dev` | Servidor de desenvolvimento com HMR |
| `npm run build` | Gera o build de produção em `dist/` |
| `npm run preview` | Serve o build localmente |
| `npm run test` | Executa a suíte de testes uma vez |
| `npm run test:watch` | Executa os testes em modo observação |

O arquivo `scripts-sidebar.mjs` é um script auxiliar de verificação visual da
barra lateral com Playwright e Edge; não faz parte do build.

## Estrutura do projeto

```text
EcoMonitor-Frontend-Vue/
├── index.html
├── package.json
├── vite.config.js
├── components.json            # configuração shadcn-vue
├── jsconfig.json
├── .env.example
├── public/                    # imagens da Amazônia, logo e favicon
├── src/
│   ├── main.js
│   ├── App.vue
│   ├── config.js              # URLs da API, saúde, documentação e timeout
│   ├── assets/                # estilos globais (styles.css)
│   ├── lib/utils.js           # helper cn() do shadcn
│   ├── layouts/
│   │   └── AppLayout.vue      # shell da área autenticada
│   ├── router/index.js        # rotas e guards
│   ├── stores/                # Pinia
│   │   ├── auth.js            # sessão, perfil e permissões
│   │   ├── app.js             # notificações e última atualização
│   │   ├── demo.js            # status demonstrativo das ocorrências
│   │   └── tema.js            # tema claro/escuro
│   ├── services/              # camada de acesso à API
│   │   ├── api.js             # cliente Axios e normalização de erros
│   │   ├── auth.js
│   │   ├── ocorrencias.js
│   │   ├── stats.js
│   │   ├── usuarios.js
│   │   ├── central.js
│   │   └── assistente.js
│   ├── utils/
│   │   ├── assistente.js      # histórico do chat
│   │   ├── constants.js
│   │   ├── demo.js            # metadados demonstrativos determinísticos
│   │   ├── format.js
│   │   ├── map.js
│   │   ├── noticiaImpacto.js  # regiões de impacto e pontos de notícias
│   │   ├── permissoes.js
│   │   ├── reports.js
│   │   └── storage.js
│   ├── components/
│   │   ├── ui/                # primitivos shadcn-vue (badge, button, card,
│   │   │                      #   checkbox, input, scroll-area, select,
│   │   │                      #   separator, sheet, textarea)
│   │   ├── AssistenteChat.vue
│   │   ├── ArtigoCard.vue
│   │   ├── AuthShell.vue
│   │   ├── BaseModal.vue
│   │   ├── ConfirmDialog.vue
│   │   ├── EmptyState.vue
│   │   ├── KpiCard.vue
│   │   ├── MiniMapa.vue
│   │   ├── NoticiaCard.vue
│   │   ├── NoticiaImpactoModal.vue
│   │   ├── PageHeader.vue
│   │   ├── Pagination.vue
│   │   ├── SeverityBadge.vue
│   │   ├── SidebarContent.vue
│   │   ├── StatusBadge.vue
│   │   └── TipoBadge.vue
│   └── views/
│       ├── LandingView.vue
│       ├── LoginView.vue
│       ├── RegisterView.vue
│       ├── CentralAmbientalView.vue
│       ├── DashboardView.vue
│       ├── OcorrenciasView.vue
│       ├── NovaOcorrenciaView.vue
│       ├── OcorrenciaDetalheView.vue
│       ├── MapaView.vue
│       ├── RelatoriosView.vue
│       └── UsuariosView.vue
└── tests/                     # api, assistente, auth, central, format, map,
                               #   permissoes e reports
```

## Funcionalidades

### Área pública

- **Landing page** com apresentação do produto, navegação por seções e
  chamadas para login e cadastro. Os números exibidos (como `128` ocorrências
  e `3.842 ha`) são ilustrativos.
- **Central de Informações Ambientais** acessível sem login (`/central`).
- **Login e cadastro** em layout compartilhado (`AuthShell`), com login
  automático após o registro.

### Central de Informações Ambientais

Disponível na área pública e na área autenticada, organizada em abas:

- **Início**: destaques consolidados.
- **Notícias**: listagem paginada com filtro por categoria, busca por termo e
  ordenação; cada card mostra veículo, data de publicação, data de coleta e
  link original.
- **Artigos científicos**: filtro por base, busca e ordenação, com autores,
  periódico, DOI e citações.
- **Monitoramento oficial**: indicadores por estado, métrica e recorte da
  Amazônia.
- **Busca** unificada entre os conteúdos.
- **Impacto territorial**: notícias com localização são cruzadas com regiões
  afetadas e dados do INPE, exibindo um modal com mini mapa.
- **Atualização manual** das fontes, disponível para administradores.

### Dashboard (Visão geral)

- Indicadores globais: total, queimadas, desmatamentos e municípios
  monitorados.
- Gráfico de rosca por tipo, barras dos 10 municípios com mais ocorrências e
  evolução mensal calculada sobre todas as ocorrências.
- Estado vazio com atalho para cadastrar a primeira ocorrência.

### Ocorrências

- Listagem paginada (10, 20, 50 ou 100 itens) com filtros server-side por
  tipo, município e período.
- Página de **detalhe** com mini mapa, severidade, status, histórico e
  metadados demonstrativos.
- **Nova ocorrência**: tipo, município, UF, descrição, data (máximo hoje),
  coordenadas opcionais e sugestões de municípios já cadastrados.
- Edição parcial com `PATCH` (apenas campos alterados) e exclusão com
  confirmação, conforme as [permissões](#autenticação-e-perfis-de-acesso).

### Mapa

- Leaflet com OpenStreetMap, filtros por tipo, município e período.
- Marcadores diferenciados por tipo, popups detalhados e legenda com
  contagem.
- Ajuste automático aos marcadores e botão para centralizar no Brasil.
- Carrega todas as páginas da API; registros sem coordenadas válidas ou fora
  do território brasileiro são contabilizados no rodapé.

### Relatórios

- Filtros por tipo, município e período.
- Indicadores, período analisado, evolução mensal empilhada por tipo,
  ranking de municípios e tabela-resumo com participação percentual.
- **Exportação CSV** detalhada e resumo por município.

### Gestão de usuários (admin)

- Lista de contas com promoção e rebaixamento de perfil.

### Assistente de IA

- Botão flutuante em todas as telas autenticadas, via OpenRouter.
- Sugestões de perguntas, indicador de digitação e erros amigáveis.
- Histórico em `sessionStorage` (limitado a 24 mensagens) e botão de limpar.
- Mensagens de até 1.000 caracteres, timeout próprio de 45 s.
- Aviso permanente: o assistente apenas orienta, não altera dados.

### Interface

- Tema **claro e escuro** com persistência em `localStorage`.
- Sidebar recolhível no desktop e menu lateral no mobile.
- Indicador de saúde da API (`/health`) e central de notificações.
- Selo de perfil de administrador na barra lateral.

## Rotas

| Rota | Tela | Proteção |
|---|---|---|
| `/` | Landing page | Pública |
| `/central` | Central de Informações Ambientais | Pública |
| `/login` | Login | Visitante |
| `/cadastro` | Criar conta | Visitante |
| `/app/visao-geral` | Dashboard | Autenticada |
| `/app/ocorrencias` | Listagem e filtros | Autenticada |
| `/app/ocorrencias/nova` | Nova ocorrência | Autenticada |
| `/app/ocorrencias/:id` | Detalhe da ocorrência | Autenticada |
| `/app/mapa` | Mapa interativo | Autenticada |
| `/app/relatorios` | Relatórios e exportação CSV | Autenticada |
| `/app/central` | Central de Informações Ambientais | Autenticada |
| `/app/usuarios` | Gestão de perfis | Autenticada + admin |

Os caminhos legados (`/dashboard`, `/ocorrencias`, `/ocorrencias/nova`,
`/ocorrencias/:id`, `/mapa`, `/relatorios`) redirecionam para `/app`. Rotas
inexistentes voltam para a landing page. Usuários autenticados que acessam
`/login` ou `/cadastro` são levados ao dashboard.

## Autenticação e perfis de acesso

- JWT armazenado em `sessionStorage` e reconstruído ao recarregar a página.
- Sessão validada com `GET /auth/me` antes de liberar rotas protegidas.
- O interceptor Axios envia `Authorization: Bearer <token>`; um `401` limpa a
  sessão e redireciona ao login com mensagem.
- O perfil vem do backend como `admin` ou `funcionario`.

| Ação | Funcionário | Administrador |
|---|---|---|
| Listar e consultar ocorrências | Sim | Sim |
| Criar ocorrência | Sim | Sim |
| Editar/excluir ocorrência própria | Sim | Sim |
| Editar/excluir ocorrência de terceiros | Não | Sim |
| Acessar **Usuários** e alterar perfis | Não | Sim |
| Atualizar fontes da Central | Não | Sim |

A interface oculta as ações sem permissão, e o backend também as bloqueia com
`403`: a regra real nunca depende apenas da tela. O frontend não envia
`created_by`; o responsável é definido pelo backend a partir do token.

## Dados demonstrativos

A API não possui os campos de **severidade**, **status**, **área**, **bioma**,
**anexos** e **histórico**. Para compor a interface:

- `src/utils/demo.js` deriva esses valores de forma determinística a partir do
  registro real.
- `src/stores/demo.js` guarda alterações de status apenas no `localStorage`
  do navegador, sem enviar requisições.
- Todos os pontos são identificados como demonstrativos na interface e nada é
  gravado no backend.

Para popular um banco vazio, o backend oferece o script opcional
`scripts/seed_exemplos.py` (40 ocorrências com prefixo `[exemplo]`):

```powershell
cd C:\Users\desenvolvimento4\EcoMonitor-Backend
.\.venv\Scripts\python.exe scripts\seed_exemplos.py
.\.venv\Scripts\python.exe scripts\seed_exemplos.py --limpar
```

## API consumida

Prefixo `/api/v1`, exceto `/health`.

| Domínio | Endpoints |
|---|---|
| Autenticação | `POST /auth/register`, `POST /auth/login`, `GET /auth/me` |
| Estatísticas | `GET /stats` |
| Ocorrências | `GET`, `POST /ocorrencias`; `GET`, `PATCH`, `DELETE /ocorrencias/{id}` |
| Usuários (admin) | `GET /usuarios`, `PATCH /usuarios/{id}/perfil` |
| Central | `GET /central/destaques`, `/central/noticias`, `/central/artigos`, `/central/monitoramento`, `/central/busca`, `/central/status`; `POST /central/atualizar` |
| Assistente | `POST /assistente` |
| Saúde | `GET /health` |

A atualização de ocorrências usa `PATCH`; `PUT` não é utilizado.

## Tratamento de erros

As mensagens são normalizadas em `src/services/api.js`. O cliente usa timeout
de 10 s e nunca exibe traceback ou detalhes técnicos ao usuário.

| Situação | Comportamento |
|---|---|
| `400` | Mensagem de validação, como período inválido |
| `401` | Limpa a sessão e redireciona ao login |
| `403` | Permissão negada |
| `404` | Recurso não encontrado |
| `409` | Conflito, como e-mail já cadastrado |
| `422` | Lista de validação convertida em mensagens legíveis |
| API offline | Mensagem amigável com instrução para iniciar o backend |

## Testes

```powershell
npm run test
```

A suíte não depende do backend em execução:

| Arquivo | Cobertura |
|---|---|
| `api.spec.js` | Interceptor de token, `401`, `409`, `422`, timeout e erro de conexão |
| `auth.spec.js` | Hydrate, login, expiração, `ensureSession`, logout e perfis |
| `permissoes.spec.js` | Regra de edição: responsável, funcionário e administrador |
| `format.spec.js` | Datas, números, rótulos, cores e responsável |
| `map.spec.js` | Coordenadas, limites, contagem por tipo e popups |
| `reports.spec.js` | Resumos, agrupamentos, evolução mensal, percentuais e CSV |
| `assistente.spec.js` | Histórico filtrado e limitado, timeout, erros e `sessionStorage` |
| `central.spec.js` | Serviço da Central, `NoticiaCard`, `ArtigoCard` e evento de impacto |

## Build e publicação

```powershell
npm run build
npm run preview
```

O build gera arquivos estáticos em `dist/`. Como o Vue Router usa `history`
mode, configure o servidor para devolver `index.html` em rotas desconhecidas
(fallback de SPA). Defina `VITE_API_URL` antes do build e ajuste o CORS no
backend.

## Solução de problemas

| Sintoma | Solução |
|---|---|
| Mensagem de API offline | Verifique se o backend está rodando na porta 8000 |
| Erro de CORS em produção | Adicione a origem em `CORS_ORIGINS` e reinicie o backend |
| Rotas quebradas após publicar | Configure o fallback de SPA para `index.html` |
| Retorno ao login | O token expirou; autentique-se novamente |
| Filtro de município sem resultados | A API é sensível a acentos; use a opção do select |
| Mapa sem tiles | Verifique a conexão com os tiles do OpenStreetMap |
| Marcador ausente no mapa | Confira latitude e longitude; pontos inválidos ou fora do Brasil não são plotados |
| Menu **Usuários** ausente | Disponível apenas para o perfil `admin` |
| Datas | O formato de troca é `AAAA-MM-DD`; a exibição é `dd/mm/aaaa` |
