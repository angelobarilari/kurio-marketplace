import { expect, test } from '@playwright/test'

const useMockScenario = async (page: import('@playwright/test').Page, scenario: string) => {
  await page.goto('/')
  await page.evaluate((value) => localStorage.setItem('kurio:mock-scenario', value), scenario)
}

test('opens an NFT from the catalog and renders its details', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('link', { name: 'Emerald Ape #042', exact: true }).click()

  await expect(page).toHaveURL(/\/nfts\/emerald-ape-042$/)
  await expect(page.getByRole('heading', { level: 1, name: 'Emerald Ape #042' })).toBeVisible()
  await expect(page.getByText('ID do token: #042')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Mais desta coleção' })).toBeVisible()
})

test('supports direct access, edition selection, and quantity limits', async ({ page }) => {
  await page.goto('/nfts/emerald-ape-042')

  const edition = page.getByRole('radio', { name: '1/10' })
  await edition.click()
  await expect(edition).toHaveAttribute('aria-checked', 'true')

  const increase = page.getByRole('button', { name: 'Aumentar quantidade' })
  await increase.click()
  await expect(page.locator('output:visible')).toHaveText('2')

  const decrease = page.getByRole('button', { name: 'Diminuir quantidade' })
  await decrease.click()
  await expect(page.locator('output:visible')).toHaveText('1')
  await expect(decrease).toBeDisabled()
})

test('keeps the catalog price when the default edition shares a label with a generic edition', async ({
  page,
}) => {
  await page.goto('/nfts/violet-nomad-314')

  await expect(page.getByRole('radio', { name: '1/10' })).toHaveAttribute('aria-checked', 'true')
  await expect(page.getByText('1.39 ETH', { exact: true }).filter({ visible: true }).first()).toBeVisible()
})

test('does not mutate catalog pricing during the default realtime subscription', async ({ page }) => {
  await page.goto('/nfts/emerald-ape-042')

  await expect(page.getByText('1.19 ETH', { exact: true }).filter({ visible: true }).first()).toBeVisible()
  await expect(page.getByText('1.20 ETH', { exact: true })).toHaveCount(0)
})

test('shows an actionable not-found state for an unknown NFT', async ({ page }) => {
  await page.goto('/nfts/unknown-nft')

  await expect(page.getByRole('heading', { name: 'NFT não encontrado' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Voltar ao mercado' })).toBeVisible()
})

test('desktop gallery zoom and detail tabs use accessible primitives', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name.includes('mobile'))
  await page.goto('/nfts/emerald-ape-042')

  const zoomTrigger = page.getByRole('button', { name: 'Ampliar imagem' })
  await zoomTrigger.click()
  const dialog = page.getByRole('dialog', { name: 'Imagem ampliada do NFT' })
  await expect(dialog).toBeVisible()
  await expect(dialog.getByRole('img')).toHaveAttribute('alt', /Emerald Ape #042/)
  await dialog.getByRole('button', { name: 'Fechar' }).click()
  await expect(dialog).toBeHidden()
  await expect(zoomTrigger).toBeFocused()

  const reviewsTab = page.getByRole('tab', { name: /Avaliações de colecionadores/ })
  await reviewsTab.click()
  await expect(reviewsTab).toHaveAttribute('aria-selected', 'true')
  await expect(page.getByRole('tabpanel')).toContainText('somente leitura')

  const relatedCarousel = page.getByRole('region', { name: 'NFTs relacionados' })
  await expect(relatedCarousel).toBeVisible()
  await expect(relatedCarousel.locator('[aria-roledescription="slide"]')).toHaveCount(5)
  if (testInfo.project.name.includes('tablet')) {
    const previous = relatedCarousel.getByRole('button', { name: 'Item anterior' })
    const next = relatedCarousel.getByRole('button', { name: 'Próximo item' })
    await expect(next).toBeEnabled()
    await next.click()
    await expect(previous).toBeEnabled()
    await expect(next).toBeDisabled()
    await previous.click()
    await expect(next).toBeEnabled()
  }
})

test('mobile detail follows the compact layout without horizontal overflow', async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.includes('mobile'))
  await page.goto('/nfts/emerald-ape-042')

  await expect(page.locator('header')).toBeHidden()
  const back = page.getByRole('link', { name: 'Voltar ao mercado' })
  const favorite = page.getByRole('button', { name: /Adicionar Emerald Ape.*aos favoritos/ })
  await expect(back).toBeVisible()
  await expect(favorite).toBeVisible()
  const backBox = await back.boundingBox()
  expect(backBox).not.toBeNull()
  expect(backBox!.width).toBe(36)
  await expect(page.getByRole('button', { name: /Adicionar Emerald Ape.*aos favoritos/ })).toBeVisible()
  await expect(page.getByRole('list', { name: 'Miniaturas' })).toBeHidden()
  const purchaseBar = page.getByTestId('mobile-purchase-bar')
  await expect(purchaseBar).toBeVisible()
  await expect(purchaseBar.getByRole('button', { name: 'Comprar NFT' })).toBeVisible()
  await expect(purchaseBar.getByRole('link', { name: 'Abrir carrinho' })).toBeVisible()

  const purchaseBox = await purchaseBar.boundingBox()
  const viewportHeight = await page.evaluate(() => window.innerHeight)
  expect(purchaseBox).not.toBeNull()
  expect(Math.abs(purchaseBox!.y + purchaseBox!.height - viewportHeight)).toBeLessThanOrEqual(1)

  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    content: document.documentElement.scrollWidth,
  }))
  expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport)
})

