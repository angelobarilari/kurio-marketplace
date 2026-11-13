import { delay, http, HttpResponse } from 'msw'
import {
  addCartItemState,
  getCartState,
  getCartQuoteState,
  hydrateCartState,
  mergeVisitorCartState,
  removeCartItemState,
  updateCartItemState,
} from '@/mocks/state/cart-store'
import type { AddCartItemInput, MergeCartInput, QuoteCartInput } from '@/features/cart/types'

const getScenario = (request: Request) => request.headers.get('x-kurio-mock-scenario') ?? 'default'
const errorMessages: Record<string, string> = {
  NFT_NOT_FOUND: 'NFT não encontrado.',
  EDITION_UNAVAILABLE: 'Esta edição não está disponível.',
  INVALID_QUANTITY: 'Informe uma quantidade inteira válida.',
  QUANTITY_LIMIT: 'A quantidade excede o limite disponível.',
  CART_ITEM_NOT_FOUND: 'Item do carrinho não encontrado.',
}

const errorResponse = (result: { error: string; maxQuantity?: number }) =>
  HttpResponse.json(
    {
      code: result.error,
      message: errorMessages[result.error] ?? 'Não foi possível atualizar o carrinho.',
      maxQuantity: result.maxQuantity,
    },
    { status: result.error === 'CART_ITEM_NOT_FOUND' || result.error === 'NFT_NOT_FOUND' ? 404 : 409 },
  )

const hydrateRequestCart = (request: Request) => hydrateCartState(request.headers.get('x-kurio-cart-state'))

export const cartHttpHandlers = [
  http.post('/api/cart/merge', async ({ request }) => {
    await delay(180)
    const input = (await request.json()) as MergeCartInput
    if (
      !input.idempotencyKey ||
      !Array.isArray(input.items) ||
      input.items.some(
        (item) =>
          !item.id ||
          !item.nftId ||
          !item.editionId ||
          !Number.isSafeInteger(item.quantity) ||
          item.quantity < 1,
      )
    ) {
      return HttpResponse.json(
        { code: 'INVALID_CART_REQUEST', message: 'O carrinho visitante é inválido.' },
        { status: 400 },
      )
    }
    const result = mergeVisitorCartState(input)
    return result
      ? HttpResponse.json(result)
      : HttpResponse.json({ code: 'AUTH_REQUIRED', message: 'Entre para continuar.' }, { status: 401 })
  }),

  http.get('/api/cart', async ({ request }) => {
    hydrateRequestCart(request)
    const scenario = getScenario(request)
    if (scenario === 'cart-offline') return HttpResponse.error()
    if (scenario === 'cart-client-error')
      return HttpResponse.json(
        { code: 'INVALID_CART_REQUEST', message: 'A solicitação do carrinho é inválida.' },
        { status: 400 },
      )
    const responseDelay = scenario === 'cart-slow' ? 1200 : scenario === 'cart-out-of-order' ? 1000 : 180
    await delay(responseDelay)
    if (scenario === 'cart-error' || scenario === 'cart-server-error')
      return HttpResponse.json({ code: 'CART_UNAVAILABLE' }, { status: 503 })
    return HttpResponse.json(getCartState())
  }),

  http.post('/api/cart/items', async ({ request }) => {
    hydrateRequestCart(request)
    await delay(140)
    if (getScenario(request) === 'cart-mutation-error')
      return HttpResponse.json(
        { code: 'CART_UPDATE_FAILED', message: 'Não foi possível adicionar o item.' },
        { status: 503 },
      )
    const result = addCartItemState((await request.json()) as AddCartItemInput)
    return 'error' in result ? errorResponse(result) : HttpResponse.json(result, { status: 201 })
  }),

  http.patch('/api/cart/items/:itemId', async ({ params, request }) => {
    hydrateRequestCart(request)
    await delay(160)
    if (getScenario(request) === 'cart-mutation-error')
      return HttpResponse.json(
        { code: 'CART_UPDATE_FAILED', message: 'Não foi possível alterar a quantidade.' },
        { status: 503 },
      )
    const body = (await request.json()) as { quantity: number }
    const result = updateCartItemState(String(params.itemId), body.quantity)
    return 'error' in result ? errorResponse(result) : HttpResponse.json(result)
  }),

  http.delete('/api/cart/items/:itemId', async ({ params, request }) => {
    hydrateRequestCart(request)
    await delay(120)
    const result = removeCartItemState(String(params.itemId))
    return 'error' in result ? errorResponse(result) : HttpResponse.json(result)
  }),

  http.post('/api/cart/quote', async ({ request }) => {
    hydrateRequestCart(request)
    await delay(getScenario(request) === 'quote-slow' ? 1200 : 220)
    if (getScenario(request) === 'quote-error')
      return HttpResponse.json(
        { code: 'QUOTE_UNAVAILABLE', message: 'Não foi possível atualizar os valores.' },
        { status: 503 },
      )
    const input = (await request.json()) as QuoteCartInput
    const normalizedCoupon = input.couponCode?.trim().toUpperCase() || null
    if (normalizedCoupon === 'EXPIRADO')
      return HttpResponse.json({ code: 'COUPON_EXPIRED', message: 'Este cupom expirou.' }, { status: 410 })
    if (normalizedCoupon && normalizedCoupon !== 'KURIO10')
      return HttpResponse.json({ code: 'COUPON_INVALID', message: 'Cupom inválido.' }, { status: 422 })

    return HttpResponse.json(getCartQuoteState({ couponCode: normalizedCoupon, network: input.network }))
  }),
]
