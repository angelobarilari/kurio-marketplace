import { expect, test } from '@playwright/test'

const resetMocks = async (page: import('@playwright/test').Page) => {
  await page.goto('/')
  await page.evaluate(() => localStorage.removeItem('kurio:mock-scenario'))
  await page.evaluate(() => localStorage.removeItem('kurio:visitor-cart'))
  await page.request.post('/api/mock/reset')
}

const addEmeraldApe = async (page: import('@playwright/test').Page) => {
  await page.goto('/nfts/emerald-ape-042')
  await page.getByRole('button', { name: 'Comprar NFT' }).click()
  await expect(page).toHaveURL(/\/cart$/)
}

test.beforeEach(async ({ page }) => resetMocks(page))

test('adds an NFT from detail and derives the header count from the remote cart', async ({ page }) => {
  await addEmeraldApe(page)
  await expect(
    page.getByRole('region', { name: 'NFTs', exact: true }).getByRole('heading', {
      name: 'Emerald Ape #042',
    }),
  ).toBeVisible()
  if (!test.info().project.name.includes('mobile')) {
    await expect(page.getByRole('link', { name: 'Carrinho, 1 item' })).toBeVisible()
  }
  await expect(
    page
      .getByText(/1\.19 ETH/)
      .filter({ visible: true })
      .first(),
  ).toBeVisible()
})

test('merges an existing NFT and respects the edition limit', async ({ page }) => {
  await addEmeraldApe(page)
  await page.goto('/nfts/emerald-ape-042')
  await page.getByRole('button', { name: 'Comprar NFT' }).click()
  const items = page.getByRole('region', { name: 'NFTs' })
  await expect(items.getByRole('heading', { name: 'Emerald Ape #042' })).toHaveCount(1)
  const output = items.getByRole('status').filter({ visible: true })
  await expect(output).toHaveText('2')
  const increase = page.getByRole('button', { name: 'Aumentar quantidade de Emerald Ape' })
  await increase.click()
  await increase.click()
  await increase.click()
  await expect(output).toHaveText('5')
  await expect(increase).toBeDisabled()
})

test('detail limits a new addition to the remaining per-order quantity', async ({ page }) => {
  const edition = () => page.getByRole('radio', { name: '1/10' })
  await page.goto('/nfts/emerald-ape-042')
  await edition().click()
  await page.getByRole('button', { name: 'Comprar NFT' }).click()
  await expect(page).toHaveURL(/\/cart$/)

  await page.goto('/nfts/emerald-ape-042')
  await edition().click()
  await expect(page.locator('output:visible')).toHaveText('1')
  await expect(
    page.getByRole('button', { name: 'Aumentar quantidade' }).filter({ visible: true }),
  ).toBeDisabled()
  await page.getByRole('button', { name: 'Comprar NFT' }).click()
  await expect(page).toHaveURL(/\/cart$/)
  await expect(
    page.getByRole('region', { name: 'NFTs', exact: true }).locator('output:visible').first(),
  ).toHaveText('2')

  await page.goto('/nfts/emerald-ape-042')
  await edition().click()
  await expect(
    page
      .getByText('Você já atingiu o limite desta edição no carrinho.', { exact: true })
      .filter({ visible: true }),
  ).toBeVisible()
  await expect(page.getByRole('button', { name: 'Limite atingido' })).toBeDisabled()
})

