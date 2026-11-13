import { delay, http, HttpResponse } from 'msw'
import type { CheckoutApiError, CreateOrderInput, OrderStatus, WalletConnectionInput } from '@/types/order'
import { expireSessionState, getSessionState } from '@/mocks/state/account-store'
import {
  connectWalletState,
  createOrderState,
  disconnectWalletState,
  getOrderByAttemptState,
  getOrderState,
  getWalletConnectionState,
  transitionOrderState,
} from '@/mocks/state/order-store'
import { updateCatalogNft } from '@/mocks/state/catalog-store'
import { validationErrorResponse } from '@/mocks/handlers/http-utils'

const unauthorized = () =>
  HttpResponse.json({ code: 'AUTH_REQUIRED', message: 'Entre para continuar.' }, { status: 401 })

const errorResponse = (error: CheckoutApiError, status: number) => HttpResponse.json(error, { status })

const validProviders = ['MetaMask', 'WalletConnect', 'Coinbase Wallet']
const validNetworks = ['Ethereum', 'Polygon', 'Solana']

export const orderHttpHandlers = [
  http.get('/api/checkout/wallet-connection', async () => {
    await delay(80)
    if (!getSessionState()) return unauthorized()
    return HttpResponse.json(getWalletConnectionState())
  }),

  http.post('/api/checkout/wallet-connection', async ({ request }) => {
    await delay(180)
    const scenario = request.headers.get('x-kurio-mock-scenario')
    if (scenario === 'wallet-connect-offline') return HttpResponse.error()
    if (scenario === 'wallet-connect-rejected') {
      return errorResponse(
        { code: 'CONNECTION_REJECTED', message: 'A conexão da carteira foi recusada.' },
        409,
      )
    }

    const input = (await request.json()) as WalletConnectionInput
    const fieldErrors: Record<string, string> = {}
    if (!input.walletId) fieldErrors.walletId = 'Selecione uma carteira.'
    if (!validNetworks.includes(input.network)) fieldErrors.network = 'Selecione uma rede válida.'
    if (!validProviders.includes(input.provider)) fieldErrors.provider = 'Selecione um provedor válido.'
    if (Object.keys(fieldErrors).length) return validationErrorResponse(fieldErrors)

    const connection = connectWalletState(input)
    if (!connection) {
      return getSessionState()
        ? errorResponse(
            { code: 'WALLET_NOT_FOUND', message: 'A carteira não está cadastrada nesta rede.' },
            404,
          )
        : unauthorized()
    }
    return HttpResponse.json(connection, { status: 201 })
  }),

  http.delete('/api/checkout/wallet-connection/:connectionId', async ({ params }) => {
    await delay(100)
    const disconnected = disconnectWalletState(String(params.connectionId))
    if (disconnected === null) return unauthorized()
    return disconnected
      ? new HttpResponse(null, { status: 204 })
      : errorResponse(
          { code: 'WALLET_CONNECTION_NOT_FOUND', message: 'A carteira já está desconectada.' },
          404,
        )
  }),

  http.post('/api/orders', async ({ request }) => {
    await delay(240)
    const scenario = request.headers.get('x-kurio-mock-scenario') ?? 'default'
    if (scenario === 'order-timeout-before-create') return HttpResponse.error()
    if (scenario === 'session-expired-during-checkout') {
      expireSessionState()
      return unauthorized()
    }

    const input = (await request.json()) as CreateOrderInput
    if (request.headers.get('idempotency-key') !== input.idempotencyKey) {
      return errorResponse(
        { code: 'INVALID_IDEMPOTENCY_KEY', message: 'A chave da tentativa é inválida.' },
        400,
      )
    }
    if (scenario === 'checkout-coupon-expired' && input.quoteRevision.couponCode) {
      return errorResponse({ code: 'COUPON_EXPIRED', message: 'Este cupom expirou.' }, 410)
    }
    if (scenario === 'checkout-price-changed') {
      updateCatalogNft('emerald-ape-042', (nft) =>
        nft.priceEth === '1.75' ? nft : { ...nft, priceEth: '1.75', version: nft.version + 1 },
      )
    }
    if (scenario === 'checkout-edition-sold-out') {
      updateCatalogNft('emerald-ape-042', (nft) =>
        nft.available ? { ...nft, available: false, version: nft.version + 1 } : nft,
      )
    }

    const result = createOrderState(input)
    if ('unauthorized' in result) return unauthorized()
    if ('error' in result) return errorResponse(result.error, result.status)

    if (result.created && scenario !== 'order-pending') {
      const finalStatus: Exclude<OrderStatus, 'pending'> =
        scenario === 'payment-declined' ? 'declined' : 'confirmed'
      globalThis.setTimeout(() => {
        transitionOrderState(result.order.userId, result.order.id, finalStatus)
      }, 550)
    }
    if (scenario === 'order-timeout-after-create') return HttpResponse.error()
    return HttpResponse.json(result.order, { status: result.created ? 201 : 200 })
  }),

  http.get('/api/orders/by-idempotency/:idempotencyKey', async ({ params }) => {
    await delay(100)
    if (!getSessionState()) return unauthorized()
    const order = getOrderByAttemptState(String(params.idempotencyKey))
    return order
      ? HttpResponse.json(order)
      : errorResponse(
          { code: 'ORDER_NOT_FOUND', message: 'Nenhum pedido foi criado para esta tentativa.' },
          404,
        )
  }),

  http.get('/api/orders/:orderId', async ({ params }) => {
    await delay(140)
    if (!getSessionState()) return unauthorized()
    const order = getOrderState(String(params.orderId))
    return order
      ? HttpResponse.json(order)
      : errorResponse({ code: 'ORDER_NOT_FOUND', message: 'Pedido não encontrado.' }, 404)
  }),

  http.post('/api/mock/orders/:orderId/transition', async ({ params, request }) => {
    const session = getSessionState()
    if (!session) return unauthorized()
    const body = (await request.json()) as { status: OrderStatus }
    if (body.status !== 'confirmed' && body.status !== 'declined') {
      return errorResponse({ code: 'INVALID_ORDER_TRANSITION', message: 'Estado final inválido.' }, 400)
    }
    const order = transitionOrderState(session.user.id, String(params.orderId), body.status)
    return order
      ? HttpResponse.json(order)
      : errorResponse({ code: 'ORDER_NOT_FOUND', message: 'Pedido não encontrado.' }, 404)
  }),
]
