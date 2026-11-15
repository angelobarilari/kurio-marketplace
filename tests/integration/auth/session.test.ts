import assert from 'node:assert/strict'
import { describe, it } from 'vitest'
import {
  connectWalletState,
  createOrderState,
  disconnectWalletState,
  getOrderByAttemptState,
  getOrderState,
  getWalletConnectionState,
} from '@/mocks/state/order-store'
import {
  addFavoriteState,
  getFavoriteNftIdsState,
  getProfileState,
  getSessionState,
  loginState,
  logoutState,
  registerState,
  socialLoginState,
} from '@/mocks/state/account-store'
import { getCartState } from '@/mocks/state/cart-store'
import { prepareOrder } from '../../support/checkout'

describe('Session and ownership', () => {
  it('keeps profile and favorites isolated when switching accounts', () => {
    socialLoginState('google')
    assert.deepEqual(addFavoriteState('golden-beat-207'), ['emerald-ape-042', 'golden-beat-207'])
    logoutState()
    socialLoginState('facebook')
    assert.equal(getProfileState()?.userId, 'user-caio')
    assert.deepEqual(getFavoriteNftIdsState(), ['golden-beat-207'])
    logoutState()
    socialLoginState('google')
    assert.deepEqual(getFavoriteNftIdsState(), ['emerald-ape-042', 'golden-beat-207'])
  })

  it('normalizes registration credentials and rejects duplicate email or username', async () => {
    const registration = {
      email: ' New@Example.com ',
      username: ' NewCollector ',
      password: 'StrongPass123!',
      passwordConfirmation: 'StrongPass123!',
    }
    const result = await registerState(registration)
    assert.ok('user' in result)
    assert.equal(result.user.email, 'new@example.com')
    assert.equal(result.user.username, 'newcollector')
    assert.deepEqual(
      await registerState({ ...registration, email: 'new@example.com', username: 'another' }),
      { conflict: 'email' },
    )
    assert.deepEqual(
      await registerState({ ...registration, email: 'another@example.com', username: 'newcollector' }),
      { conflict: 'username' },
    )
    logoutState()
    assert.ok(await loginState({ email: ' NEW@example.com ', password: registration.password }))
    assert.equal(await loginState({ email: 'new@example.com', password: 'incorrect' }), null)
  })

  it('hides another account order, attempt and wallet connection', () => {
    const input = prepareOrder()
    const result = createOrderState(input)
    assert.ok('order' in result)
    const { order } = result
    logoutState()
    socialLoginState('facebook')
    assert.equal(getOrderState(order.id), null)
    assert.equal(getOrderByAttemptState(input.idempotencyKey), null)
    assert.equal(getWalletConnectionState(), null)
  })
  it('binds wallet connections to the current session and refuses stale disconnects', () => {
    const input = prepareOrder()
    assert.ok(getWalletConnectionState())

    socialLoginState('google')
    assert.equal(getWalletConnectionState(), null)

    const connection = connectWalletState({
      walletId: input.checkout.walletId,
      network: input.checkout.network,
      provider: input.checkout.walletType,
    })
    assert.ok(connection)
    assert.equal(disconnectWalletState('stale-connection'), false)
    assert.equal(getWalletConnectionState()?.id, connection.id)
    assert.equal(disconnectWalletState(connection.id), true)
    assert.equal(getWalletConnectionState(), null)
  })
  it('expires the session and denies private resources', () => {
    const input = prepareOrder()
    const result = createOrderState(input)
    assert.ok('order' in result)
    const { order } = result
    const now = Date.now
    const expiredTime = Date.parse(getSessionState()!.expiresAt) + 1
    try {
      Date.now = () => expiredTime
      assert.equal(getSessionState(), null)
      assert.equal(getProfileState(), null)
      assert.equal(getOrderState(order.id), null)
      assert.equal(getCartState().itemCount, 0)
      assert.deepEqual(createOrderState(input), { unauthorized: true })
    } finally {
      Date.now = now
    }
    socialLoginState('google')
    assert.equal(getCartState().itemCount, 1)
  })
})
