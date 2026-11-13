import type { Network, WalletProvider } from '@/types/account'

export const checkoutNetworks = ['Ethereum', 'Polygon', 'Solana'] as const satisfies readonly Network[]

export const checkoutWalletProviders = [
  'MetaMask',
  'WalletConnect',
  'Coinbase Wallet',
] as const satisfies readonly WalletProvider[]

export const checkoutAttemptStoragePrefix = 'kurio:checkout-attempt:'

export const isNetwork = (value: string): value is Network =>
  checkoutNetworks.some((network) => network === value)

export const isWalletProvider = (value: string): value is WalletProvider =>
  checkoutWalletProviders.some((provider) => provider === value)
