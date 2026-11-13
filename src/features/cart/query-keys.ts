import type { Network } from '@/types/account'

export const cartKeys = {
  all: ['cart'] as const,
  detail: (ownerId = 'visitor') => ['cart', ownerId, 'detail'] as const,
  quote: (ownerId: string, couponCode: string | null, network?: Network) =>
    ['cart', ownerId, 'quote', network ?? 'all', couponCode] as const,
}

export const getCartOwnerId = (userId?: string | null) => userId ?? 'visitor'
