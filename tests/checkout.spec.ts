import { expect, test, type Page } from '@playwright/test'
import type { CreateOrderInput } from '@/types/order'

const resetMocks = async (page: Page) => {
  await page.goto('/')
  await page.evaluate(() => {
    localStorage.removeItem('kurio:mock-scenario')
    localStorage.removeItem('kurio:visitor-cart')
  })
  await page.request.post('/api/mock/reset')
}

const prepareCheckout = async (page: Page) => {
  await page.goto('/nfts/emerald-ape-042')
  await page.getByRole('button', { name: 'Comprar NFT' }).click()
  await expect(page).toHaveURL(/\/cart$/)

  await page.goto('/login?returnTo=%2Fcart')
  await page.getByRole('button', { name: 'Continuar com Google' }).click()
  await expect(page).toHaveURL(/\/cart$/)
  await page.getByRole('button', { name: 'Conectar e finalizar' }).filter({ visible: true }).click()
  await expect(page).toHaveURL(/\/checkout/)
  const isMobile = (page.viewportSize()?.width ?? 0) <= 760
  await expect(
    page.getByRole('heading', { name: isMobile ? 'Dados do colecionador' : 'Perfil do colecionador' }),
  ).toBeVisible()
  if (isMobile) {
    await expect(page.locator('#collector-title')).toHaveClass(/sr-only/)
  }
  await expect(page.getByRole('button', { name: 'Conectar carteira' })).toHaveCount(0)
  if (!isMobile) {
    await expect(page.getByRole('button', { name: 'Voltar ao carrinho' })).toHaveCount(0)
  }
  for (const text of [
    'Finalizar compra',
    'Estes dados serão salvos no recibo desta compra.',
    'Campos marcados com * são obrigatórios.',
    'Valores sujeitos à validação final antes da criação do pedido.',
    'Escolha o provedor para conectar a carteira selecionada.',
    'Conecte a carteira escolhida para habilitar a confirmação.',
  ]) {
    await expect(page.getByText(text, { exact: false })).toHaveCount(0)
  }
  await page.getByLabel('Código de indicação').fill('TESTE10')
  if (isMobile) await page.getByRole('button', { name: 'Continuar para pagamento' }).click()
}

test.beforeEach(async ({ page }) => resetMocks(page))

test('checkout CTA selects desktop modal or dedicated mobile authentication', async ({ page }, testInfo) => {
  await page.goto('/nfts/emerald-ape-042')
  await page.getByRole('button', { name: 'Comprar NFT' }).click()
  await expect(page).toHaveURL(/\/cart$/)
  await page.getByRole('button', { name: 'Conectar e finalizar' }).filter({ visible: true }).click()

  if (testInfo.project.name.includes('mobile')) {
    await expect(page).toHaveURL(/\/login\?returnTo=%2Fcheckout/)
    await page.getByRole('button', { name: 'Continuar com Google' }).click()
  } else {
    await expect(page).toHaveURL(/\/cart$/)
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await dialog.getByRole('button', { name: 'Continuar com Google' }).click()
  }

  await expect(page).toHaveURL(/\/checkout/)
})

test('protects checkout and order routes while preserving their return context', async ({ page }) => {
  await page.goto('/checkout?couponCode=KURIO10')
  await expect(page).toHaveURL(/\/login/)
  const checkoutSearch = new URL(page.url()).searchParams
  expect(checkoutSearch.get('returnTo')).toBe('/checkout')
  expect(checkoutSearch.get('couponCode')).toBe('KURIO10')

  await page.goto('/orders/order-protected')
  await expect(page).toHaveURL(/\/login/)
  expect(new URL(page.url()).searchParams.get('returnTo')).toBe('/orders/order-protected')
})

test('returns to checkout from mobile wallet registration with its search context', async ({
  page,
}, testInfo) => {
  test.skip(!testInfo.project.name.includes('mobile'))
  await prepareCheckout(page)
  await page.goto('/profile/wallets?returnTo=%2Fcheckout&network=Ethereum&couponCode=KURIO10')

  await page.getByRole('link', { name: 'Voltar ao checkout' }).click()
  await expect(page).toHaveURL(/\/checkout/)
  const search = new URL(page.url()).searchParams
  expect(search.get('network')).toBe('Ethereum')
  expect(search.get('couponCode')).toBe('KURIO10')
})

