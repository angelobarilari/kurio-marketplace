import { spawn } from 'node:child_process'
import { createReadStream } from 'node:fs'
import { access, mkdir, mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { createServer } from 'node:http'
import os from 'node:os'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { launch as launchChrome } from 'chrome-launcher'
import { chromium } from '@playwright/test'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const config = JSON.parse(
  await readFile(path.join(root, 'scripts', 'lighthouse-prerendered-routes.config.json'), 'utf8'),
)
const options = Object.fromEntries(
  process.argv.slice(2).map((argument) => {
    const [key, value] = argument.split('=')
    return [key.replace(/^--/, ''), value]
  }),
)
const targets = options.target
  ? config.targets.filter((target) => options.target.split(',').includes(target.name))
  : config.targets
const runsPerTarget = Number(options.runs ?? config.runsPerTarget)
if (!targets.length || !Number.isInteger(runsPerTarget) || runsPerTarget < 1) {
  throw new Error('Use --target=<route>[,...] and --runs=<positive integer>.')
}
const distDirectory = path.join(root, 'dist')
const outputDirectory = path.resolve(root, options.outputDirectory ?? config.outputDirectory)
const relativeOutputDirectory = path.relative(root, outputDirectory).split(path.sep).join('/')
const lighthouseEntry = path.join(root, 'node_modules', 'lighthouse', 'cli', 'index.js')
const baseUrl = new URL(config.baseUrl)
const port = Number(baseUrl.port || 4175)
const reportData = []
const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
}

const median = (values) => {
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2
}

const removeProfile = (profileDirectory) =>
  rm(profileDirectory, { recursive: true, force: true, maxRetries: 5, retryDelay: 500 })

const resolveDocument = async (pathname) => {
  if (/^\/orders\/[^/]+$/.test(pathname)) return path.join(distDirectory, 'orders.html')
  const routePath = pathname.replace(/\/+$/, '') || '/'
  const relativePath = routePath === '/' ? 'index.html' : `${routePath.slice(1)}.html`
  const candidate = path.resolve(distDirectory, relativePath)
  try {
    await access(candidate)
    return candidate
  } catch {
    return path.join(distDirectory, 'index.html')
  }
}

const serveFile = async (request, response) => {
  let pathname
  try {
    pathname = decodeURIComponent(new URL(request.url, config.baseUrl).pathname)
  } catch {
    response.writeHead(400).end('Invalid URL')
    return
  }

  const staticPath = path.resolve(distDirectory, `.${pathname}`)
  const isInsideDist = staticPath === distDirectory || staticPath.startsWith(`${distDirectory}${path.sep}`)
  let filePath = isInsideDist ? staticPath : path.join(distDirectory, 'index.html')
  try {
    const fileStat = await stat(filePath)
    if (fileStat.isDirectory()) filePath = await resolveDocument(pathname)
  } catch {
    filePath = await resolveDocument(pathname)
  }

  try {
    const fileStat = await stat(filePath)
    response.writeHead(200, {
      'Cache-Control': 'no-store',
      'Content-Length': fileStat.size,
      'Content-Type': contentTypes[path.extname(filePath)] ?? 'application/octet-stream',
    })
    if (request.method === 'HEAD') {
      response.end()
      return
    }
    createReadStream(filePath).pipe(response)
  } catch {
    response.writeHead(404).end('Not found')
  }
}

const server = createServer((request, response) => {
  void serveFile(request, response)
})

const closeServer = async () => {
  if (!server.listening) return
  await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())))
}

const waitForServer = async () => {
  const deadline = Date.now() + 10_000
  while (Date.now() < deadline) {
    try {
      const response = await fetch(config.baseUrl)
      if (response.ok) return
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 200))
    }
  }
  throw new Error(`The prerender audit server did not start at ${config.baseUrl}.`)
}

