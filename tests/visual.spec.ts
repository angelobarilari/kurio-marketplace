import { expect, test, type Page } from '@playwright/test'

const resetMocks = async (page: Page) => {
  await page.goto('/')
  await page.waitForFunction(() => Boolean(document.querySelector('#root')?.childElementCount))
  await page.getByTestId('nft-card').first().waitFor()
  await page.evaluate(async () => {
    localStorage.removeItem('kurio:mock-scenario')
    localStorage.removeItem('kurio:visitor-cart')
    let response: Response
    for (let attempt = 0; ; attempt += 1) {
      response = await fetch('/api/mock/reset', { method: 'POST' })
      if (response.status !== 404 || attempt === 4) break
      await new Promise((resolve) => setTimeout(resolve, 100))
    }
    if (!response.ok) throw new Error(`Mock reset failed with status ${response.status}.`)
  })
}

const waitForImages = async (page: Page) =>
  page.evaluate(async () => {
    const images = Array.from(document.images)
    images.forEach((image) => {
      image.loading = 'eager'
    })
    await Promise.all(images.map((image) => image.decode()))
  })

const visualCartItems = (page: Page) =>
  (page.viewportSize()?.width ?? 0) <= 760
    ? [
        { nftId: 'emerald-ape-042', quantity: 1 },
        { nftId: 'violet-nomad-314', quantity: 1 },
        { nftId: 'ivory-baron-088', quantity: 2 },
        { nftId: 'golden-beat-207', quantity: 2 },
      ]
    : [
        { nftId: 'emerald-ape-042', quantity: 2 },
        { nftId: 'violet-nomad-314', quantity: 2 },
        { nftId: 'ivory-baron-088', quantity: 2 },
      ]

const seedVisualCart = async (page: Page) => {
  await page.evaluate(async (items) => {
    let cartState = '[]'
    for (const item of items) {
      let response: Response
      let responseBody: string
      for (let attempt = 0; ; attempt += 1) {
        response = await fetch('/api/cart/items', {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'x-kurio-cart-state': cartState,
          },
          body: JSON.stringify({ ...item, editionId: 'default' }),
        })
        responseBody = await response.text()
        if (response.status !== 404 || responseBody.length > 0 || attempt === 4) break
        await new Promise((resolve) => setTimeout(resolve, 100))
      }
      if (!response.ok) {
        throw new Error(
          `Could not seed ${item.nftId} in visual cart: HTTP ${response.status}, ${responseBody}.`,
        )
      }
      let body: { items: unknown[] }
      try {
        body = JSON.parse(responseBody) as { items: unknown[] }
      } catch {
        throw new Error(
          `Could not seed ${item.nftId} in visual cart: expected JSON, received ${JSON.stringify(responseBody)}.`,
        )
      }
      cartState = JSON.stringify(body.items)
      localStorage.setItem('kurio:visitor-cart', cartState)
    }
  }, visualCartItems(page))
}

const prepareCheckout = async (page: Page) => {
  await page.goto('/')
  await seedVisualCart(page)
  await page.goto('/login?returnTo=%2Fcart')
  await page.getByRole('button', { name: 'Continuar com Google' }).click()
  await expect(page).toHaveURL(/\/cart$/)
  await page.getByRole('button', { name: 'Conectar e finalizar' }).filter({ visible: true }).click()
  await expect(page).toHaveURL(/\/checkout/)
  await page.getByLabel('Código de indicação').fill('TESTE10')
  await page.getByLabel('Código de indicação').evaluate((element) => {
    if (element instanceof HTMLInputElement) element.blur()
  })
  if ((page.viewportSize()?.width ?? 0) <= 760) {
    await page.getByRole('button', { name: 'Continuar para pagamento' }).click()
    await expect(page.getByRole('heading', { name: 'Carteira conectada' })).toBeVisible()
  }
}

test.beforeEach(async ({ page }) => resetMocks(page))

test.describe('versioned visual baselines', () => {
  test('home', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name.includes('tablet'))
    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'NFTs disponíveis' })).toBeAttached()
    await expect(page.getByTestId('nft-card')).toHaveCount(9)
    await expect(page.getByTestId('journal-card')).toHaveCount(4)
    await waitForImages(page)
    await expect(page).toHaveScreenshot('home.png', {
      animations: 'disabled',
      fullPage: true,
      caret: 'hide',
    })
  })

  test('NFT detail', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name.includes('tablet'))
    await page.goto('/nfts/emerald-ape-042')
    await expect(page.getByRole('heading', { level: 1, name: 'Emerald Ape #042' })).toBeVisible()
    await expect(page).toHaveScreenshot('nft-detail.png', {
      animations: 'disabled',
      fullPage: true,
      caret: 'hide',
    })
  })

  test('cart', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name.includes('tablet'))
    await page.goto('/')
    await seedVisualCart(page)
    await page.goto('/cart')
    await expect(page).toHaveURL(/\/cart$/)
    await expect(
      page.getByRole('region', { name: 'NFTs', exact: true }).getByRole('heading', {
        name: 'Emerald Ape #042',
      }),
    ).toBeVisible()
    await expect(
      page.getByRole('region', { name: 'NFTs', exact: true }).getByRole('heading', { level: 2 }),
    ).toHaveCount((page.viewportSize()?.width ?? 0) <= 760 ? 4 : 3)
    await expect(page.getByTestId('nft-card')).toHaveCount(9)
    await waitForImages(page)
    await expect(page).toHaveScreenshot('cart.png', {
      animations: 'disabled',
      fullPage: true,
      caret: 'hide',
    })
  })

  test('checkout and confirmed receipt', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name.includes('tablet'))
    await prepareCheckout(page)
    const checkoutHeading =
      (page.viewportSize()?.width ?? 0) <= 760 ? 'Pagamento com carteira' : 'Perfil do colecionador'
    await expect(page.getByRole('heading', { name: checkoutHeading })).toBeVisible()
    await waitForImages(page)
    await expect(page).toHaveScreenshot('checkout.png', {
      animations: 'disabled',
      fullPage: true,
      caret: 'hide',
    })

    await page.evaluate(() => localStorage.setItem('kurio:mock-scenario', 'socket-offline'))
    await page.getByRole('button', { name: 'Confirmar compra' }).click()
    await expect(page).toHaveURL(/\/orders\/order-/)
    await expect(page.getByRole('button', { name: 'Verificar status' })).toBeVisible()
    await page.waitForTimeout(700)
    await page.getByRole('button', { name: 'Verificar status' }).click()
    await expect(page.getByText('Pagamento confirmado', { exact: true })).toBeVisible()
    await expect(page).toHaveScreenshot('order-confirmation.png', {
      animations: 'disabled',
      fullPage: true,
      caret: 'hide',
      mask: [page.getByTestId('receipt-transaction-id'), page.getByTestId('receipt-date')],
      maskColor: '#777777',
    })
  })
})