test('completes checkout and presents the immutable confirmed receipt', async ({ page }, testInfo) => {
  await prepareCheckout(page)
  await page.getByRole('button', { name: 'Confirmar compra' }).click()

  await expect(page).toHaveURL(/\/orders\/order-/)
  await expect(page.getByText('Pagamento confirmado', { exact: true })).toBeVisible({
    timeout: 10_000,
  })
  await expect(page.getByRole('heading', { name: 'Seus NFTs agora estão na sua carteira' })).toBeVisible()
  await expect(page.getByText('Emerald Ape #042')).toBeVisible()
  const envelope = page.getByTestId('receipt-envelope')
  const envelopeLabel = page.getByTestId('receipt-envelope-label')
  const envelopeBox = await envelope.boundingBox()
  const envelopeLabelBox = await envelopeLabel.boundingBox()
  expect(envelopeBox).not.toBeNull()
  expect(envelopeLabelBox).not.toBeNull()
  const labelCenterY = envelopeLabelBox!.y + envelopeLabelBox!.height / 2
  expect(labelCenterY).toBeGreaterThan(envelopeBox!.y + envelopeBox!.height * 0.4)
  expect(labelCenterY).toBeLessThan(envelopeBox!.y + envelopeBox!.height * 0.7)
  const editionsHeading = page.getByText('Edições', { exact: true })
  if (testInfo.project.name.includes('mobile')) {
    await expect(editionsHeading).toBeHidden()
  } else {
    await expect(editionsHeading).toBeVisible()
  }
  await expect(page.getByText('Total', { exact: true }).last()).toBeVisible()
  await expect(page.getByRole('link', { name: 'Ver no Etherscan' })).toHaveAttribute(
    'href',
    /explorer\.kurio\.example/,
  )

  const receiptTotal = await page.getByText('1.206 ETH', { exact: true }).count()
  expect(receiptTotal).toBeGreaterThan(0)
  const cart = await page.evaluate(async () => {
    const response = await fetch('/api/cart')
    return response.json() as Promise<{ itemCount: number }>
  })
  expect(cart.itemCount).toBe(0)
  await page.evaluate(() => localStorage.setItem('kurio:mock-scenario', 'cart-realtime-price'))
  await page.reload()
  await expect(page.getByText('Pagamento confirmado', { exact: true })).toBeVisible()
  await expect(page.getByText('1.206 ETH', { exact: true }).last()).toBeVisible()
  await expect(page.getByText('1.19 ETH', { exact: true }).first()).toBeVisible()
})

test('allows selecting a saved wallet from another network', async ({ page }) => {
  await prepareCheckout(page)
  if ((page.viewportSize()?.width ?? 0) <= 760) {
    await page.getByRole('button', { name: 'Trocar carteira' }).click()
  }
  await page.getByRole('combobox', { name: 'Rede' }).click()
  await page.getByRole('option', { name: 'Polygon' }).click()

  await page.getByRole('combobox', { name: 'Tipo de carteira' }).click()
  await page.getByRole('option', { name: 'Principal · Ethereum' }).click()

  await expect(page.getByRole('combobox', { name: 'Rede' })).toContainText('Ethereum')
  await expect(page.locator('#checkout-wallet-address')).toHaveValue(
    '0xA91F00000000000000000000000000000000E82C',
  )
})

test('prefills checkout ENS from the selected wallet when the profile has no ENS', async ({ page }) => {
  await prepareCheckout(page)
  await page.goto('/profile')
  await page.getByLabel('Nome ENS').fill('')
  await page.getByRole('button', { name: 'Salvar perfil' }).click()
  const profileForm = page
    .locator('form')
    .filter({ has: page.getByRole('button', { name: 'Salvar perfil' }) })
  await expect(profileForm.getByRole('status')).toContainText('Dados do perfil salvos.')

  await page.goto('/checkout')
  await page.getByRole('combobox', { name: 'Rede' }).click()
  await page.getByRole('option', { name: 'Polygon' }).click()
  await expect(page.locator('#checkout-ensName')).toHaveValue('nova.kurio.eth')
})