const requestApi = async (page, endpoint, method = 'GET', body) =>
  page.evaluate(
    async ({ endpoint, method, body }) => {
      const response = await fetch(endpoint, {
        method,
        headers:
          body === undefined
            ? undefined
            : {
                'Content-Type': 'application/json',
                ...(endpoint === '/api/orders' ? { 'idempotency-key': body.idempotencyKey } : {}),
              },
        body: body === undefined ? undefined : JSON.stringify(body),
      })
      const contentType = response.headers.get('content-type') ?? ''
      const text = await response.text()
      const data = contentType.includes('application/json') ? (text ? JSON.parse(text) : null) : text
      if (!response.ok) {
        throw new Error(`${method} ${endpoint} returned ${response.status}: ${text}`)
      }
      if (!contentType.includes('application/json')) {
        throw new Error(`${method} ${endpoint} returned ${contentType}: ${text.slice(0, 120)}`)
      }
      return data
    },
    { endpoint, method, body },
  )

const waitForMocks = async (page) => {
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null, null, { timeout: 30_000 })
}

const loginFixtureAccount = async (page) => {
  await requestApi(page, '/api/session/social/google', 'POST', {})
}

const addCartItem = async (page, nftId) => {
  const detail = await requestApi(page, `/api/nfts/${nftId}`)
  const edition = detail.editions.find((candidate) => candidate.availableQuantity > 0)
  if (!edition) throw new Error(`No available edition found for ${nftId}.`)
  const cart = await requestApi(page, '/api/cart/items', 'POST', {
    nftId,
    editionId: edition.id,
    quantity: 1,
  })
  if (cart.owner.kind === 'visitor') {
    await page.evaluate(
      (items) => localStorage.setItem('kurio:visitor-cart', JSON.stringify(items)),
      cart.items,
    )
  }
}

const verifySeededPage = async (page, target, pathname) => {
  await page.goto(new URL(pathname, config.baseUrl).toString())
  await page.getByText(target.expectedText, { exact: false }).first().waitFor({
    state: 'visible',
    timeout: 20_000,
  })
  await page.waitForTimeout(700)

  if (new URL(page.url()).pathname !== pathname) {
    throw new Error(`Seeded ${target.name} page navigated to ${page.url()}.`)
  }
  if (['account', 'checkout', 'order'].includes(target.seed)) {
    const loginButtonCount = await page.getByRole('button', { name: 'Continuar com Google' }).count()
    if (loginButtonCount > 0) throw new Error(`Seeded ${target.name} page rendered the login screen.`)
  }
}

const seedProfile = async (target, run) => {
  const profileDirectory = await mkdtemp(path.join(os.tmpdir(), `kurio-lh-${target.name}-${run}-`))
  const chrome = await launchChrome({
    chromeFlags: ['--headless'],
    userDataDir: profileDirectory,
  })

  try {
    const browser = await chromium.connectOverCDP(`http://127.0.0.1:${chrome.port}`)
    const context = browser.contexts()[0]
    const page = await context.newPage()
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto(config.baseUrl, { waitUntil: 'domcontentloaded' })
    await waitForMocks(page)
    let orderPath = null

    if (target.seed === 'cart') {
      for (const nftId of ['emerald-ape-042', 'sage-nomad-009', 'neon-vessel-552', 'cosmic-bloom-118']) {
        await addCartItem(page, nftId)
      }
    }

    if (['account', 'checkout', 'order'].includes(target.seed)) {
      await loginFixtureAccount(page)
    }

    if (['checkout', 'order'].includes(target.seed)) {
      await addCartItem(page, 'emerald-ape-042')
    }

    if (target.seed === 'order') {
      const walletId = 'wallet-nova-primary'
      const network = 'Ethereum'
      const provider = 'MetaMask'
      const connection = await requestApi(page, '/api/checkout/wallet-connection', 'POST', {
        walletId,
        network,
        provider,
      })
      const quoteRevision = await requestApi(page, '/api/cart/quote', 'POST', {})
      const idempotencyKey = `lighthouse-${run}-${crypto.randomUUID()}`
      const order = await requestApi(page, '/api/orders', 'POST', {
        idempotencyKey,
        connectionId: connection.id,
        quoteRevision,
        checkout: {
          displayName: 'Nova Sato',
          profileName: 'Nova Sato',
          username: 'nova',
          email: 'nova@kurio.example',
          network,
          walletId,
          walletAddress: '0xA91F00000000000000000000000000000000E82C',
          secondaryWalletAddress: null,
          walletType: provider,
          ensName: 'nova.kurio.eth',
          referralCode: 'LIGHTHOUSE',
          collectorNote: null,
        },
      })
      await requestApi(page, `/api/mock/orders/${order.id}/transition`, 'POST', {
        status: 'confirmed',
      })
      orderPath = `/orders/${order.id}`
    }

    await verifySeededPage(page, target, orderPath ?? target.path)
    const cdpSession = await context.newCDPSession(page)
    await cdpSession.send('Network.clearBrowserCache')
    await cdpSession.detach()
    await page.close()
    return { profileDirectory, orderPath, chrome }
  } catch (error) {
    await chrome.kill()
    await removeProfile(profileDirectory)
    throw error
  }
}

