import type { Network, WalletProvider } from '@/types/account'
import type { QuoteRevision } from '@/types/quote'

export type CheckoutDraft = {
  displayName: string
  profileName: string
  username: string
  email: string
  network: Network
  walletId: string
  walletAddress: string
  secondaryWalletAddress: string | null
  walletType: WalletProvider
  ensName: string
  referralCode: string
  collectorNote: string | null
}

export type WalletConnectionInput = {
  walletId: string
  network: Network
  provider: WalletProvider
}

export type WalletConnection = WalletConnectionInput & {
  id: string
  userId: string
  sessionId: string
  connectedAt: string
}

export type OrderStatus = 'pending' | 'confirmed' | 'declined'
export type PaymentAttemptStatus = 'pending' | 'accepted' | 'declined'

export type PaymentAttempt = {
  id: string
  idempotencyKey: string
  provider: WalletProvider
  status: PaymentAttemptStatus
  startedAt: string
  completedAt: string | null
}

export type OrderItemSnapshot = {
  id: string
  nftId: string
  name: string
  tokenId: string
  collection: string
  image: string
  network: Network
  editionId: string
  editionLabel: string
  quantity: number
  unitPriceEth: string
  lineTotalEth: string
}

export type OrderCollectorSnapshot = Pick<
  CheckoutDraft,
  | 'displayName'
  | 'profileName'
  | 'username'
  | 'email'
  | 'ensName'
  | 'secondaryWalletAddress'
  | 'referralCode'
  | 'collectorNote'
>

export type Receipt = {
  transactionId: string
  explorerUrl: string
  issuedAt: string
  network: Network
  wallet: Pick<CheckoutDraft, 'walletId' | 'walletAddress' | 'walletType'>
  collector: OrderCollectorSnapshot
  items: OrderItemSnapshot[]
  quote: QuoteRevision
}

export type Order = {
  id: string
  userId: string
  status: OrderStatus
  version: number
  createdAt: string
  updatedAt: string
  checkout: CheckoutDraft
  quote: QuoteRevision
  items: OrderItemSnapshot[]
  paymentAttempt: PaymentAttempt
  receipt: Receipt | null
  failureMessage: string | null
}

export type CreateOrderInput = {
  idempotencyKey: string
  checkout: CheckoutDraft
  quoteRevision: QuoteRevision
  connectionId: string
}

export type OrderUpdatedEvent = {
  orderId: string
  userId: string
  version: number
  order: Order
}

export type CheckoutApiError = {
  code: string
  message: string
  fieldErrors?: Record<string, string>
  quoteRevision?: QuoteRevision
}