test('requires a new review after the backend changes the checkout quote', async ({ page }) => {
  await prepareCheckout(page)
  await page.evaluate(() => localStorage.setItem('kurio:mock-scenario', 'checkout-price-changed'))
  await page.getByRole('button', { name: 'Confirmar compra' }).click()

  await expect(page.getByText('A cotação mudou. Confira os novos valores antes de continuar.')).toBeVisible()
  const confirm = page.getByRole('button', { name: 'Confirmar compra' })
  await expect(confirm).toBeDisabled()
  await page.getByRole('button', { name: 'Revisar e aceitar esta cotação' }).click()
  await expect(confirm).toBeEnabled()
  await confirm.click()
  await expect(page).toHaveURL(/\/orders\/order-/)
  await expect(page.getByText('Pagamento confirmado', { exact: true })).toBeVisible({
    timeout: 10_000,
  })
})

test('blocks checkout when the selected NFT edition sells out before confirmation', async ({ page }) => {
  await prepareCheckout(page)
  await page.evaluate(() => localStorage.setItem('kurio:mock-scenario', 'checkout-edition-sold-out'))

  const orderResponse = page.waitForResponse(
    (response) => response.request().method() === 'POST' && response.url().endsWith('/api/orders'),
  )
  await page.getByRole('button', { name: 'Confirmar compra' }).click()
  const response = await orderResponse
  expect(response.status()).toBe(409)
  const body = (await response.json()) as { code: string }
  expect(['QUOTE_STALE', 'CART_CONFLICT', 'EDITION_UNAVAILABLE']).toContain(body.code)
  const expectedMessage =
    body.code === 'QUOTE_STALE'
      ? 'A cotação mudou.'
      : body.code === 'EDITION_UNAVAILABLE'
        ? 'A disponibilidade mudou.'
        : 'Há itens indisponíveis ou uma alteração que exige revisão.'
  await expect(page.getByRole('alert').filter({ hasText: expectedMessage })).toBeVisible()
  await expect(page).toHaveURL(/\/checkout/)

  const storedOrders = await page.evaluate(() => {
    const state = JSON.parse(localStorage.getItem('kurio:mock-orders:v1') ?? '{}') as {
      orders?: Record<string, Array<{ id: string }>>
    }
    return Object.values(state.orders ?? {}).flat().length
  })
  expect(storedOrders).toBe(0)
})

test('recovers a timed-out creation by idempotency key and rejects changed payload reuse', async ({
  page,
}) => {
  await prepareCheckout(page)
  await page.evaluate(() => localStorage.setItem('kurio:mock-scenario', 'order-timeout-after-create'))
  const orderRequestPromise = page.waitForRequest(
    (request) => request.method() === 'POST' && request.url().endsWith('/api/orders'),
  )
  await page.getByRole('button', { name: 'Confirmar compra' }).click()
  const orderRequest = await orderRequestPromise
  const requestBody = orderRequest.postDataJSON() as CreateOrderInput

  await expect(page).toHaveURL(/\/orders\/order-/)
  await expect(page.getByText('Pagamento confirmado', { exact: true })).toBeVisible({
    timeout: 10_000,
  })

  const replay = await page.evaluate(async (input) => {
    localStorage.removeItem('kurio:mock-scenario')
    const response = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Idempotency-Key': input.idempotencyKey },
      body: JSON.stringify(input),
    })
    return { status: response.status, body: await response.json() }
  }, requestBody)
  expect(replay.status).toBe(200)
  expect(replay.body.id).toMatch(/^order-/)
  expect(replay.body.status).toBe('confirmed')

  const changedPayload = {
    ...requestBody,
    checkout: { ...requestBody.checkout, collectorNote: 'Payload diferente' },
  }
  const conflict = await page.evaluate(async (input) => {
    const response = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Idempotency-Key': input.idempotencyKey },
      body: JSON.stringify(input),
    })
    return { status: response.status, body: await response.json() }
  }, changedPayload)
  expect(conflict.status).toBe(409)
  expect(conflict.body.code).toBe('IDEMPOTENCY_CONFLICT')

  const persistedOrders = await page.evaluate(() => {
    const state = JSON.parse(localStorage.getItem('kurio:mock-orders:v1') ?? '{}') as {
      orders?: Record<string, Array<{ id: string }>>
    }
    return Object.values(state.orders ?? {}).flat().length
  })
  expect(persistedOrders).toBe(1)
})

