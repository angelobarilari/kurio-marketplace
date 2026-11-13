import { Navigate } from '@tanstack/react-router'
import type { AuthReturnTo } from '@/features/auth/types'

type AuthAuthenticatedRedirectProps = {
  returnTo: AuthReturnTo
  couponCode?: string
}

export const AuthAuthenticatedRedirect = ({ returnTo, couponCode }: AuthAuthenticatedRedirectProps) => {
  if (returnTo.startsWith('/nfts/')) {
    return <Navigate to="/nfts/$nftId" params={{ nftId: returnTo.slice('/nfts/'.length) }} replace />
  }
  if (returnTo.startsWith('/orders/')) {
    return <Navigate to="/orders/$orderId" params={{ orderId: returnTo.slice('/orders/'.length) }} replace />
  }
  if (returnTo === '/checkout') {
    return <Navigate to="/checkout" search={{ couponCode }} replace />
  }
  return <Navigate to={returnTo as Exclude<AuthReturnTo, `/nfts/${string}` | `/orders/${string}`>} replace />
}
