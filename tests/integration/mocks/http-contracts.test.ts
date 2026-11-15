import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { setupServer } from 'msw/node'
import { getWalletsState, socialLoginState } from '@/mocks/state/account-store'
import { authHttpHandlers } from '@/mocks/handlers/auth-http'
import { accountHttpHandlers } from '@/mocks/handlers/account-http'
import { cartHttpHandlers } from '@/mocks/handlers/cart-http'
import { favoritesHttpHandlers } from '@/mocks/handlers/favorites-http'
import { orderHttpHandlers } from '@/mocks/handlers/order-http'
import { prepareOrder } from '../../support/checkout'

const origin = 'http://localhost'
const network = setupServer(
  ...authHttpHandlers,
  ...accountHttpHandlers,
  ...favoritesHttpHandlers,
  ...cartHttpHandlers,
  ...orderHttpHandlers,
)

beforeAll(() => network.listen({ onUnhandledRequest: 'error' }))
beforeEach(() => vi.stubGlobal('location', new URL(`${origin}/`)))
afterEach(() => network.resetHandlers())
afterAll(() => {
  network.close()
  vi.unstubAllGlobals()
})

const requestJson = (route: string, method: string, payload: unknown, headers: Record<string, string> = {}) =>
  fetch(`${origin}${route}`, {
    method,
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify(payload),
  })

const get = (route: string, headers: Record<string, string> = {}) => fetch(`${origin}${route}`, { headers })

const walletInput = {
  displayName: 'Secondary wallet',
  alias: 'Secondary',
  network: 'Ethereum',
  address: `0x${'1'.repeat(40)}`,
  provider: 'MetaMask',
  ensName: null,
  priority: 'secondary',
}

describe('Auth HTTP contracts', () => {
  it('returns an unauthenticated session and the active session through GET /api/session', async () => {
    const unauthenticated = await get('/api/session')
    expect(unauthenticated.status).toBe(401)
    expect(await unauthenticated.json()).toMatchObject({ code: 'AUTH_REQUIRED' })

    const session = socialLoginState('google')
    const authenticated = await get('/api/session')
    expect(authenticated.status).toBe(200)
    expect(await authenticated.json()).toEqual(session)
  })

  it('returns field errors for invalid login requests', async () => {
    const response = await requestJson('/api/session/login', 'POST', { email: 'invalid', password: '' })
    expect(response.status).toBe(422)
    expect(await response.json()).toMatchObject({
      code: 'VALIDATION_ERROR',
      fieldErrors: { email: expect.any(String), password: expect.any(String) },
    })
  })

  it.each([
    ['short', 'short'],
    ['missing uppercase', 'strongpass123'],
    ['missing lowercase', 'STRONGPASS123'],
    ['missing number', 'StrongPassword'],
  ])('rejects registration passwords that violate the API policy (%s)', async (_label, password) => {
    const response = await requestJson('/api/session/register', 'POST', {
      username: 'new_collector',
      email: 'new@example.test',
      password,
      passwordConfirmation: password,
    })
    expect(response.status).toBe(422)
    expect(await response.json()).toMatchObject({
      code: 'VALIDATION_ERROR',
      fieldErrors: { password: expect.any(String) },
    })
  })

  it('maps duplicate registration email and username to distinct conflict contracts', async () => {
    const existing = socialLoginState('google').user
    const emailConflict = await requestJson('/api/session/register', 'POST', {
      username: 'another_collector',
      email: existing.email,
      password: 'StrongPass123',
      passwordConfirmation: 'StrongPass123',
    })
    expect(emailConflict.status).toBe(409)
    expect(await emailConflict.json()).toMatchObject({
      code: 'EMAIL_CONFLICT',
      fieldErrors: { email: expect.any(String) },
    })

    const usernameConflict = await requestJson('/api/session/register', 'POST', {
      username: existing.username,
      email: 'another@example.test',
      password: 'StrongPass123',
      passwordConfirmation: 'StrongPass123',
    })
    expect(usernameConflict.status).toBe(409)
    expect(await usernameConflict.json()).toMatchObject({
      code: 'USERNAME_CONFLICT',
      fieldErrors: { username: expect.any(String) },
    })
  })

  it('distinguishes an unavailable social provider from an unsupported provider', async () => {
    const unavailable = await requestJson(
      '/api/session/social/google',
      'POST',
      {},
      { 'x-kurio-mock-scenario': 'social-auth-error' },
    )
    expect(unavailable.status).toBe(503)
    expect(await unavailable.json()).toMatchObject({ code: 'SERVICE_UNAVAILABLE' })

    const unsupported = await requestJson('/api/session/social/unknown', 'POST', {})
    expect(unsupported.status).toBe(404)
    expect(await unsupported.json()).toMatchObject({ code: 'RESOURCE_NOT_FOUND' })
  })

  it('rejects malformed password-recovery requests without revealing account existence', async () => {
    const invalid = await requestJson('/api/session/recover-password', 'POST', { email: 'invalid' })
    expect(invalid.status).toBe(422)
    expect(await invalid.json()).toMatchObject({
      code: 'VALIDATION_ERROR',
      fieldErrors: { email: expect.any(String) },
    })

    const accepted = await requestJson('/api/session/recover-password', 'POST', {
      email: 'unknown@example.test',
    })
    expect(accepted.status).toBe(200)
    expect(await accepted.json()).toMatchObject({ accepted: true })
  })

  it('returns 204 on logout and clears the active session', async () => {
    socialLoginState('google')
    const response = await requestJson('/api/session/logout', 'POST', {})
    expect(response.status).toBe(204)
    expect(await (await get('/api/session')).json()).toMatchObject({ code: 'AUTH_REQUIRED' })
  })
})

