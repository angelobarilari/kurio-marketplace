import { toSocketIo } from '@mswjs/socket.io-binding'
import { ws } from 'msw'
import { updateCatalogNft } from '@/mocks/state/catalog-store'
import { getSessionState } from '@/mocks/state/account-store'
import { getOrderState, subscribeOrderState } from '@/mocks/state/order-store'
import type { OrderUpdatedEvent } from '@/types/order'

// Engine.IO negotiates the transport with query parameters before the Socket.IO
// binding takes control, so the MSW mock must accept the complete WebSocket URL.
const socketEndpoint = ws.link('*')

export const catalogRealtimeHandler = socketEndpoint.addEventListener('connection', (connection) => {
  const socket = toSocketIo(connection)
  let unsubscribeOrder: () => void = () => undefined

  socket.client.on('catalog.subscribe', () => {
    const scenario = globalThis.localStorage?.getItem('kurio:mock-scenario')
    if (scenario === 'socket-offline') return
    if (scenario !== 'cart-realtime-price' && scenario !== 'cart-realtime-sold-out') return

    const isSoldOutScenario = scenario === 'cart-realtime-sold-out'
    const scenarioPrice = scenario === 'cart-realtime-price' ? '1.75' : '1.20'
    const nft = updateCatalogNft('emerald-ape-042', (current) => ({
      ...current,
      version: current.version + 1,
      priceEth: scenarioPrice,
      available: !isSoldOutScenario,
    }))
    if (!nft) return

    socket.client.emit('nft.updated', {
      id: nft.id,
      version: nft.version,
      priceEth: nft.priceEth,
      available: nft.available,
    })
    socket.client.emit('nft.updated', {
      id: nft.id,
      version: nft.version - 1,
      priceEth: '9.99',
      available: false,
    })
  })

  socket.client.on('order.subscribe', (_event, payload: { orderId?: string }) => {
    const scenario = globalThis.localStorage?.getItem('kurio:mock-scenario')
    if (scenario === 'socket-offline') return
    const session = getSessionState()
    const order = payload?.orderId ? getOrderState(payload.orderId) : null
    if (!session || !order || order.userId !== session.user.id) return

    unsubscribeOrder()
    const emitOrder = (event: OrderUpdatedEvent) => socket.client.emit('order.updated', event)
    unsubscribeOrder = subscribeOrderState(session.user.id, order.id, emitOrder)
    emitOrder({ orderId: order.id, userId: session.user.id, version: order.version, order })
    if (scenario === 'order-duplicate-events') {
      emitOrder({ orderId: order.id, userId: session.user.id, version: order.version, order })
      if (order.version > 1) {
        emitOrder({
          orderId: order.id,
          userId: session.user.id,
          version: order.version - 1,
          order: { ...order, version: order.version - 1, status: 'pending' },
        })
      }
    }
  })

  connection.client.addEventListener('close', () => unsubscribeOrder())
})