test('merges the visitor cart once after login and keeps user carts isolated', async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.includes('desktop'))
  await page.evaluate(() => localStorage.setItem('kurio:visitor-id', 'visitor-merge-test'))

  await page.goto('/')
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await page.getByRole('button', { name: 'Continuar com Google' }).click()
  await expect(page.getByRole('button', { name: 'Minha conta' })).toBeVisible()

  const polygonNftId = await page.evaluate(async () => {
    const response = await fetch('/api/nfts?network=Polygon')
    const result = (await response.json()) as { items: Array<{ id: string }> }
    return result.items[0]?.id
  })
  expect(polygonNftId).toBeTruthy()
  await page.goto(`/nfts/${polygonNftId}`)
  await page.getByRole('button', { name: 'Comprar NFT' }).click()
  await expect(page).toHaveURL(/\/cart$/)
  await expect(page.getByRole('link', { name: 'Carrinho, 1 item' })).toBeVisible()

  await page.getByRole('button', { name: 'Minha conta' }).click()
  await page.getByRole('button', { name: 'Sair' }).click()
  await expect(page.getByRole('button', { name: 'Entrar', exact: true })).toBeVisible()

  await addEmeraldApe(page)
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  const mergeRequestPromise = page.waitForRequest(
    (request) => request.method() === 'POST' && request.url().endsWith('/api/cart/merge'),
  )
  await page.getByRole('button', { name: 'Continuar com Google' }).click()
  const mergeRequest = await mergeRequestPromise
  const mergeInput = mergeRequest.postDataJSON() as {
    idempotencyKey: string
    items: Array<{ id: string; nftId: string; editionId: string; quantity: number }>
  }
  await expect(page.getByRole('heading', { name: 'Emerald Ape #042' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Carrinho, 2 itens' })).toBeVisible()
  await expect.poll(() => page.evaluate(() => localStorage.getItem('kurio:visitor-cart'))).toBeNull()
  await page.goto('/cart')
  await expect(
    page.getByRole('region', { name: 'NFTs', exact: true }).getByRole('heading', {
      name: 'Emerald Ape #042',
    }),
  ).toBeVisible()
  const mergedCart = await page.evaluate(async () => {
    const response = await fetch('/api/cart')
    return response.json() as Promise<{ itemCount: number; items: Array<{ nft: { network: string } }> }>
  })
  expect(mergedCart.itemCount).toBe(2)
  expect(mergedCart.items.map((item) => item.nft.network).sort()).toEqual(['Ethereum', 'Polygon'])

  const replay = await page.evaluate(async (input) => {
    const response = await fetch('/api/cart/merge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
    return response.json() as Promise<{ alreadyMerged: boolean; cart: { itemCount: number } }>
  }, mergeInput)
  expect(replay.alreadyMerged).toBe(true)
  expect(replay.cart.itemCount).toBe(2)

  await page.getByRole('button', { name: 'Minha conta' }).click()
  await page.getByRole('button', { name: 'Sair' }).click()
  await expect(page.getByRole('button', { name: 'Entrar', exact: true })).toBeVisible()
  await page.goto('/cart')
  await expect(page.getByRole('heading', { name: 'Seu carrinho está vazio' })).toBeVisible()

  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await page.getByRole('button', { name: 'Continuar com Facebook' }).click()
  await page.goto('/cart')
  await expect(page.getByRole('heading', { name: 'Seu carrinho está vazio' })).toBeVisible()
})

test('revalidates quantity against stock and order limits during authenticated merge', async ({
  page,
}, testInfo) => {
  test.skip(!testInfo.project.name.includes('desktop'))
  await page.goto('/')
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await page.getByRole('button', { name: 'Continuar com Google' }).click()
  await expect(page.getByRole('button', { name: 'Minha conta' })).toBeVisible()

  const result = await page.evaluate(async () => {
    const response = await fetch('/api/cart/merge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        idempotencyKey: 'visitor-limit-test',
        items: [
          {
            id: 'emerald-ape-042:default',
            nftId: 'emerald-ape-042',
            editionId: 'default',
            quantity: 8,
          },
        ],
      }),
    })
    return response.json() as Promise<{
      cart: { items: Array<{ quantity: number }> }
      conflicts: Array<{
        itemId: string
        requestedQuantity: number
        acceptedQuantity: number
        reason: string
      }>
    }>
  })

  expect(result.cart.items[0]?.quantity).toBe(5)
  expect(result.conflicts).toEqual([
    {
      itemId: 'emerald-ape-042:default',
      requestedQuantity: 8,
      acceptedQuantity: 5,
      reason: 'quantity-adjusted',
    },
  ])
})

test('updates quantity optimistically, persists after refresh, and removes the item', async ({ page }) => {
  await addEmeraldApe(page)
  await page.getByRole('button', { name: 'Aumentar quantidade de Emerald Ape' }).click()
  await expect(page.getByText('Quantidade de Emerald Ape atualizada.', { exact: true })).toBeAttached()
  if (!test.info().project.name.includes('mobile')) {
    await expect(page.getByRole('link', { name: 'Carrinho, 2 itens' })).toBeVisible()
  }
  await page.reload()
  if (!test.info().project.name.includes('mobile')) {
    await expect(page.getByRole('link', { name: 'Carrinho, 2 itens' })).toBeVisible()
  }
  await expect(page.getByText('2').filter({ visible: true }).first()).toBeVisible()
  await page.getByRole('button', { name: 'Remover Emerald Ape do carrinho' }).click()
  await expect(page.getByRole('heading', { name: 'Seu carrinho está vazio' })).toBeVisible()
})

test('desktop cart rows use the compact Figma dimensions', async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.includes('desktop'))
  await addEmeraldApe(page)

  const row = page.getByRole('region', { name: 'NFTs', exact: true }).getByRole('article')
  const image = row.getByRole('img')
  await expect(row).toBeVisible()
  await expect(image).toBeVisible()
  const rowBox = await row.boundingBox()
  const imageBox = await image.boundingBox()
  expect(rowBox).not.toBeNull()
  expect(imageBox).not.toBeNull()
  expect(rowBox!.height).toBe(70)
  expect(imageBox!.width).toBe(70)
  await expect(row).toHaveCSS('padding-left', '0px')
  await expect(row).toHaveCSS('padding-right', '24px')
})