const runLighthouse = async (url, outputPath, chromePort) => {
  const args = [
    lighthouseEntry,
    url,
    '--output=html',
    '--output=json',
    `--output-path=${outputPath}`,
    '--form-factor=mobile',
    '--screenEmulation.mobile=true',
    '--screenEmulation.width=390',
    '--screenEmulation.height=844',
    '--screenEmulation.deviceScaleFactor=1',
    '--emulatedUserAgent=Mozilla/5.0 (Linux; Android 11; moto g power (2022)) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Mobile Safari/537.36',
    '--throttling-method=simulate',
    '--throttling.rttMs=150',
    '--throttling.throughputKbps=1638.4',
    '--throttling.cpuSlowdownMultiplier=4',
    '--disable-storage-reset',
    '--only-categories=performance,accessibility,best-practices,seo',
    '--quiet',
    `--port=${chromePort}`,
  ]

  await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, args, { cwd: root, stdio: 'inherit' })
    child.once('error', reject)
    child.once('exit', (code) => {
      if (code === 0) resolve()
      else reject(new Error(`Lighthouse exited with status ${code} for ${url}.`))
    })
  })
}

const verifyPrerender = async (target, pathname) => {
  const response = await fetch(new URL(pathname, config.baseUrl))
  if (!response.ok) throw new Error(`${pathname} returned HTTP ${response.status}.`)
  const html = await response.text()
  const marker =
    target.seed === 'order' ? 'data-prerender-pattern="order"' : `data-prerender-path="${target.path}"`
  if (!html.includes('data-prerendered="true"') || !html.includes(marker)) {
    throw new Error(`${pathname} did not return the expected prerendered document marker.`)
  }
}

const readMetric = (report, auditId) => report.audits[auditId]?.numericValue ?? 0
const readScore = (report, category) => Math.round((report.categories[category].score ?? 0) * 100)

