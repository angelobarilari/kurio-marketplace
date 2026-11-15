import { describe, expect, it } from 'vitest'
import { checkoutSchema } from '@/features/checkout/schemas'

const checkout = {
  displayName: 'Collector',
  profileName: 'Main profile',
  username: 'collector_1',
  email: 'collector@example.com',
  ensName: 'collector.kurio.eth',
  referralCode: 'TESTE10',
  secondaryWalletAddress: '',
  collectorNote: '',
  network: 'Ethereum' as const,
  walletId: 'wallet-1',
  walletType: 'MetaMask' as const,
}

describe('Checkout form schema', () => {
  it('trims collector text fields before validation and returns normalized values', () => {
    const result = checkoutSchema.safeParse({
      ...checkout,
      displayName: ' Collector ',
      profileName: ' Main profile ',
      username: ' collector_1 ',
      email: ' collector@example.com ',
      ensName: ' collector.kurio.eth ',
      referralCode: ' TESTE10 ',
    })

    expect(result).toMatchObject({
      success: true,
      data: {
        displayName: 'Collector',
        profileName: 'Main profile',
        username: 'collector_1',
        email: 'collector@example.com',
        ensName: 'collector.kurio.eth',
        referralCode: 'TESTE10',
      },
    })
  })

  it('accepts optional secondary address and the collector note maximum', () => {
    const result = checkoutSchema.safeParse({
      ...checkout,
      secondaryWalletAddress: '',
      collectorNote: 'x'.repeat(500),
    })

    expect(result.success).toBe(true)
  })

  it('accepts supported secondary wallet formats independently of the selected network', () => {
    for (const address of [`0x${'a'.repeat(40)}`, '1'.repeat(32), 'collector.eth']) {
      expect(checkoutSchema.safeParse({ ...checkout, secondaryWalletAddress: address }).success).toBe(true)
    }
  })

  it.each([
    { displayName: 'A' },
    { profileName: 'A' },
    { username: 'ab' },
    { username: 'a'.repeat(25) },
    { email: 'invalid' },
    { ensName: 'invalid-ens' },
    { referralCode: 'has space' },
    { referralCode: 'a'.repeat(33) },
    { secondaryWalletAddress: 'invalid-address' },
    { collectorNote: 'x'.repeat(501) },
    { walletId: '' },
  ])('rejects invalid checkout field values: %j', (overrides) => {
    expect(checkoutSchema.safeParse({ ...checkout, ...overrides }).success).toBe(false)
  })

  it('enforces the shortest valid username, referral code, and ENS boundaries', () => {
    expect(
      checkoutSchema.safeParse({
        ...checkout,
        username: 'abc',
        referralCode: 'A',
        ensName: 'x.eth',
      }).success,
    ).toBe(true)
  })

  it('accepts the maximum username and referral lengths and supported enum values', () => {
    for (const network of ['Ethereum', 'Polygon', 'Solana'] as const) {
      expect(
        checkoutSchema.safeParse({
          ...checkout,
          username: 'a'.repeat(24),
          referralCode: 'A'.repeat(32),
          network,
        }).success,
      ).toBe(true)
    }

    for (const walletType of ['MetaMask', 'WalletConnect', 'Coinbase Wallet'] as const) {
      expect(checkoutSchema.safeParse({ ...checkout, walletType }).success).toBe(true)
    }
  })

  it('rejects blank required fields and unsupported network or wallet types', () => {
    for (const overrides of [
      { displayName: ' ' },
      { profileName: ' ' },
      { ensName: ' ' },
      { referralCode: '' },
      { network: 'Bitcoin' },
      { walletId: '' },
      { walletType: 'Other' },
    ]) {
      expect(checkoutSchema.safeParse({ ...checkout, ...overrides }).success).toBe(false)
    }
  })
})