test('shows an unavailable NFT without exposing an invalid quantity', async ({ page }) => {
  await useMockScenario(page, 'nft-unavailable')
  await page.goto('/nfts/emerald-ape-042')

  await expect(page.getByText('Este NFT está indisponível no momento.')).toBeVisible()
  await expect(page.locator('output:visible')).toHaveText('0')
  await expect(page.getByRole('button', { name: 'Indisponível' })).toBeDisabled()
  await expect(page.getByRole('radio', { name: /1\/50/ })).toBeDisabled()
})

test('shows a sold-out state when every edition has zero stock', async ({ page }) => {
  await useMockScenario(page, 'editions-sold-out')
  await page.goto('/nfts/emerald-ape-042')

  await expect(page.locator('p:visible').filter({ hasText: /A edição .* está esgotada/ })).toBeVisible()
  await expect(page.locator('output:visible')).toHaveText('0')
  await expect(page.getByRole('button', { name: 'Indisponível' })).toBeDisabled()
})

test('recovers from a deterministic transient detail error', async ({ page }) => {
  await useMockScenario(page, 'detail-error')
  await page.goto('/nfts/emerald-ape-042')
  await expect(page.getByRole('heading', { name: 'Não foi possível carregar o NFT' })).toBeVisible()

  await page.evaluate(() => localStorage.removeItem('kurio:mock-scenario'))
  await page.getByRole('button', { name: 'Tentar novamente' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Emerald Ape #042' })).toBeVisible()
})

test('gallery thumbnails and sharing actions have accessible names and real destinations', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name.includes('mobile'))
  await page.goto('/nfts/emerald-ape-042')

  await expect(page.getByRole('button', { name: /Selecionar imagem 1/ })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Compartilhar no LinkedIn' })).toHaveAttribute(
    'href',
    /linkedin\.com\/sharing/,
  )
  await expect(page.getByRole('link', { name: 'Compartilhar por e-mail' })).toHaveAttribute(
    'href',
    /^mailto:/,
  )
  await expect(page.getByRole('link', { name: 'Compartilhar no X' })).toHaveAttribute(
    'href',
    /x\.com\/intent/,
  )
})

test('tablet detail stacks gallery and purchase information', async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.includes('tablet'))
  await page.goto('/nfts/emerald-ape-042')

  const gallery = await page.getByRole('region', { name: 'Galeria do NFT' }).boundingBox()
  const heading = await page.getByRole('heading', { level: 1, name: 'Emerald Ape #042' }).boundingBox()
  expect(gallery).not.toBeNull()
  expect(heading).not.toBeNull()
  expect(heading!.y).toBeGreaterThan(gallery!.y + gallery!.height)
})

test('applies the current Socket.IO update and ignores the stale version on the open detail', async ({
  page,
}) => {
  await useMockScenario(page, 'cart-realtime-price')
  await page.goto('/nfts/emerald-ape-042')
  await expect(page.getByText('1.75 ETH').filter({ visible: true }).first()).toBeVisible({ timeout: 10_000 })
  await expect(page.getByText('9.99 ETH')).toHaveCount(0)
  await expect(page.getByText('Preço atualizado. Revise a cotação.')).toHaveCount(0)
})

test('respects reduced motion preferences', async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.includes('desktop'))
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/nfts/emerald-ape-042')

  const motion = await page.evaluate(() => {
    const styles = getComputedStyle(document.body)
    return {
      animationDuration: styles.animationDuration,
      transitionDuration: styles.transitionDuration,
      scrollBehavior: getComputedStyle(document.documentElement).scrollBehavior,
    }
  })

  expect(motion.scrollBehavior).toBe('auto')
  expect(Number.parseFloat(motion.animationDuration)).toBeLessThanOrEqual(0.001)
  expect(Number.parseFloat(motion.transitionDuration)).toBeLessThanOrEqual(0.001)
})

test('reflows at 320 CSS pixels without horizontal overflow', async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.includes('desktop'))
  await page.setViewportSize({ width: 320, height: 900 })
  await page.goto('/nfts/emerald-ape-042')

  await expect(page.getByRole('heading', { level: 1, name: 'Emerald Ape #042' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Comprar NFT' })).toBeVisible()
  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    content: document.documentElement.scrollWidth,
  }))
  expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport)
})