try {
  await access(path.join(distDirectory, 'index.html'))
  await mkdir(outputDirectory, { recursive: true })
  await new Promise((resolve, reject) => {
    server.once('error', reject)
    server.listen(port, '127.0.0.1', resolve)
  })
  await waitForServer()

  for (const target of targets) {
    for (let run = 1; run <= runsPerTarget; run += 1) {
      const { profileDirectory, orderPath, chrome } = await seedProfile(target, run)
      const targetPath = orderPath ?? target.path
      const url = new URL(targetPath, config.baseUrl).toString()
      const reportName = `${target.name}-${run}`
      const outputPath = path.join(outputDirectory, reportName)

      try {
        await verifyPrerender(target, targetPath)
        console.log(`\nLighthouse ${reportName}: ${url}`)
        await runLighthouse(url, outputPath, chrome.port)
        const report = JSON.parse(await readFile(`${outputPath}.report.json`, 'utf8'))
        if (new URL(report.finalUrl).pathname !== targetPath) {
          throw new Error(
            `Lighthouse navigated to ${report.finalUrl} instead of the requested route ${targetPath}.`,
          )
        }
        reportData.push({
          target: target.name,
          run,
          path: targetPath,
          performance: readScore(report, 'performance'),
          accessibility: readScore(report, 'accessibility'),
          bestPractices: readScore(report, 'best-practices'),
          seo: readScore(report, 'seo'),
          fcp: readMetric(report, 'first-contentful-paint'),
          lcp: readMetric(report, 'largest-contentful-paint'),
          tbt: readMetric(report, 'total-blocking-time'),
          cls: readMetric(report, 'cumulative-layout-shift'),
          lighthouseVersion: report.lighthouseVersion,
          fetchTime: report.fetchTime,
          userAgent: report.environment.networkUserAgent,
          hostUserAgent: report.environment.hostUserAgent,
        })
      } finally {
        await chrome.kill()
        await removeProfile(profileDirectory)
      }
    }
  }

  const rows = targets.map((target) => {
    const reports = reportData.filter((result) => result.target === target.name)
    const medianOf = (key) => median(reports.map((report) => report[key]))
    return {
      name: target.name,
      path: target.path,
      performance: medianOf('performance'),
      accessibility: medianOf('accessibility'),
      bestPractices: medianOf('bestPractices'),
      seo: medianOf('seo'),
      fcp: medianOf('fcp'),
      lcp: medianOf('lcp'),
      tbt: medianOf('tbt'),
      cls: medianOf('cls'),
    }
  })

  const firstReport = reportData[0]
  const formatMs = (value) => `${Math.round(value)} ms`
  const formatScore = (value) => `${value}`
  const markdown = [
    '# Lighthouse — rotas pré-renderizadas',
    '',
    `Execução concluída em ${firstReport.fetchTime}. Cada rota foi medida ${runsPerTarget} vezes em perfis isolados; a tabela contém medianas. Relatórios HTML/JSON locais em \`${relativeOutputDirectory}/\`.`,
    '',
    `- Lighthouse: ${firstReport.lighthouseVersion}`,
    `- Navegador: ${firstReport.hostUserAgent}`,
    `- Perfil: Moto G Power (2022), 390 x 844, DPR 1`,
    '- Throttling: RTT 150 ms, 1.638,4 Kbps, CPU 4x',
    '- Build: produção com MSW habilitado; servidor local reproduz URLs limpas e rewrite de pedidos do Vercel.',
    '- Rotas privadas: sessão do fixture Nova; carrinho visitante com quatro itens; checkout com um item; pedido confirmado criado para cada execução.',
    '',
    '| Rota | Performance | Acessibilidade | Boas práticas | SEO | FCP | LCP | TBT | CLS |',
    '| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |',
    ...rows.map(
      (row) =>
        `| ${row.name} (\`${row.path}\`) | ${formatScore(row.performance)} | ${formatScore(row.accessibility)} | ${formatScore(row.bestPractices)} | ${formatScore(row.seo)} | ${formatMs(row.fcp)} | ${formatMs(row.lcp)} | ${formatMs(row.tbt)} | ${row.cls.toFixed(4)} |`,
    ),
    '',
    'Estas medições representam os estados de fixture descritos acima. São resultados locais simulados; diferenças em relação a fases anteriores não provam, isoladamente, ganho causado pela pré-renderização.',
    '',
  ].join('\n')

  await writeFile(path.join(outputDirectory, 'summary.json'), JSON.stringify(reportData, null, 2))
  await writeFile(path.join(outputDirectory, 'summary.md'), markdown)
  console.log(`\nSaved ${path.join(relativeOutputDirectory, 'summary.md')}`)
} finally {
  await closeServer()
}
