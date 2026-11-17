// Verifica a sidebar sem o card de Área de trabalho.
import { chromium } from 'playwright-core'
import { existsSync } from 'node:fs'

const TMP = 'C:/Users/desenvolvimento4/AppData/Local/Temp/opencode'
const edgePaths = [
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
]
const executablePath = edgePaths.find((p) => existsSync(p))
const base = 'http://localhost:5173'

const login = await fetch(base + '/api/v1/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'ana.teste@gmail.com', senha: 'Teste12345!' }),
}).then((r) => r.json())
const token = login.access_token
const user = { id: 6, nome: 'Ana Teste', email: 'ana.teste@gmail.com', created_at: '2026-11-17T15:06:06.004704Z' }

const browser = await chromium.launch({ executablePath, headless: true, args: ['--disable-gpu', '--hide-scrollbars'] })
const context = await browser.newContext({ viewport: { width: 1500, height: 900 } })
await context.addInitScript(
  ([t, u]) => {
    sessionStorage.setItem('ecomonitor.token', t)
    sessionStorage.setItem('ecomonitor.expiresAt', String(Date.now() + 3600e3))
    sessionStorage.setItem('ecomonitor.user', JSON.stringify(u))
  },
  [token, user],
)
const page = await context.newPage()

await page.goto(base + '/app/visao-geral', { waitUntil: 'networkidle' })
await page.waitForTimeout(900)
await page.screenshot({ path: `${TMP}/sidebar-sem-workspace.png`, clip: { x: 0, y: 0, width: 560, height: 640 } })

const recolhida = await page.evaluate(() => !!document.querySelector('.workspace'))
console.log('workspace ainda existe?', recolhida)

await browser.close()
console.log('ok')
