import assert from 'node:assert/strict'
import { addCartItemState, getCartQuoteState } from '@/mocks/state/cart-store'
import { connectWalletState } from '@/mocks/state/order-store'
import { getProfileState, getWalletsState, socialLoginState } from '@/mocks/state/account-store'
import type { CreateOrderInput } from '@/types/order'

export const prepareOrder = (): CreateOrderInput => {
  socialLoginState('google')
  const wallet = getWalletsState()?.[0]
  const profile = getProfileState()
  assert.ok(wallet && profile)
  assert.ok(profile.ensName)
  const added = addCartItemState({ nftId: 'emerald-ape-042', editionId: 'default', quantity: 1 })
  assert.ok(!('error' in added))
  const connection = connectWalletState({
    walletId: wallet.id,
    network: wallet.network,
    provider: wallet.provider,
  })
  assert.ok(connection)
  return {
    idempotencyKey: 'unit-checkout-attempt',
    connectionId: connection.id,
    quoteRevision: getCartQuoteState({ couponCode: null }),
    checkout: {
      displayName: profile.displayName,
      profileName: 'Collector',
      username: profile.username,
      email: profile.email,
      network: wallet.network,
      walletId: wallet.id,
      walletAddress: wallet.address,
      secondaryWalletAddress: null,
      walletType: wallet.provider,
      ensName: profile.ensName,
      referralCode: 'TESTE10',
      collectorNote: null,
    },
  }
}
