import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { Socket } from 'socket.io-client'
import { orderKeys, setOrderCacheFromEvent } from '@/features/order/hooks/use-orders'
import type { OrderUpdatedEvent } from '@/types/order'

type OrderRealtimeSyncProps = { sessionId: string; userId: string; orderId: string }

export const OrderRealtimeSync = ({ sessionId, userId, orderId }: OrderRealtimeSyncProps) => {
  const queryClient = useQueryClient()

  useEffect(() => {
    const configuredSocketUrl = import.meta.env.VITE_SOCKET_URL
    if (!configuredSocketUrl) return
    const socketUrl = configuredSocketUrl === 'same-origin' ? globalThis.location.origin : configuredSocketUrl
    let socket: Socket | undefined
    let disposed = false

    void import('socket.io-client').then(({ io }) => {
      if (disposed) return
      socket = io(socketUrl, { path: '/socket.io/', transports: ['websocket'], reconnection: true })
      socket.on('connect', () => {
        void queryClient.invalidateQueries({ queryKey: orderKeys.detail(sessionId, orderId) })
        socket?.emit('order.subscribe', { orderId })
      })
      socket.on('order.updated', (event: OrderUpdatedEvent) => {
        if (event.orderId !== orderId || event.userId !== userId || event.order.userId !== userId) return
        setOrderCacheFromEvent(queryClient, sessionId, event.order)
        void queryClient.invalidateQueries({ queryKey: ['cart'] })
      })
    })

    return () => {
      disposed = true
      socket?.removeAllListeners()
      socket?.disconnect()
    }
  }, [orderId, queryClient, sessionId, userId])

  return null
}
