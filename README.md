# EcoMonitor Frontend (Vue 3)

Interface web do EcoMonitor para registro, consulta e visualização de
ocorrências de queimadas e desmatamento. O projeto consome exclusivamente a
API real do backend FastAPI, sem dados fictícios, mocks ou arquivos CSV de
exemplo.

Frontend em **Vue 3 + Vite + Bootstrap 5** para o EcoMonitor.

## Stack

- Vue 3 com Composition API e `<script setup>`
- Vite
- Vue Router
- Pinia
- Axios
- Bootstrap 5 e Bootstrap Icons
- Chart.js com `vue-chartjs`
- Leaflet com tiles do OpenStreetMap
- Vitest e `@vue/test-utils` para testes

## Requisitos

- Node.js 20.19+ ou 22.12+ (recomendado 22+)
- npm
- Backend do EcoMonitor rodando em `http://127.0.0.1:8000`

## Estrutura

```text
EcoMonitor-Frontend-Vue/
├── index.html
├── package.json
├── vite.config.js
├── .env.example
├── .gitignore
├── README.md
├── public/
│   └── favicon.svg
├── src/
│   ├── main.js
│   ├── App.vue
│   ├── config.js
│   ├── assets/
│   │   └── styles.css
│   ├── components/
│   │   ├── AuthShell.vue
│   │   ├── BaseModal.vue
│   │   ├── ConfirmDialog.vue
│   │   ├── EmptyState.vue
│   │   ├── KpiCard.vue
│   │   ├── Pagination.vue
│   │   ├── SidebarContent.vue
│   │   └── TipoBadge.vue
│   ├── layouts/
│   │   └── AppLayout.vue
│   ├── router/
│   │   └── index.js
│   ├── services/
│   │   ├── api.js
│   │   ├── auth.js
│   │   ├── ocorrencias.js
│   │   └── stats.js
│   ├── stores/
│   │   └── auth.js
│   ├── utils/
│   │   ├── constants.js
│   │   ├── format.js
│   │   ├── map.js
│   │   ├── reports.js
│   │   └── storage.js
│   └── views/
│       ├── DashboardView.vue
│       ├── LoginView.vue
│       ├── MapaView.vue
│       ├── NovaOcorrenciaView.vue
│       ├── OcorrenciasView.vue
│       ├── RegisterView.vue
│       └── RelatoriosView.vue
└── tests/
    ├── api.spec.js
    ├── auth.spec.js
    ├── format.spec.js
    ├── map.spec.js
    └── reports.spec.js
```

## Instalação

```powershell
cd C:\Users\desenvolvimento4\EcoMonitor-Frontend-Vue
npm install
Copy-Item .env.example .env
```

O arquivo `.env` é opcional no desenvolvimento, pois o valor padrão já aponta
para o proxy local:

```env
VITE_API_URL=/api/v1
```

## Iniciar o backend

Em outro terminal:

```powershell
cd C:\Users\desenvolvimento4\EcoMonitor-Backend
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload
```

Verifique:

- API: `http://127.0.0.1:8000`
- Saúde: `http://127.0.0.1:8000/health`
- Documentação: `http://127.0.0.1:8000/docs`

## Iniciar o frontend

```powershell
cd C:\Users\desenvolvimento4\EcoMonitor-Frontend-Vue
npm run dev
```

Acesse `http://localhost:5173`.

O Vite encaminha as chamadas de `/api` e `/health` para
`http://127.0.0.1:8000`. Como o navegador conversa apenas com a origem do
frontend, **não é necessário configurar CORS no desenvolvimento**.

## Proxy e CORS

O proxy está em `vite.config.js` e vale para `npm run dev` e
`npm run preview`:

```js
const proxy = {
  '/api': {
    target: 'http://127.0.0.1:8000',
    changeOrigin: true,
  },
  '/health': {
    target: 'http://127.0.0.1:8000',
    changeOrigin: true,
  },
}

export default defineConfig({
  server: { port: 5173, proxy },
  preview: { port: 4173, proxy },
})
```

Em produção, o frontend não usa o proxy do Vite. Configure a URL completa da
API no `.env` antes do build:

```env
VITE_API_URL=https://seu-dominio.com/api/v1
VITE_DOCS_URL=https://seu-dominio.com/docs
```

Depois, adicione a origem do frontend em `CORS_ORIGINS` no `.env` do backend,
separando múltiplas origens por vírgula:

```env
CORS_ORIGINS=http://localhost:5173,https://seu-frontend.com
```

O backend precisa ser reiniciado após alterar o `.env`. O proxy do Vite vale
somente para `npm run dev`; o build gera arquivos estáticos em `dist/`.

Para publicar o build:

```powershell
npm run build
npm run preview
```

Ao servir o `dist/` em produção, configure o servidor estático para devolver
`index.html` em rotas desconhecidas (fallback de SPA), pois o Vue Router usa
`history` mode.

## Funcionalidades