test('creates a single order when confirmation receives repeated clicks', async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.includes('desktop'))
  await prepareCheckout(page)

  let creationRequests = 0
  page.on('request', (request) => {
    if (request.method() === 'POST' && request.url().endsWith('/api/orders')) creationRequests += 1
  })

  await page.getByRole('button', { name: 'Confirmar compra' }).evaluate((button) => {
    button.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    button.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  })

  await expect(page).toHaveURL(/\/orders\/order-/)
  await expect(page.getByText('Pagamento confirmado', { exact: true })).toBeVisible({ timeout: 10_000 })

  const persistedOrders = await page.evaluate(() => {
    const state = JSON.parse(localStorage.getItem('kurio:mock-orders:v1') ?? '{}') as {
      orders?: Record<string, Array<{ id: string }>>
    }
    return Object.values(state.orders ?? {}).flat().length
  })
  expect(creationRequests).toBeGreaterThan(0)
  expect(persistedOrders).toBe(1)
})

test('distinguishes a timeout before creation and retries without losing the cart', async ({
  page,
}, testInfo) => {
  test.skip(!testInfo.project.name.includes('desktop'))
  await prepareCheckout(page)
  await page.evaluate(() => localStorage.setItem('kurio:mock-scenario', 'order-timeout-before-create'))
  await page.getByRole('button', { name: 'Confirmar compra' }).click()
  await expect(page.getByRole('alert')).toContainText('A tentativa pode ser recuperada')
  await expect(page.getByRole('heading', { name: 'Perfil do colecionador' })).toBeVisible()

  const beforeRetry = await page.evaluate(() => {
    const state = JSON.parse(localStorage.getItem('kurio:mock-orders:v1') ?? '{}') as {
      orders?: Record<string, Array<{ id: string }>>
    }
    return Object.values(state.orders ?? {}).flat().length
  })
  expect(beforeRetry).toBe(0)

  await page.evaluate(() => localStorage.removeItem('kurio:mock-scenario'))
  await page.getByRole('button', { name: 'Confirmar compra' }).click()
  await expect(page).toHaveURL(/\/orders\/order-/)
  await expect(page.getByText('Pagamento confirmado', { exact: true })).toBeVisible({
    timeout: 10_000,
  })
})

test('recovers a pending order after refresh and ignores duplicated or older updates', async ({
  page,
}, testInfo) => {
  test.skip(!testInfo.project.name.includes('desktop'))
  await prepareCheckout(page)
  await page.evaluate(() => localStorage.setItem('kurio:mock-scenario', 'order-pending'))
  await page.getByRole('button', { name: 'Confirmar compra' }).click()
  await expect(page).toHaveURL(/\/orders\/order-/)
  await expect(page.getByRole('heading', { name: 'Aguardando confirmação' })).toBeVisible()

  const orderId = new URL(page.url()).pathname.split('/').pop()
  expect(orderId).toBeTruthy()
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Aguardando confirmação' })).toBeVisible()
  await page.evaluate(async (id) => {
    localStorage.setItem('kurio:mock-scenario', 'order-duplicate-events')
    const response = await fetch(`/api/mock/orders/${id}/transition`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'confirmed' }),
    })
    if (!response.ok) throw new Error(`Order transition failed with ${response.status}.`)
  }, orderId)
  await expect(page.getByText('Pagamento confirmado', { exact: true })).toBeVisible()
  await page.reload()
  await expect(page.getByText('Pagamento confirmado', { exact: true })).toBeVisible()
})