test('applies and removes a valid coupon and reports invalid and expired coupons', async ({ page }) => {
  await addEmeraldApe(page)
  const coupon = page.getByLabel('Código promocional').filter({ visible: true })
  await coupon.fill('KURIO10')
  await page.getByRole('button', { name: 'Aplicar' }).filter({ visible: true }).click()
  await expect(
    page.getByRole('button', { name: /Remover cupom KURIO10/ }).filter({ visible: true }),
  ).toBeVisible()
  await expect(page.getByText(/\(-\) 0\.119 ETH/).filter({ visible: true })).toBeVisible()
  await page
    .getByRole('button', { name: /Remover cupom/ })
    .filter({ visible: true })
    .click()

  await coupon.fill('INVALIDO')
  await page.getByRole('button', { name: 'Aplicar' }).filter({ visible: true }).click()
  await expect(page.getByRole('alert').filter({ visible: true })).toContainText('Cupom inválido')
  await expect(page.getByText('1.206 ETH', { exact: true }).filter({ visible: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Tentar novamente' }).filter({ visible: true })).toHaveCount(
    0,
  )
  await expect(
    page.getByRole('button', { name: 'Remover cupom INVALIDO' }).filter({ visible: true }),
  ).toHaveCount(0)
  await coupon.fill('EXPIRADO')
  await page.getByRole('button', { name: 'Aplicar' }).filter({ visible: true }).click()
  await expect(page.getByRole('alert').filter({ visible: true })).toContainText('expirou')
})

test('rolls back an optimistic quantity change when the mutation fails', async ({ page }) => {
  await addEmeraldApe(page)
  await page.evaluate(() => localStorage.setItem('kurio:mock-scenario', 'cart-mutation-error'))
  await page.getByRole('button', { name: 'Aumentar quantidade de Emerald Ape' }).click()
  await expect(page.getByRole('alert')).toContainText('Não foi possível alterar')
  await expect(page.getByText('1').filter({ visible: true }).first()).toBeVisible()
})

test('supports direct access, empty state, and retry after a cart failure', async ({ page }) => {
  await page.goto('/cart')
  await expect(page.getByRole('heading', { name: 'Seu carrinho está vazio' })).toBeVisible()
  await page.evaluate(() => localStorage.setItem('kurio:mock-scenario', 'cart-error'))
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Não foi possível carregar o carrinho' })).toBeVisible()
  await page.evaluate(() => localStorage.removeItem('kurio:mock-scenario'))
  await page.getByRole('button', { name: 'Tentar novamente' }).click()
  await expect(page.getByRole('heading', { name: 'Seu carrinho está vazio' })).toBeVisible()
})

test('shows the cart skeleton and recovers from an unavailable connection', async ({ page }) => {
  await page.evaluate(() => localStorage.setItem('kurio:mock-scenario', 'cart-slow'))
  const slowNavigation = page.goto('/cart')
  await expect(page.getByRole('main', { name: 'Carregando carrinho' })).toBeVisible()
  await slowNavigation
  await expect(page.getByRole('heading', { name: 'Seu carrinho está vazio' })).toBeVisible()

  await page.evaluate(() => localStorage.setItem('kurio:mock-scenario', 'cart-offline'))
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Não foi possível carregar o carrinho' })).toBeVisible()
  await page.evaluate(() => localStorage.removeItem('kurio:mock-scenario'))
  await page.getByRole('button', { name: 'Tentar novamente' }).click()
  await expect(page.getByRole('heading', { name: 'Seu carrinho está vazio' })).toBeVisible()
})

test('provides a deterministic delayed response for stale-response handling', async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.includes('desktop'))
  await page.evaluate(() => localStorage.setItem('kurio:mock-scenario', 'cart-out-of-order'))
  const startedAt = Date.now()
  await page.goto('/cart')
  await expect(page.getByRole('heading', { name: 'Seu carrinho está vazio' })).toBeVisible()
  expect(Date.now() - startedAt).toBeGreaterThanOrEqual(900)
})

test('realtime price changes invalidate the quote and block advancement', async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.includes('desktop'))
  await page.evaluate(() => localStorage.setItem('kurio:mock-scenario', 'socket-offline'))
  await addEmeraldApe(page)
  await page.evaluate(() => localStorage.setItem('kurio:mock-scenario', 'cart-realtime-price'))
  await page.reload()
  await expect(page.getByText('Preço atualizado. Revise a cotação.')).toBeVisible()
  await expect(page.getByRole('button', { name: /Conectar e finalizar|Atualizando cotação/ })).toBeDisabled()
})