- Login e cadastro de usuários contra a API real.
- Login automático após o cadastro.
- Sessão com JWT em `sessionStorage`, expiração e validação via `/auth/me`.
- Interceptor Axios que envia `Authorization: Bearer <token>`.
- Logout e redirecionamento automático em caso de `401`.
- Dashboard com indicadores globais:
  - total de ocorrências;
  - queimadas;
  - desmatamentos;
  - municípios monitorados.
- Gráfico de rosca por tipo.
- Gráfico de barras com os 10 municípios com mais ocorrências.
- Evolução mensal calculada sobre todas as ocorrências cadastradas.
- Estado vazio quando o banco não possui ocorrências.
- Listagem paginada com filtros server-side por:
  - tipo;
  - município (select alimentado por `/stats`);
  - período inicial e final;
  - itens por página (10, 20, 50 ou 100).
- Modal de detalhes da ocorrência.
- Edição parcial com `PATCH`, enviando somente os campos alterados.
- Exclusão com confirmação.
- Edição e exclusão disponíveis apenas para o responsável.
- Formulário de nova ocorrência com:
  - tipo, município, UF, descrição e data;
  - data máxima igual a hoje;
  - coordenadas opcionais;
  - sugestões de municípios já cadastrados.
- Mapa interativo com Leaflet e tiles do OpenStreetMap:
  - filtros server-side por tipo, município e período;
  - marcadores coloridos por tipo (laranja para queimada e verde para
    desmatamento);
  - popups com tipo, município/UF, data, coordenadas e descrição;
  - legenda com contagem por tipo;
  - ajuste automático aos marcadores e botão para centralizar no Brasil;
  - carregamento de todas as páginas da API;
  - estados de carregamento, vazio e API offline;
  - ocorrências sem coordenadas ou fora do território brasileiro são
    contabilizadas no rodapé e não aparecem no mapa.
- Relatórios consolidados calculados no frontend sobre `/ocorrencias` e
  `/stats`:
  - filtros por tipo, município e período;
  - indicadores de total, queimadas, desmatamentos e municípios atingidos;
  - período analisado e evolução mensal empilhada por tipo;
  - gráfico dos 10 municípios com mais ocorrências;
  - tabela-resumo por município com queimadas, desmatamentos, total e
    participação;
  - exportação CSV detalhada das ocorrências e resumo por município;
  - estados de carregamento, vazio, validação do período e API offline.
- Indicador de saúde da API no menu, consultando `/health`.
- Layout responsivo: sidebar fixa no desktop e menu lateral no mobile.
- Identidade visual verde, branco e verde-escuro.

## Rotas

| Rota | Tela | Proteção |
|---|---|---|
| `/login` | Login | Pública |
| `/cadastro` | Criar conta | Pública |
| `/dashboard` | Dashboard | Autenticada |
| `/ocorrencias` | Listagem e filtros | Autenticada |
| `/ocorrencias/nova` | Nova ocorrência | Autenticada |
| `/mapa` | Mapa interativo das ocorrências | Autenticada |
| `/relatorios` | Relatórios consolidados e exportação CSV | Autenticada |

A rota `/` redireciona para `/dashboard`. Rotas inexistentes também são
redirecionadas para o dashboard; se não houver sessão, o usuário vai para o
login.

## Autenticação e permissões

- O token JWT fica em `sessionStorage` e é reconstruído ao recarregar a página.
- A sessão é validada com `GET /auth/me` antes de liberar as rotas protegidas.
- Se o token estiver expirado ou a API retornar `401`, a sessão é limpa e o
  usuário volta ao login com uma mensagem.
- Qualquer usuário autenticado pode listar e consultar ocorrências.
- Somente o usuário que criou a ocorrência (`created_by`) pode editá-la ou
  excluí-la. A interface esconde as ações e o backend também bloqueia com
  `403`.

## Tratamento de erros

As mensagens são normalizadas em `src/services/api.js`:

| Situação | Comportamento |
|---|---|
| `400` | Exibe a mensagem de período inválido da API |
| `401` | Limpa a sessão e redireciona para o login |
| `403` | Exibe mensagem de permissão negada |
| `404` | Exibe recurso não encontrado |
| `409` | Exibe conflito, como email já cadastrado |
| `422` | Converte a lista de validação em mensagens legíveis |
| API offline | Exibe mensagem amigável com instrução para iniciar o backend |

O cliente Axios usa timeout de 10 segundos e nunca mostra traceback ou detalhes
técnicos crus para o usuário.

## API consumida

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `GET /api/v1/auth/me`
- `GET /api/v1/stats`
- `GET /api/v1/ocorrencias`
- `POST /api/v1/ocorrencias`
- `GET /api/v1/ocorrencias/{id}`
- `PATCH /api/v1/ocorrencias/{id}`
- `DELETE /api/v1/ocorrencias/{id}`
- `GET /health` (fora de `/api/v1`)

O frontend não envia `created_by` no corpo: o backend define o responsável a
partir do token. A atualização usa `PATCH`; `PUT` não é utilizado.

## Testes e build

```powershell
npm run test
npm run test:watch
npm run build
```

