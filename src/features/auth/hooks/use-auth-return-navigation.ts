import { useCallback } from 'react'
import { useNavigate } from '@tanstack/react-router'
import type { AuthReturnTo } from '@/features/auth/types'

type AuthReturnSearch = { returnTo?: AuthReturnTo; couponCode?: string }

export const useAuthReturnNavigation = ({ returnTo = '/', couponCode }: AuthReturnSearch) => {
  const navigate = useNavigate()

  return useCallback(() => {
    if (returnTo.startsWith('/nfts/')) {
      return navigate({
        to: '/nfts/$nftId',
        params: { nftId: returnTo.slice('/nfts/'.length) },
        replace: true,
      })
    }
    if (returnTo.startsWith('/orders/')) {
      return navigate({
        to: '/orders/$orderId',
        params: { orderId: returnTo.slice('/orders/'.length) },
        replace: true,
      })
    }
    if (returnTo === '/checkout') {
      return navigate({ to: '/checkout', search: { couponCode }, replace: true })
    }
    return navigate({
      to: returnTo as Exclude<AuthReturnTo, `/nfts/${string}` | `/orders/${string}`>,
      replace: true,
    })
  }, [couponCode, navigate, returnTo])
}
