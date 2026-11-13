import type { SubmitHandler } from 'react-hook-form'
import type { Cart, CartQuote } from '@/features/cart/types'
import type { CheckoutFormValues } from '@/features/checkout/schemas'
import type { Network, Wallet } from '@/types/account'

export type CheckoutStep = 'collector' | 'payment'

export type CheckoutPageState =
  | { kind: 'ready' }
  | { kind: 'loading' }
  | { kind: 'session-error'; onRetry: () => void }
  | { kind: 'unauthenticated'; couponCode?: string }
  | { kind: 'load-error'; onRetry: () => void }
  | { kind: 'empty' }

export type CheckoutBlockingPageState = Exclude<CheckoutPageState, { kind: 'ready' }>

export type CheckoutAttemptStatusModel = {
  hasAttempt: boolean
  isPending: boolean
  isError: boolean
  error: unknown
}

export type CheckoutCollectorFormModel = {
  values: Partial<CheckoutFormValues>
  wallets: Wallet[]
  selectedWallet?: Wallet
  networks: readonly Network[]
  couponCode: string | null
  isMobileViewport: boolean
  mobileCheckoutStep: CheckoutStep
  connectionError: string
  isConnecting: boolean
}

export type CheckoutCollectorFormActions = {
  onSubmit: SubmitHandler<CheckoutFormValues>
  onNetworkChange: (network: string) => void
  onSelectWallet: (walletId: string) => void
  onContinue: () => void
  onRemoveCoupon: () => void
}

export type CheckoutPaymentPanelModel = {
  values: Partial<CheckoutFormValues>
  cart: Cart
  wallets: Wallet[]
  couponCode: string | null
  couponInput: string
  couponError: string | null
  couponErrorRetryable: boolean
  isApplyingCoupon: boolean
  checkoutError: string
  connectionError: string
  isMobile: boolean
  mobileStep: CheckoutStep
  connectedForSelection: boolean
  mustReviewQuote: boolean
  reviewedFingerprint: string | null
  attemptPending: boolean
  quote: {
    data?: CartQuote
    error: unknown
    isPending: boolean
    isError: boolean
    isFetching: boolean
  }
  connectionHasError: boolean
  isConnecting: boolean
  isDisconnecting: boolean
  isCreatingOrder: boolean
}

export type CheckoutPaymentPanelActions = {
  onCouponInputChange: (value: string) => void
  onApplyCoupon: () => void
  onRemoveCoupon: () => void
  onRetryCoupon: () => void
  onSelectWallet: (walletId: string) => void
  onChangeWallet: () => void
  onDisconnect: () => void
  onAcceptQuote: (fingerprint: string | null) => void
  onRetryQuote: () => void
  onRetryConnection: () => void
}