Os testes não dependem do backend rodando:

- `tests/format.spec.js` valida datas, números, rótulos, cores e responsável.
- `tests/api.spec.js` valida o interceptor de token e o tratamento de `401`,
  `409`, `422`, timeout e erro de conexão com adaptador Axios simulado.
- `tests/auth.spec.js` valida hydrate, login, expiração, `ensureSession`,
  logout e mensagem de sessão.
- `tests/map.spec.js` valida coordenadas, limites, contagem por tipo, escape
  de HTML e conteúdo dos popups.
- `tests/reports.spec.js` valida resumo, agrupamento por município, evolução
  mensal, descrição do período, percentuais e geração dos CSVs.

O build de produção é gerado em `dist/`.

## Dados fictícios (opcional)

O frontend não possui mocks, CSV ou seed próprios: todas as telas consomem a
API real. Se o banco estiver vazio, o dashboard mostra um estado vazio com um
botão para cadastrar a primeira ocorrência.

Para demonstrações, o backend possui o script opcional
`scripts/seed_exemplos.py`, que cadastra 40 ocorrências fictícias
(20 queimadas e 20 desmatamentos) distribuídas nos últimos 12 meses. Os
registros recebem o prefixo `[exemplo]` na descrição e podem ser removidos sem
afetar os dados reais:

```powershell
cd C:\Users\desenvolvimento4\EcoMonitor-Backend
.\.venv\Scripts\python.exe scripts\seed_exemplos.py
.\.venv\Scripts\python.exe scripts\seed_exemplos.py --limpar
```

O script não roda automaticamente; os dados só aparecem se ele for executado.

## Frontend Streamlit preservado

O projeto Streamlit existente em
`C:\Users\desenvolvimento4\EcoMonitor-Frontend` não foi alterado nem removido.
Ele pode continuar sendo usado como comparação ou fallback.

## Checklist manual de integração

1. Inicie o backend e confirme `GET http://127.0.0.1:8000/health`.
2. Inicie o frontend e acesse `http://localhost:5173`.
3. Confirme o redirecionamento para `/login`.
4. Crie uma conta em `/cadastro` e verifique o login automático.
5. Confirme o estado vazio do dashboard quando não houver ocorrências.
6. Cadastre uma ocorrência com e sem coordenadas.
7. Confirme os indicadores, a rosca, as barras e a evolução mensal.
8. Na listagem, filtre por tipo, município e período.
9. Altere o tamanho da página e navegue com Anterior/Próxima.
10. Abra os detalhes de uma ocorrência.
11. Edite somente a descrição e confirme que o `PATCH` foi parcial.
12. Exclua uma ocorrência e confirme a remoção da lista.
13. Entre com outro usuário e confirme que as ações de edição/exclusão não
    aparecem para ocorrências de terceiros.
14. Acesse `/mapa` e confirme os marcadores, a legenda e o total exibido.
15. Filtre o mapa por tipo, município e período.
16. Use os botões "Ajustar" e "Brasil" e confira o enquadramento.
17. Abra o popup de um marcador e confira tipo, local, data e coordenadas.
18. Confirme a contagem de ocorrências sem coordenadas ou fora da área de
    cobertura no rodapé do mapa.
19. Acesse `/relatorios` e confira os indicadores, o período analisado, a
    evolução mensal e o ranking de municípios.
20. Filtre os relatórios por tipo, município e período e confirme que os
    cards, gráficos e a tabela são recalculados.
21. Exporte o CSV detalhado e o resumo por município, abra os arquivos no
    Excel e confira acentuação, colunas e separador.
22. Aplique um período sem ocorrências e confirme o estado vazio.
23. Pare o backend e confirme as mensagens de API offline.
24. Reinicie o backend, faça login e confirme que o indicador de saúde fica
    verde.
25. Reduza `ACCESS_TOKEN_EXPIRE_MINUTES` no backend, aguarde a expiração e
    confirme o retorno ao login.
26. Abra o menu mobile e teste a navegação.
27. Confirme que o link de documentação abre `http://127.0.0.1:8000/docs`.

## Solução de problemas

- **Mensagem de API offline**: verifique se o backend está rodando na porta
  8000.
- **Erro de CORS em produção**: adicione a origem do frontend em
  `CORS_ORIGINS` e reinicie o backend.
- **Rotas quebradas após publicar o build**: configure o fallback de SPA para
  `index.html`.
- **Login retorna para a tela inicial**: o token pode ter expirado; faça login
  novamente.
- **Filtro de município sem resultados**: a API é sensível a acentos; use a
  opção preenchida pelo select de `/stats`.
- **Mapa sem tiles**: o Leaflet usa os tiles públicos do OpenStreetMap;
  verifique a conexão com a internet.
- **Marcador ausente no mapa**: confira latitude e longitude. Pontos vazios,
  inválidos ou fora do território brasileiro são contabilizados no rodapé e
  não são plotados.
- **Datas**: o frontend envia e recebe datas no formato `AAAA-MM-DD` e exibe
  no formato `dd/mm/aaaa`.
