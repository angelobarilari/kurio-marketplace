import { useCallback, useEffect, useMemo, useState } from 'react'
import { useOrderByAttempt } from '@/features/order/hooks/use-orders'
import { checkoutAttemptStoragePrefix } from '@/features/checkout/constants'

type UseCheckoutAttemptInput = {
  userId: string
  sessionId: string
  onRecovered: (orderId: string) => void
}

export const useCheckoutAttempt = ({ userId, sessionId, onRecovered }: UseCheckoutAttemptInput) => {
  const [attemptState, setAttemptState] = useState<{ userId: string; key: string | null }>({
    userId: '',
    key: null,
  })
  const storageKey = `${checkoutAttemptStoragePrefix}${userId}`
  const storedKey = useMemo(
    () => (userId ? window.sessionStorage.getItem(storageKey) : null),
    [storageKey, userId],
  )
  const key = attemptState.userId === userId ? attemptState.key : storedKey
  const order = useOrderByAttempt(sessionId, key ?? '')

  const clear = useCallback(() => {
    window.sessionStorage.removeItem(storageKey)
    setAttemptState({ userId, key: null })
  }, [storageKey, userId])

  const getOrCreateKey = useCallback(() => {
    if (key) return key
    const newKey = globalThis.crypto.randomUUID()
    window.sessionStorage.setItem(storageKey, newKey)
    setAttemptState({ userId, key: newKey })
    return newKey
  }, [key, storageKey, userId])

  useEffect(() => {
    if (!order.data) return
    window.sessionStorage.removeItem(storageKey)
    onRecovered(order.data.id)
  }, [onRecovered, order.data, storageKey])

  return { key, order, clear, getOrCreateKey }
}