describe('Account HTTP contracts', () => {
  it('protects profile and wallet reads when no session exists', async () => {
    for (const route of ['/api/profile', '/api/wallets']) {
      const response = await get(route)
      expect(response.status).toBe(401)
      expect(await response.json()).toMatchObject({ code: 'AUTH_REQUIRED' })
    }
  })

  it('returns field-level profile validation and identifier conflicts', async () => {
    socialLoginState('google')
    const invalid = await requestJson('/api/profile', 'PATCH', {
      displayName: ' ',
      username: 'new_user',
      email: 'invalid',
      ensName: null,
      walletAlias: 'Alias',
    })
    expect(invalid.status).toBe(422)
    expect(await invalid.json()).toMatchObject({
      code: 'VALIDATION_ERROR',
      fieldErrors: { displayName: expect.any(String), email: expect.any(String) },
    })

    const conflict = await requestJson('/api/profile', 'PATCH', {
      displayName: 'Updated profile',
      username: 'another_user',
      email: 'caio@kurio.example',
      ensName: null,
      walletAlias: 'Alias',
    })
    expect(conflict.status).toBe(409)
    expect(await conflict.json()).toMatchObject({
      code: 'EMAIL_CONFLICT',
      fieldErrors: { email: expect.any(String) },
    })
  })

  it('rejects unsupported and oversized avatar payloads at the HTTP boundary', async () => {
    socialLoginState('google')
    const unsupported = await requestJson('/api/profile/avatar', 'PUT', {
      avatarUrl: 'data:image/gif;base64,AAAA',
    })
    expect(unsupported.status).toBe(422)
    expect(await unsupported.json()).toMatchObject({
      code: 'VALIDATION_ERROR',
      fieldErrors: { avatarUrl: expect.any(String) },
    })

    const oversized = await requestJson('/api/profile/avatar', 'PUT', {
      avatarUrl: `data:image/png;base64,${'a'.repeat(1_500_001)}`,
    })
    expect(oversized.status).toBe(422)
    expect(await oversized.json()).toMatchObject({
      code: 'VALIDATION_ERROR',
      fieldErrors: { avatarUrl: expect.any(String) },
    })
  })

  it('returns the password error contract for an incorrect current password', async () => {
    socialLoginState('google')
    const response = await requestJson('/api/profile/password', 'PUT', {
      currentPassword: 'incorrect',
      newPassword: 'UpdatedPass123',
      passwordConfirmation: 'UpdatedPass123',
    })
    expect(response.status).toBe(422)
    expect(await response.json()).toMatchObject({
      code: 'CURRENT_PASSWORD_INVALID',
      fieldErrors: { currentPassword: expect.any(String) },
    })
  })

  it('maps duplicate and missing wallets to conflict and not-found responses', async () => {
    socialLoginState('google')
    const existing = getWalletsState()?.[0]
    if (!existing) throw new Error('Expected the deterministic account fixture to have a wallet.')

    const duplicate = await requestJson('/api/wallets', 'POST', {
      displayName: existing.displayName,
      alias: existing.alias,
      network: existing.network,
      address: existing.address,
      provider: existing.provider,
      ensName: existing.ensName,
      priority: 'secondary',
    })
    expect(duplicate.status).toBe(409)
    expect(await duplicate.json()).toMatchObject({
      code: 'WALLET_CONFLICT',
      fieldErrors: { address: expect.any(String) },
    })

    const missing = await requestJson('/api/wallets/missing-wallet', 'PUT', walletInput)
    expect(missing.status).toBe(404)
    expect(await missing.json()).toMatchObject({ code: 'RESOURCE_NOT_FOUND' })
  })
})

