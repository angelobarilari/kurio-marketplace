import { useState } from 'react'
import { isAxiosError } from 'axios'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useSession } from '@/features/auth/hooks/use-session'
import { quoteCart } from '@/features/cart/api/cart'
import type { CartError, CartQuote, QuoteCartInput } from '@/features/cart/types'
import { cartKeys, getCartOwnerId } from '@/features/cart/query-keys'
import { useCartQuote } from '@/features/cart/hooks/use-cart'

type UseCouponApplicationOptions = {
  enabled: boolean
  initialCouponCode?: string | null
}

export const useCouponApplication = ({ enabled, initialCouponCode = null }: UseCouponApplicationOptions) => {
  const [couponCode, setCouponCode] = useState(initialCouponCode)
  const [couponInput, setCouponInput] = useState(initialCouponCode ?? '')
  const [couponError, setCouponError] = useState<string | null>(null)
  const [couponErrorRetryable, setCouponErrorRetryable] = useState(false)
  const session = useSession()
  const queryClient = useQueryClient()
  const ownerId = getCartOwnerId(session.data?.user.id)
  const quote = useCartQuote(couponCode, enabled)
  const couponRequest = useMutation<CartQuote, Error, QuoteCartInput>({
    mutationFn: (input) => quoteCart(input),
    retry: false,
  })

  const applyCoupon = async () => {
    const candidate = couponInput.trim()
    setCouponError(null)
    setCouponErrorRetryable(false)

    if (!candidate) {
      setCouponCode(null)
      setCouponInput('')
      return
    }

    try {
      const result = await couponRequest.mutateAsync({ couponCode: candidate })
      queryClient.setQueryData(cartKeys.quote(ownerId, result.couponCode), result)
      setCouponCode(result.couponCode)
      setCouponInput(result.couponCode ?? '')
    } catch (error) {
      const response = isAxiosError<CartError>(error) ? error.response?.data : undefined
      const isCouponRejection = response?.code === 'COUPON_INVALID' || response?.code === 'COUPON_EXPIRED'

      setCouponError(response?.message ?? 'Não foi possível aplicar o cupom.')
      setCouponErrorRetryable(!isCouponRejection)
    }
  }

  const removeCoupon = () => {
    setCouponCode(null)
    setCouponInput('')
    setCouponError(null)
    setCouponErrorRetryable(false)
  }

  const updateCouponInput = (value: string) => {
    setCouponInput(value)
    setCouponError(null)
    setCouponErrorRetryable(false)
  }

  return {
    couponCode,
    couponInput,
    couponError,
    couponErrorRetryable,
    isApplyingCoupon: couponRequest.isPending,
    quote,
    applyCoupon,
    removeCoupon,
    updateCouponInput,
  }
}
