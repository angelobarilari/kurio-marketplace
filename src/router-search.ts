import { isNetwork } from '@/features/checkout/constants'
import type { Network } from '@/types/account'

export const parseCouponCodeSearch = (value: unknown): string | undefined =>
  typeof value === 'string' && /^[A-Za-z0-9-]{1,32}$/.test(value) ? value.toUpperCase() : undefined

export const parseNetworkSearch = (value: unknown): Network | undefined =>
  typeof value === 'string' && isNetwork(value) ? value : undefined