describe('Favorites HTTP contracts', () => {
  it('protects favorite reads and writes without a session', async () => {
    const read = await get('/api/favorites')
    expect(read.status).toBe(401)
    expect(await read.json()).toMatchObject({ code: 'AUTH_REQUIRED' })

    const write = await requestJson('/api/favorites/emerald-ape-042', 'PUT', {})
    expect(write.status).toBe(401)
    expect(await write.json()).toMatchObject({ code: 'AUTH_REQUIRED' })
  })

  it('distinguishes a missing NFT from a favorite service failure', async () => {
    socialLoginState('google')
    const missing = await requestJson('/api/favorites/missing-nft', 'PUT', {})
    expect(missing.status).toBe(404)
    expect(await missing.json()).toMatchObject({ code: 'RESOURCE_NOT_FOUND' })

    const unavailable = await requestJson(
      '/api/favorites/emerald-ape-042',
      'PUT',
      {},
      { 'x-kurio-mock-scenario': 'favorite-error' },
    )
    expect(unavailable.status).toBe(503)
    expect(await unavailable.json()).toMatchObject({ code: 'SERVICE_UNAVAILABLE' })
  })
})

describe('Cart HTTP contracts', () => {
  it('rejects malformed merges and requires authentication for a valid merge', async () => {
    const invalid = await requestJson('/api/cart/merge', 'POST', { idempotencyKey: '', items: [] })
    expect(invalid.status).toBe(400)
    expect(await invalid.json()).toMatchObject({ code: 'INVALID_CART_REQUEST' })

    const unauthenticated = await requestJson('/api/cart/merge', 'POST', {
      idempotencyKey: 'visitor-merge',
      items: [],
    })
    expect(unauthenticated.status).toBe(401)
    expect(await unauthenticated.json()).toMatchObject({ code: 'AUTH_REQUIRED' })
  })

  it('maps cart quantity limits and missing items to their HTTP statuses', async () => {
    const tooMany = await requestJson('/api/cart/items', 'POST', {
      nftId: 'emerald-ape-042',
      editionId: 'default',
      quantity: Number.MAX_SAFE_INTEGER,
    })
    expect(tooMany.status).toBe(409)
    expect(await tooMany.json()).toMatchObject({ code: 'QUANTITY_LIMIT', maxQuantity: expect.any(Number) })

    const updateMissing = await requestJson('/api/cart/items/missing-item', 'PATCH', { quantity: 1 })
    expect(updateMissing.status).toBe(404)
    expect(await updateMissing.json()).toMatchObject({ code: 'CART_ITEM_NOT_FOUND' })

    const removeMissing = await requestJson('/api/cart/items/missing-item', 'DELETE', {})
    expect(removeMissing.status).toBe(404)
    expect(await removeMissing.json()).toMatchObject({ code: 'CART_ITEM_NOT_FOUND' })
  })
})

describe('Order HTTP contracts', () => {
  it('protects wallet-connection reads and rejects invalid connection payloads', async () => {
    const unauthenticated = await get('/api/checkout/wallet-connection')
    expect(unauthenticated.status).toBe(401)
    expect(await unauthenticated.json()).toMatchObject({ code: 'AUTH_REQUIRED' })

    socialLoginState('google')
    const invalid = await requestJson('/api/checkout/wallet-connection', 'POST', {
      walletId: '',
      network: 'Bitcoin',
      provider: 'Unknown',
    })
    expect(invalid.status).toBe(422)
    expect(await invalid.json()).toMatchObject({
      code: 'VALIDATION_ERROR',
      fieldErrors: {
        walletId: expect.any(String),
        network: expect.any(String),
        provider: expect.any(String),
      },
    })
  })

  it('returns not-found for an unknown wallet connection and order', async () => {
    socialLoginState('google')
    const walletConnection = await requestJson('/api/checkout/wallet-connection/missing', 'DELETE', {})
    expect(walletConnection.status).toBe(404)
    expect(await walletConnection.json()).toMatchObject({ code: 'WALLET_CONNECTION_NOT_FOUND' })

    const order = await get('/api/orders/missing-order')
    expect(order.status).toBe(404)
    expect(await order.json()).toMatchObject({ code: 'ORDER_NOT_FOUND' })

    const attempt = await get('/api/orders/by-idempotency/missing-attempt')
    expect(attempt.status).toBe(404)
    expect(await attempt.json()).toMatchObject({ code: 'ORDER_NOT_FOUND' })
  })

  it('rejects a mismatched idempotency header before creating an order', async () => {
    const input = prepareOrder()
    const response = await requestJson('/api/orders', 'POST', input, {
      'idempotency-key': 'different-key',
    })
    expect(response.status).toBe(400)
    expect(await response.json()).toMatchObject({ code: 'INVALID_IDEMPOTENCY_KEY' })
  })

  it('rejects unsupported terminal transitions at the HTTP boundary', async () => {
    socialLoginState('google')
    const response = await requestJson('/api/mock/orders/order-1/transition', 'POST', { status: 'pending' })
    expect(response.status).toBe(400)
    expect(await response.json()).toMatchObject({ code: 'INVALID_ORDER_TRANSITION' })
  })
})
