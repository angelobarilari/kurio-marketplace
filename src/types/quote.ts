import type { Network } from '@/types/account'

export type CartTotals = {
  subtotalEth: string
  discountEth: string
  networkFeeEth: string
  totalEth: string
}

export type QuoteRevision = CartTotals & {
  fingerprint: string
  couponCode: string | null
  network: Network | 'all'
  valid: boolean
  issuedAt: string
}
