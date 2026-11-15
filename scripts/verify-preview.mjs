import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import path from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
import { fileURLToPath } from 'node:url'
import { readFile, readdir } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { chromium, expect } from '@playwright/test'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const remoteURL = process.argv.find((argument) => argument.startsWith('--url='))?.slice(6)
const expectedSource = process.argv.find((argument) => argument.startsWith('--source-sha='))?.slice(13)
const baseURL = (remoteURL ?? 'http://127.0.0.1:4176').replace(/\/$/, '')
const preview = remoteURL
  ? null
  : spawn(
      process.execPath,
      [
        path.join(root, 'node_modules/vite/bin/vite.js'),
        'preview',
        '--host',
        '127.0.0.1',
        '--port',
        '4176',
        '--strictPort',
      ],
      { cwd: root, stdio: 'inherit' },
    )
let browser

try {
  const deadline = Date.now() + 30_000
  while (preview) {
    if (preview.exitCode !== null) throw new Error(`Preview exited with status ${preview.exitCode}.`)
    try {
      if ((await fetch(baseURL)).ok) break
    } catch {
      // Vite may still be binding its local port.
    }
    if (Date.now() >= deadline) throw new Error('Production preview did not become ready.')
    await delay(200)
  }

  browser = await chromium.launch()
  for (const width of [1440, 390]) {
    const context = await browser.newContext({ viewport: { width, height: 900 } })
    const page = await context.newPage()
    const errors = []
    page.on('pageerror', (error) => errors.push(error.message))

    await page.goto(baseURL)
    await expect(page.getByTestId('nft-card')).toHaveCount(9)
    await page.getByTestId('nft-card').first().getByRole('link').first().click()
    await expect(page.getByRole('heading', { level: 1, name: 'Emerald Ape #042' })).toBeVisible()
    await page.reload()
    await expect(page.getByRole('heading', { level: 1, name: 'Emerald Ape #042' })).toBeVisible()
    await page.goto(`${baseURL}/?network=Polygon`)
    await expect(page.getByTestId('nft-card').first()).toBeVisible()
    await page.reload()
    await expect(page).toHaveURL(/network=Polygon/)
    await expect(page.getByTestId('nft-card').first()).toBeVisible()
    await page.goto(`${baseURL}/cart`)
    await expect(page.getByRole('heading', { name: 'Seu carrinho está vazio' })).toBeVisible()
    await page.goto(`${baseURL}/profile`)
    await expect(page).toHaveURL(/\/login/)
    await page.goto(`${baseURL}/nfts/unknown-nft`)
    await expect(page.getByRole('heading', { name: 'NFT não encontrado' })).toBeVisible()

    let releaseBootstrap
    let requestedBootstrap
    const bootstrapGate = new Promise((resolve) => {
      releaseBootstrap = resolve
    })
    const bootstrapRequested = new Promise((resolve) => {
      requestedBootstrap = resolve
    })
    await page.route(/\/assets\/index-[^/]+\.js$/, async (route) => {
      requestedBootstrap()
      await bootstrapGate
      await route.continue()
    })
    try {
      await page.goto(`${baseURL}/login`, { waitUntil: 'domcontentloaded' })
      await Promise.race([
        bootstrapRequested,
        delay(10_000).then(() => {
          throw new Error('Production entry module was not requested.')
        }),
      ])
      await expect(page.locator('#root')).toHaveAttribute('inert', '')
      const login = page.getByRole('button', { name: 'Continuar com Google', includeHidden: true }).click()
      releaseBootstrap()
      await login
      await expect(page).toHaveURL(`${baseURL}/`)
      await expect(page.locator('#root')).not.toHaveAttribute('inert', '')
    } finally {
      releaseBootstrap()
    }
    await page.goto(`${baseURL}/nfts/emerald-ape-042`)
    await page.getByRole('button', { name: 'Comprar NFT' }).click()
    await expect(page).toHaveURL(/\/cart$/)
    await page.getByRole('button', { name: 'Conectar e finalizar' }).filter({ visible: true }).click()
    await expect(page).toHaveURL(/\/checkout/)
    await page.getByLabel('Código de indicação').fill('TESTE10')
    if (width <= 760) await page.getByRole('button', { name: 'Continuar para pagamento' }).click()
    const creation = page.waitForResponse(
      (response) =>
        new URL(response.url()).pathname === '/api/orders' && response.request().method() === 'POST',
    )
    await page.getByRole('button', { name: 'Confirmar compra' }).click()
    assert.equal((await creation).fromServiceWorker(), true, 'Purchase must be answered by MSW.')
    await expect(page.getByText('Pagamento confirmado', { exact: true })).toBeVisible({ timeout: 10_000 })
    await expect(page.getByText('1.206 ETH', { exact: true }).last()).toBeVisible()
    const orderURL = page.url()
    await page.reload()
    await expect(page).toHaveURL(orderURL)
    await expect(page.getByText('Pagamento confirmado', { exact: true })).toBeVisible()
    const remaining = await page.evaluate(async () => (await (await fetch('/api/cart')).json()).itemCount)
    assert.equal(remaining, 0)
    assert.deepEqual(errors, [], `Browser errors at width ${width}`)
    await context.close()
  }

  const html = await (await fetch(`${baseURL}/checkout`)).text()
  const serialized = html.match(
    /<script id="kurio-query-state" type="application\/json">([\s\S]*?)<\/script>/,
  )
  assert.ok(serialized, 'Private page must contain its prerendered state marker.')
  assert.equal(JSON.parse(serialized[1]).queries.length, 0)
  const robots = await fetch(`${baseURL}/robots.txt`)
  assert.equal(robots.status, 200)
  assert.match(await robots.text(), /^User-agent: \*/)
  const favicon = await fetch(`${baseURL}/favicon.svg`)
  assert.equal(favicon.status, 200)
  assert.match(favicon.headers.get('content-type'), /image\/svg\+xml/)
  if (expectedSource) {
    const proof = await (await fetch(`${baseURL}/build-info.json?source=${expectedSource}`)).json()
    assert.equal(
      proof.sourceSha256,
      expectedSource,
      'Published source fingerprint differs from the frozen inputs.',
    )
    const assets = (await readdir(path.join(root, 'dist/assets'))).filter((name) =>
      /\.(js|css|woff2|webp)$/.test(name),
    )
    for (let offset = 0; offset < assets.length; offset += 6) {
      await Promise.all(
        assets.slice(offset, offset + 6).map(async (name) => {
          const response = await fetch(`${baseURL}/assets/${name}`)
          assert.equal(response.status, 200, `Missing deployed asset ${name}`)
          const expected = await readFile(path.join(root, 'dist/assets', name))
          const actual = Buffer.from(await response.arrayBuffer())
          assert.equal(
            createHash('sha256').update(actual).digest('hex'),
            createHash('sha256').update(expected).digest('hex'),
            `Different deployed asset ${name}`,
          )
        }),
      )
    }
    console.log(
      `Verified source SHA256 ${expectedSource} and ${assets.length} deployed assets byte-for-byte.`,
    )
  }
  console.log(
    'Production validation passed: desktop/mobile flows, delayed-bootstrap login, MSW purchase, receipt refresh, private cache, robots.txt and favicon.',
  )
} finally {
  await browser?.close()
  if (preview && preview.exitCode === null && preview.signalCode === null) {
    preview.kill()
    await new Promise((resolve) => preview.once('exit', resolve))
  }
}
