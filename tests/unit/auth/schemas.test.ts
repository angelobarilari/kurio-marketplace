import { describe, expect, it } from 'vitest'
import {
  createAuthFormSchema,
  passwordChangeSchema,
  passwordRecoverySchema,
  profileSchema,
  walletSchema,
} from '@/features/auth/schemas'

const registration = {
  username: 'collector_1',
  email: 'collector@example.com',
  password: 'StrongPass123',
  confirmation: 'StrongPass123',
}

const profile = {
  displayName: 'Collector',
  username: 'collector_1',
  email: 'collector@example.com',
  ensName: '',
  walletAlias: 'Main wallet',
}

const wallet = {
  displayName: 'Main wallet',
  alias: 'Main',
  network: 'Ethereum' as const,
  address: `0x${'a'.repeat(40)}`,
  provider: 'MetaMask' as const,
  ensName: '',
  priority: 'primary' as const,
}

describe('Authentication form schemas', () => {
  it('keeps login validation separate from registration requirements', () => {
    const result = createAuthFormSchema('login').safeParse({
      username: '',
      email: ' collector@example.com ',
      password: 'x',
      confirmation: '',
    })

    expect(result).toMatchObject({
      success: true,
      data: { email: 'collector@example.com', password: 'x' },
    })
    expect(
      createAuthFormSchema('login').safeParse({
        username: '',
        email: 'invalid',
        password: '',
        confirmation: '',
      }).success,
    ).toBe(false)
  })

  it('trims registration identifiers and enforces the minimum password length', () => {
    const result = createAuthFormSchema('register').safeParse({
      ...registration,
      username: ' collector_1 ',
      email: ' collector@example.com ',
    })

    expect(result).toMatchObject({
      success: true,
      data: { username: 'collector_1', email: 'collector@example.com' },
    })

    expect(
      createAuthFormSchema('register').safeParse({
        ...registration,
        password: 'Aa123456',
        confirmation: 'Aa123456',
      }).success,
    ).toBe(true)
  })

  it('requires a valid registration username and email', () => {
    for (const username of ['ab', 'a'.repeat(25), 'collector name']) {
      expect(createAuthFormSchema('register').safeParse({ ...registration, username }).success).toBe(false)
    }
    for (const username of ['abc', 'a'.repeat(24)]) {
      expect(createAuthFormSchema('register').safeParse({ ...registration, username }).success).toBe(true)
    }
    expect(createAuthFormSchema('register').safeParse({ ...registration, email: 'invalid' }).success).toBe(
      false,
    )
  })

  it('requires matching registration passwords', () => {
    const mismatch = createAuthFormSchema('register').safeParse({
      ...registration,
      confirmation: 'DifferentPass123',
    })
    expect(mismatch.success).toBe(false)
    if (!mismatch.success) {
      expect(mismatch.error.issues).toContainEqual(
        expect.objectContaining({ path: ['confirmation'], message: 'As senhas não coincidem.' }),
      )
    }
  })

  it.each(['short1A', 'lowercase123', 'UPPERCASE123', 'NoNumberHere'])(
    'rejects registration passwords that violate the password policy (%s)',
    (password) => {
      expect(
        createAuthFormSchema('register').safeParse({
          ...registration,
          password,
          confirmation: password,
        }).success,
      ).toBe(false)
    },
  )

  it('validates recovery email and normalizes surrounding whitespace', () => {
    expect(passwordRecoverySchema.parse({ email: ' person@example.com ' })).toEqual({
      email: 'person@example.com',
    })
    expect(passwordRecoverySchema.safeParse({ email: 'not-an-email' }).success).toBe(false)
  })
})

describe('Profile and password schemas', () => {
  it('allows an empty optional ENS name and trims profile fields', () => {
    const result = profileSchema.safeParse({
      ...profile,
      displayName: ' Collector ',
      username: ' collector_1 ',
      email: ' collector@example.com ',
      ensName: ' ',
      walletAlias: ' Main wallet ',
    })

    expect(result).toMatchObject({
      success: true,
      data: {
        displayName: 'Collector',
        username: 'collector_1',
        email: 'collector@example.com',
        ensName: '',
        walletAlias: 'Main wallet',
      },
    })
  })

  it('accepts a valid ENS name and rejects malformed profile values', () => {
    expect(profileSchema.safeParse({ ...profile, ensName: 'Collector.Kurio.ETH' }).success).toBe(true)
    for (const overrides of [
      { displayName: ' ' },
      { username: 'ab' },
      { email: 'invalid' },
      { ensName: 'invalid-name' },
      { walletAlias: ' ' },
    ]) {
      expect(profileSchema.safeParse({ ...profile, ...overrides }).success).toBe(false)
    }
  })

  it('requires a valid new password and matching password confirmation', () => {
    const input = {
      currentPassword: 'Existing123',
      newPassword: 'UpdatedPass123',
      passwordConfirmation: 'UpdatedPass123',
    }
    expect(passwordChangeSchema.safeParse(input).success).toBe(true)
    expect(
      passwordChangeSchema.safeParse({ ...input, passwordConfirmation: 'DifferentPass123' }).success,
    ).toBe(false)
    expect(passwordChangeSchema.safeParse({ ...input, newPassword: 'weak' }).success).toBe(false)
    expect(passwordChangeSchema.safeParse({ ...input, currentPassword: '' }).success).toBe(false)
    expect(passwordChangeSchema.safeParse({ ...input, passwordConfirmation: '' }).success).toBe(false)
  })
})

describe('Wallet schema network rules', () => {
  it.each([
    ['Ethereum', 'MetaMask', 'primary', `0x${'a'.repeat(40)}`],
    ['Polygon', 'Coinbase Wallet', 'secondary', `0x${'A'.repeat(40)}`],
    ['Solana', 'WalletConnect', 'secondary', '1'.repeat(44)],
  ] as const)(
    'accepts a valid %s wallet with supported provider and priority',
    (network, provider, priority, address) => {
      expect(walletSchema.safeParse({ ...wallet, network, provider, priority, address }).success).toBe(true)
    },
  )

  it('accepts an optional ENS name and rejects malformed ENS names', () => {
    expect(walletSchema.safeParse({ ...wallet, ensName: 'Collector.Kurio.ETH' }).success).toBe(true)
    expect(walletSchema.safeParse({ ...wallet, ensName: 'invalid-name' }).success).toBe(false)
  })

  it.each([
    ['Ethereum', '1'.repeat(32)],
    ['Solana', `0x${'a'.repeat(40)}`],
  ] as const)('rejects an address that does not match the %s network', (network, address) => {
    expect(walletSchema.safeParse({ ...wallet, network, address }).success).toBe(false)
  })

  it('rejects invalid wallet field values and unsupported network formats', () => {
    for (const overrides of [
      { displayName: 'A' },
      { alias: 'X' },
      { network: 'Arbitrum' },
      { address: ' ' },
      { provider: 'Unsupported' },
      { priority: 'tertiary' },
      { network: 'Solana', address: '1'.repeat(31) },
    ]) {
      expect(walletSchema.safeParse({ ...wallet, ...overrides }).success).toBe(false)
    }
  })
})