test('reconciles a pending order after the browser reconnects', async ({ page, context }, testInfo) => {
  test.skip(!testInfo.project.name.includes('desktop'))
  await prepareCheckout(page)
  await page.evaluate(() => localStorage.setItem('kurio:mock-scenario', 'order-pending'))
  await page.getByRole('button', { name: 'Confirmar compra' }).click()
  await expect(page).toHaveURL(/\/orders\/order-/)
  await expect(page.getByRole('heading', { name: /Aguardando confirma/ })).toBeVisible()

  const orderId = new URL(page.url()).pathname.split('/').pop()
  expect(orderId).toBeTruthy()
  await context.setOffline(true)
  await page.waitForTimeout(500)
  await context.setOffline(false)
  await page.evaluate(async (id) => {
    localStorage.removeItem('kurio:mock-scenario')
    const response = await fetch(`/api/mock/orders/${id}/transition`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'confirmed' }),
    })
    if (!response.ok) throw new Error(`Order transition failed with ${response.status}.`)
  }, orderId)

  await expect(page.getByText('Pagamento confirmado', { exact: true })).toBeVisible({ timeout: 10_000 })
})

test('removes only the quantity captured by a confirmed order', async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.includes('desktop'))
  await prepareCheckout(page)
  await page.evaluate(() => localStorage.setItem('kurio:mock-scenario', 'order-pending'))
  await page.getByRole('button', { name: 'Confirmar compra' }).click()
  await expect(page).toHaveURL(/\/orders\/order-/)
  await expect(page.getByRole('heading', { name: /Aguardando confirma/ })).toBeVisible()

  const orderId = new URL(page.url()).pathname.split('/').pop()
  expect(orderId).toBeTruthy()
  const updatedCart = await page.evaluate(async () => {
    const cartResponse = await fetch('/api/cart')
    const cart = (await cartResponse.json()) as { items: Array<{ id: string }> }
    const item = cart.items[0]
    if (!item) throw new Error('Expected an item in the authenticated cart.')
    const response = await fetch(`/api/cart/items/${encodeURIComponent(item.id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quantity: 2 }),
    })
    if (!response.ok) throw new Error(`Cart update failed with ${response.status}.`)
    return response.json() as Promise<{ items: Array<{ id: string; quantity: number }> }>
  })
  expect(updatedCart.items[0]?.quantity).toBe(2)

  await page.evaluate(async (id) => {
    localStorage.removeItem('kurio:mock-scenario')
    const response = await fetch(`/api/mock/orders/${id}/transition`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'confirmed' }),
    })
    if (!response.ok) throw new Error(`Order transition failed with ${response.status}.`)
  }, orderId)
  await expect(page.getByText('Pagamento confirmado', { exact: true })).toBeVisible({ timeout: 10_000 })

  const remainingCart = await page.evaluate(async () => {
    const response = await fetch('/api/cart')
    return response.json() as Promise<{ itemCount: number; items: Array<{ quantity: number }> }>
  })
  expect(remainingCart.itemCount).toBe(1)
  expect(remainingCart.items[0]?.quantity).toBe(1)
})

test('quotes and purchases every item in a multi-network cart', async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.includes('desktop'))
  await page.goto('/nfts/emerald-ape-042')
  await page.getByRole('button', { name: 'Comprar NFT' }).click()
  await expect(page).toHaveURL(/\/cart$/)

  const polygonNft = await page.evaluate(async () => {
    const response = await fetch('/api/nfts?network=Polygon')
    const result = (await response.json()) as {
      items: Array<{ id: string; name: string; tokenId: string }>
    }
    return result.items[0]
  })
  expect(polygonNft).toBeTruthy()
  if (!polygonNft) throw new Error('No Polygon NFT fixture is available.')
  await page.goto(`/nfts/${polygonNft.id}`)
  await page.getByRole('button', { name: 'Comprar NFT' }).click()
  await expect(page).toHaveURL(/\/cart$/)

  await page.goto('/login?returnTo=%2Fcart')
  await page.getByRole('button', { name: 'Continuar com Google' }).click()
  await expect(page).toHaveURL(/\/cart$/)
  await page.getByRole('button', { name: 'Conectar e finalizar' }).filter({ visible: true }).click()
  await expect(page).toHaveURL(/\/checkout/)
  await expect(page.getByRole('heading', { name: 'Perfil do colecionador' })).toBeVisible()
  await page.getByRole('combobox', { name: 'Rede' }).click()
  await page.getByRole('option', { name: 'Ethereum' }).click()
  await expect(page.getByRole('heading', { name: 'Emerald Ape #042' })).toBeVisible()
  await expect(page.getByRole('heading', { name: `${polygonNft.name} ${polygonNft.tokenId}` })).toBeVisible()
  await expect(page.getByText('Rede Polygon · será finalizado separadamente')).toHaveCount(0)
  const quote = await page.evaluate(async () => {
    const response = await fetch('/api/cart/quote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    return (await response.json()) as { network: string; subtotalEth: string; totalEth: string }
  })
  expect(quote.network).toBe('all')
  await expect(page.getByText(`${quote.subtotalEth} ETH`, { exact: true }).first()).toBeVisible()
  await expect(page.getByText(`${quote.totalEth} ETH`, { exact: true }).last()).toBeVisible()
  await page.getByLabel('Código de indicação').fill('TESTE10')
  await page.getByRole('button', { name: 'Confirmar compra' }).click()
  await expect(page).toHaveURL(/\/orders\/order-/)
  await expect(page.getByText('Pagamento confirmado', { exact: true })).toBeVisible({
    timeout: 10_000,
  })
  await expect(page.getByText(`${polygonNft.name} ${polygonNft.tokenId}`, { exact: true })).toBeVisible()

  const remainingCart = await page.evaluate(async () => {
    const response = await fetch('/api/cart')
    return response.json() as Promise<{
      itemCount: number
      items: Array<{ id: string }>
    }>
  })
  expect(remainingCart.itemCount).toBe(0)
  expect(remainingCart.items).toHaveLength(0)
})

test('preserves checkout context and requires wallet reconnection after session expiry', async ({
  page,
}, testInfo) => {
  test.skip(!testInfo.project.name.includes('desktop'))
  await prepareCheckout(page)
  await page.evaluate(() => localStorage.setItem('kurio:mock-scenario', 'session-expired-during-checkout'))
  await page.getByRole('button', { name: 'Confirmar compra' }).click()
  await expect(page).toHaveURL(/\/login\?returnTo=%2Fcheckout/)

  await page.evaluate(() => localStorage.removeItem('kurio:mock-scenario'))
  await page.getByRole('button', { name: 'Continuar com Google' }).click()
  await expect(page).toHaveURL(/\/checkout/)
  await expect(page.getByRole('heading', { name: 'Perfil do colecionador' })).toBeVisible()
  await page.getByLabel('Código de indicação').fill('TESTE10')
  await expect(page.getByRole('button', { name: 'Confirmar compra' })).toBeEnabled()
  await page.getByRole('button', { name: 'Confirmar compra' }).click()
  await expect(page).toHaveURL(/\/orders\/order-/)
  await expect(page.getByText('Pagamento confirmado', { exact: true })).toBeVisible({
    timeout: 10_000,
  })
})

test('allows recovery when the checkout coupon expires', async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.includes('desktop'))
  await page.goto('/nfts/emerald-ape-042')
  await page.getByRole('button', { name: 'Comprar NFT' }).click()
  await expect(page).toHaveURL(/\/cart$/)
  await page.getByLabel('Código promocional').filter({ visible: true }).fill('KURIO10')
  await page.getByRole('button', { name: 'Aplicar' }).filter({ visible: true }).click()
  await expect(
    page.getByRole('button', { name: /Remover cupom KURIO10/ }).filter({ visible: true }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Conectar e finalizar' }).filter({ visible: true }).click()
  await expect(page).toHaveURL(/\/cart/)
  const authDialog = page.getByRole('dialog')
  await expect(authDialog).toBeVisible()
  await authDialog.getByRole('button', { name: 'Continuar com Google' }).click()
  await expect(page).toHaveURL(/\/checkout/)
  await page.getByLabel('Código de indicação').fill('TESTE10')
  await expect(page.getByRole('button', { name: 'Remover cupom KURIO10' })).toBeVisible()
  await page.evaluate(() => localStorage.setItem('kurio:mock-scenario', 'checkout-coupon-expired'))
  await page.getByRole('button', { name: 'Confirmar compra' }).click()
  await expect(page.getByRole('alert')).toContainText('Este cupom expirou.')

  await page.getByRole('button', { name: 'Remover cupom KURIO10' }).click()
  await expect(page.getByText('1.206 ETH', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Confirmar compra' }).click()
  await expect(page).toHaveURL(/\/orders\/order-/)
  await expect(page.getByText('Pagamento confirmado', { exact: true })).toBeVisible({
    timeout: 10_000,
  })
})

test('invalid checkout coupon keeps the quote and does not offer a retry', async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.includes('desktop'))
  await prepareCheckout(page)
  const coupon = page.getByLabel('Código promocional')
  await coupon.fill('INVALIDO')
  await page.getByRole('button', { name: 'Aplicar' }).click()

  await expect(page.getByRole('alert')).toHaveText('Cupom inválido.')
  await expect(page.getByText('1.206 ETH', { exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Tentar novamente' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Remover cupom INVALIDO' })).toHaveCount(0)
})

test('shows an inherited cart coupon as removable on mobile checkout', async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.includes('mobile'))
  await page.goto('/nfts/emerald-ape-042')
  await page.getByRole('button', { name: 'Comprar NFT' }).click()
  await expect(page).toHaveURL(/\/cart$/)

  await page.getByPlaceholder('Digite o cupom').filter({ visible: true }).fill('KURIO10')
  await page.getByRole('button', { name: 'Aplicar' }).filter({ visible: true }).click()
  await expect(page.getByRole('button', { name: 'Remover cupom KURIO10' })).toBeVisible()
  await page.getByRole('button', { name: 'Conectar e finalizar' }).filter({ visible: true }).click()
  await expect(page).toHaveURL(/\/login\?returnTo=%2Fcheckout/)

  await page.getByRole('button', { name: 'Continuar com Google' }).click()
  await expect(page).toHaveURL(/\/checkout/)
  await expect(page.getByText('Desconto aplicado')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Remover cupom KURIO10' })).toBeVisible()
})

test('recovers from a rejected wallet connection and keeps the cart after payment decline', async ({
  page,
}) => {
  const isMobile = (page.viewportSize()?.width ?? 0) <= 760
  if (isMobile) {
    await page.evaluate(() => localStorage.setItem('kurio:mock-scenario', 'wallet-connect-rejected'))
  }
  await prepareCheckout(page)
  if (isMobile) {
    await expect(page.getByRole('alert')).toContainText('A conexão da carteira foi recusada.')
    await page.evaluate(() => localStorage.setItem('kurio:mock-scenario', 'payment-declined'))
    await page.getByRole('button', { name: 'Continuar para pagamento' }).click()
  } else {
    await page.evaluate(() => localStorage.setItem('kurio:mock-scenario', 'wallet-connect-rejected'))
    await page.getByRole('button', { name: 'Confirmar compra' }).click()
    await expect(page.getByRole('alert')).toContainText('A conexão da carteira foi recusada.')
    await page.evaluate(() => localStorage.setItem('kurio:mock-scenario', 'payment-declined'))
  }
  await page.getByRole('button', { name: 'Confirmar compra' }).click()
  await expect(page).toHaveURL(/\/orders\/order-/)
  await expect(page.getByRole('heading', { name: 'Não foi possível concluir o pagamento' })).toBeVisible({
    timeout: 10_000,
  })
  await page.getByRole('button', { name: 'Tentar novamente' }).click()
  const checkoutHeading =
    (page.viewportSize()?.width ?? 0) <= 760 ? 'Dados do colecionador' : 'Perfil do colecionador'
  await expect(page.getByRole('heading', { name: checkoutHeading })).toBeVisible()
  if ((page.viewportSize()?.width ?? 0) <= 760) {
    await page.getByLabel('Código de indicação').fill('TESTE10')
    await page.getByRole('button', { name: 'Continuar para pagamento' }).click()
    await expect(page.getByText('1.206 ETH', { exact: true })).toBeVisible()
  } else {
    await expect(page.getByText('Emerald Ape #042')).toBeVisible()
  }
})