test('realtime availability changes mark a sold-out cart item', async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.includes('desktop'))
  await page.evaluate(() => localStorage.setItem('kurio:mock-scenario', 'socket-offline'))
  await addEmeraldApe(page)
  await page.evaluate(() => localStorage.setItem('kurio:mock-scenario', 'cart-realtime-sold-out'))
  await page.reload()
  await expect(page.getByText('Item indisponível.')).toBeVisible()
  await expect(page.getByRole('button', { name: /Conectar e finalizar|Atualizando cotação/ })).toBeDisabled()
})

test('recommendations reuse an accessible carousel', async ({ page }) => {
  await addEmeraldApe(page)
  const recommendations = page.getByRole('region', { name: 'NFTs recomendados' })
  await expect(recommendations).toBeVisible()
  const previous = recommendations.getByRole('button', { name: 'Item anterior' })
  const next = recommendations.getByRole('button', { name: 'Próximo item' })
  await expect(previous).toBeVisible()
  await expect(next).toBeVisible()
  const recommendationsBox = await recommendations.boundingBox()
  const controlsBox = await next.boundingBox()
  expect(recommendationsBox).not.toBeNull()
  expect(controlsBox).not.toBeNull()
  expect(
    recommendationsBox!.y + recommendationsBox!.height - (controlsBox!.y + controlsBox!.height),
  ).toBeGreaterThanOrEqual(24)
  await next.click()
  await expect(previous).toBeEnabled()
})

test('cart reflows without horizontal overflow and exposes keyboard focus', async ({ page }) => {
  await addEmeraldApe(page)
  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    content: document.documentElement.scrollWidth,
  }))
  expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport)

  const increaseQuantity = page
    .getByRole('button', { name: 'Aumentar quantidade de Emerald Ape' })
    .filter({ visible: true })
  await increaseQuantity.focus()
  await page.keyboard.press('Tab')
  await expect(
    page.getByRole('button', { name: 'Remover Emerald Ape do carrinho' }).filter({ visible: true }),
  ).toBeFocused()
})

test('tablet cart keeps the remove action aligned in the NFT row', async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.includes('tablet'))
  await page.goto('/nfts/golden-frequency-071')
  await page.getByRole('button', { name: 'Comprar NFT' }).click()
  await expect(page).toHaveURL(/\/cart$/)

  const row = page
    .getByRole('region', { name: 'NFTs', exact: true })
    .locator('article')
    .filter({ hasText: 'Golden Frequency #071' })
  const geometry = await row.evaluate((element) => {
    const rowBox = element.getBoundingClientRect()
    const removeButton = Array.from(element.querySelectorAll('button')).find(
      (button) =>
        button.getAttribute('aria-label') === 'Remover Golden Frequency do carrinho' &&
        button.getBoundingClientRect().width > 0,
    )
    const removeBox = removeButton?.getBoundingClientRect()
    return {
      rowHeight: rowBox.height,
      rowCenter: rowBox.y + rowBox.height / 2,
      removeCenter: removeBox ? removeBox.y + removeBox.height / 2 : null,
    }
  })

  expect(geometry.removeCenter).not.toBeNull()
  expect(geometry.rowHeight).toBeLessThan(100)
  expect(Math.abs(geometry.removeCenter! - geometry.rowCenter)).toBeLessThan(1)
})

test('mobile cart uses compact cards without horizontal overflow', async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.includes('mobile'))
  await addEmeraldApe(page)
  await expect(page.getByRole('heading', { name: 'Carrinho de NFTs' })).toBeVisible()
  const summary = page.getByTestId('mobile-cart-summary')
  await expect(summary).toBeVisible()
  const couponControl = summary.getByTestId('mobile-coupon-control')
  const coupon = summary.getByPlaceholder('Digite o cupom')
  const apply = summary.getByRole('button', { name: 'Aplicar' })
  await expect(coupon).toBeVisible()
  const couponBox = await coupon.boundingBox()
  const applyBox = await apply.boundingBox()
  const summaryBox = await summary.boundingBox()
  const viewportHeight = await page.evaluate(() => window.innerHeight)
  expect(couponBox).not.toBeNull()
  expect(applyBox).not.toBeNull()
  expect(summaryBox).not.toBeNull()
  expect(couponBox!.width).toBeGreaterThan(140)
  expect(Math.abs(couponBox!.x + couponBox!.width - applyBox!.x)).toBeLessThanOrEqual(1)
  expect(Math.abs(summaryBox!.y + summaryBox!.height - viewportHeight)).toBeLessThanOrEqual(1)
  const couponShadow = await couponControl.evaluate((element) => getComputedStyle(element).boxShadow)
  expect(couponShadow).toContain('rgba(0, 0, 0, 0.6)')
  expect(couponShadow).toContain('rgba(232, 155, 85')
  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    content: document.documentElement.scrollWidth,
  }))
  expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport)
})
