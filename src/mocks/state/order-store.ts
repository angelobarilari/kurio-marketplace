import { getProfileState, getSessionState, getWalletsState } from '@/mocks/state/account-store'
import {
  getCartQuoteState,
  getCartState,
  removePurchasedCartItemsForUserState,
} from '@/mocks/state/cart-store'
import { releaseNftEdition, reserveNftEdition } from '@/mocks/state/catalog-store'
import type { Network } from '@/types/account'
import type {
  CheckoutApiError,
  CheckoutDraft,
  CreateOrderInput,
  Order,
  OrderItemSnapshot,
  OrderStatus,
  OrderUpdatedEvent,
  Receipt,
  WalletConnection,
  WalletConnectionInput,
} from '@/types/order'

type StoredOrderState = {
  orders: Record<string, Order[]>
  idempotency: Record<string, { payload: string; orderId: string }>
  connections: Record<string, WalletConnection>
}

export type OrderCreationResult =
  { order: Order; created: boolean } | { error: CheckoutApiError; status: number } | { unauthorized: true }

const storageKey = 'kurio:mock-orders:v1'
let memoryState: StoredOrderState = { orders: {}, idempotency: {}, connections: {} }
const subscribers = new Map<string, Set<(event: OrderUpdatedEvent) => void>>()

const readState = (): StoredOrderState => {
  try {
    const stored = globalThis.localStorage?.getItem(storageKey)
    if (stored) memoryState = JSON.parse(stored) as StoredOrderState
  } catch {
    // Keep mock order state available in memory when storage is unavailable or malformed.
  }
  return memoryState
}

const writeState = (state: StoredOrderState) => {
  memoryState = state
  try {
    globalThis.localStorage?.setItem(storageKey, JSON.stringify(state))
  } catch {
    // The mock remains functional in memory when storage is unavailable.
  }
}

const userOrderKey = (userId: string, orderId: string) => `${userId}:${orderId}`
const userAttemptKey = (userId: string, attemptKey: string) => `${userId}:${attemptKey}`
const networks = ['Ethereum', 'Polygon', 'Solana'] as const satisfies readonly Network[]
const isNetwork = (value: string): value is Network => networks.some((network) => network === value)

const getItemsForDraft = (): OrderItemSnapshot[] | null => {
  const snapshots: OrderItemSnapshot[] = []
  for (const item of getCartState().items) {
    if (!isNetwork(item.nft.network)) return null
    snapshots.push({
      id: item.id,
      nftId: item.nft.id,
      name: item.nft.name,
      tokenId: item.nft.tokenId,
      collection: item.nft.collection,
      image: item.nft.image,
      network: item.nft.network,
      editionId: item.editionId,
      editionLabel: item.editionLabel,
      quantity: item.quantity,
      unitPriceEth: item.unitPriceEth,
      lineTotalEth: item.lineTotalEth,
    })
  }
  return snapshots
}

const quoteMatches = (first: CreateOrderInput['quoteRevision'], second: CreateOrderInput['quoteRevision']) =>
  first.fingerprint === second.fingerprint &&
  first.couponCode === second.couponCode &&
  first.network === second.network &&
  first.subtotalEth === second.subtotalEth &&
  first.discountEth === second.discountEth &&
  first.networkFeeEth === second.networkFeeEth &&
  first.totalEth === second.totalEth &&
  first.valid === second.valid

const payloadForIdempotency = (input: CreateOrderInput) =>
  JSON.stringify({
    checkout: input.checkout,
    quote: {
      fingerprint: input.quoteRevision.fingerprint,
      couponCode: input.quoteRevision.couponCode,
      network: input.quoteRevision.network,
      subtotalEth: input.quoteRevision.subtotalEth,
      discountEth: input.quoteRevision.discountEth,
      networkFeeEth: input.quoteRevision.networkFeeEth,
      totalEth: input.quoteRevision.totalEth,
      valid: input.quoteRevision.valid,
    },
    connectionId: input.connectionId,
  })

const notifyOrder = (order: Order) => {
  const event: OrderUpdatedEvent = {
    orderId: order.id,
    userId: order.userId,
    version: order.version,
    order,
  }
  subscribers.get(userOrderKey(order.userId, order.id))?.forEach((listener) => listener(event))
}

const validateDraft = (draft: CheckoutDraft): Record<string, string> => {
  const errors: Record<string, string> = {}
  if (draft.displayName.trim().length < 2) errors.displayName = 'Informe seu nome de exibição.'
  if (draft.profileName.trim().length < 2) errors.profileName = 'Informe o nome do perfil.'
  if (!/^[a-zA-Z0-9._-]{3,24}$/.test(draft.username.trim())) errors.username = 'Informe um usuário válido.'
  if (!/^\S+@\S+\.\S+$/.test(draft.email.trim())) errors.email = 'Informe um e-mail válido.'
  if (!draft.walletId) errors.walletId = 'Selecione uma carteira cadastrada.'
  if (
    !/^0x[a-fA-F0-9]{40}$/.test(draft.walletAddress) &&
    !/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(draft.walletAddress)
  ) {
    errors.walletAddress = 'Informe um endereço de carteira válido.'
  }
  if (!draft.ensName.trim() || !/^(?:[a-z0-9-]+\.)+eth$/i.test(draft.ensName)) {
    errors.ensName = 'Informe um nome ENS terminado em .eth.'
  }
  if (
    draft.secondaryWalletAddress &&
    !/^0x[a-fA-F0-9]{40}$/.test(draft.secondaryWalletAddress) &&
    !/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(draft.secondaryWalletAddress) &&
    !/^(?:[a-z0-9-]+\.)+eth$/i.test(draft.secondaryWalletAddress)
  ) {
    errors.secondaryWalletAddress = 'Informe um ENS ou endereço de carteira válido.'
  }
  if (!draft.referralCode.trim() || !/^[A-Za-z0-9-]{1,32}$/.test(draft.referralCode)) {
    errors.referralCode = 'Use até 32 letras, números ou hífens.'
  }
  if (draft.collectorNote && draft.collectorNote.length > 500) {
    errors.collectorNote = 'A observação deve ter no máximo 500 caracteres.'
  }
  return errors
}

export const connectWalletState = (input: WalletConnectionInput): WalletConnection | null => {
  const session = getSessionState()
  const wallet = getWalletsState()?.find(
    (candidate) => candidate.id === input.walletId && candidate.network === input.network,
  )
  if (!session || !wallet) return null

  const connection: WalletConnection = {
    ...input,
    id: `connection-${globalThis.crypto.randomUUID()}`,
    userId: session.user.id,
    sessionId: session.id,
    connectedAt: new Date().toISOString(),
  }
  const state = readState()
  writeState({ ...state, connections: { ...state.connections, [session.user.id]: connection } })
  return connection
}

export const getWalletConnectionState = (): WalletConnection | null => {
  const session = getSessionState()
  if (!session) return null
  const connection = readState().connections[session.user.id]
  return connection?.sessionId === session.id ? connection : null
}

export const disconnectWalletState = (connectionId: string): boolean | null => {
  const session = getSessionState()
  if (!session) return null
  const state = readState()
  const connection = state.connections[session.user.id]
  if (!connection || connection.id !== connectionId) return false
  const connections = { ...state.connections }
  delete connections[session.user.id]
  writeState({ ...state, connections })
  return true
}

export const clearUserWalletConnectionState = (userId: string) => {
  const state = readState()
  if (!state.connections[userId]) return
  const connections = { ...state.connections }
  delete connections[userId]
  writeState({ ...state, connections })
}

export const createOrderState = (input: CreateOrderInput): OrderCreationResult => {
  const session = getSessionState()
  if (!session) return { unauthorized: true }

  const state = readState()
  const key = userAttemptKey(session.user.id, input.idempotencyKey)
  const payload = payloadForIdempotency(input)
  const previousAttempt = state.idempotency[key]
  if (previousAttempt) {
    if (previousAttempt.payload !== payload) {
      return {
        status: 409,
        error: {
          code: 'IDEMPOTENCY_CONFLICT',
          message: 'Esta chave de tentativa já foi usada com outros dados.',
        },
      }
    }
    const previousOrder = state.orders[session.user.id]?.find((order) => order.id === previousAttempt.orderId)
    if (previousOrder) return { order: previousOrder, created: false }
  }

  const errors = validateDraft(input.checkout)
  if (Object.keys(errors).length) {
    return {
      status: 422,
      error: { code: 'VALIDATION_ERROR', message: 'Revise os dados do pagamento.', fieldErrors: errors },
    }
  }

  const profile = getProfileState()
  const wallets = getWalletsState()
  const wallet = wallets?.find((candidate) => candidate.id === input.checkout.walletId)
  if (!profile || !wallet) return { unauthorized: true }
  if (wallet.network !== input.checkout.network || wallet.address !== input.checkout.walletAddress) {
    return {
      status: 409,
      error: { code: 'WALLET_CHANGED', message: 'A carteira selecionada foi alterada. Revise os dados.' },
    }
  }

  const connection = state.connections[session.user.id]
  if (
    !connection ||
    connection.id !== input.connectionId ||
    connection.sessionId !== session.id ||
    connection.walletId !== wallet.id ||
    connection.network !== input.checkout.network ||
    connection.provider !== input.checkout.walletType
  ) {
    return {
      status: 409,
      error: { code: 'WALLET_NOT_CONNECTED', message: 'Conecte a carteira antes de confirmar a compra.' },
    }
  }

  const currentCart = getCartState()
  if (!currentCart.items.length) {
    return {
      status: 409,
      error: { code: 'CART_EMPTY', message: 'Não há NFTs no carrinho para finalizar a compra.' },
    }
  }

  if (input.quoteRevision.couponCode && input.quoteRevision.couponCode !== 'KURIO10') {
    return {
      status: 422,
      error: {
        code: input.quoteRevision.couponCode === 'EXPIRADO' ? 'COUPON_EXPIRED' : 'COUPON_INVALID',
        message:
          input.quoteRevision.couponCode === 'EXPIRADO'
            ? 'Este cupom expirou.'
            : 'O cupom não é mais válido.',
      },
    }
  }

  const currentQuote = getCartQuoteState({
    couponCode: input.quoteRevision.couponCode,
  })
  if (!quoteMatches(input.quoteRevision, currentQuote)) {
    return {
      status: 409,
      error: {
        code: 'QUOTE_STALE',
        message: 'A cotação mudou. Revise os valores e confirme novamente.',
        quoteRevision: currentQuote,
      },
    }
  }
  if (!currentQuote.valid || !currentCart.items.every((item) => item.status === 'available')) {
    return {
      status: 409,
      error: { code: 'CART_CONFLICT', message: 'Revise a disponibilidade e a quantidade dos itens.' },
    }
  }

  const items = getItemsForDraft()
  if (!items) {
    return {
      status: 422,
      error: { code: 'INVALID_NFT_NETWORK', message: 'Um NFT possui uma rede inválida no carrinho.' },
    }
  }
  const reserved: OrderItemSnapshot[] = []
  for (const item of items) {
    if (!reserveNftEdition(item.nftId, item.editionId, item.quantity)) {
      reserved.forEach((previous) => releaseNftEdition(previous.nftId, previous.editionId, previous.quantity))
      return {
        status: 409,
        error: {
          code: 'EDITION_UNAVAILABLE',
          message: 'A disponibilidade mudou. Revise os itens antes de confirmar.',
          quoteRevision: getCartQuoteState({
            couponCode: input.quoteRevision.couponCode,
          }),
        },
      }
    }
    reserved.push(item)
  }

  const now = new Date().toISOString()
  const order: Order = {
    id: `order-${globalThis.crypto.randomUUID()}`,
    userId: session.user.id,
    status: 'pending',
    version: 1,
    createdAt: now,
    updatedAt: now,
    checkout: input.checkout,
    quote: currentQuote,
    items,
    paymentAttempt: {
      id: `payment-${globalThis.crypto.randomUUID()}`,
      idempotencyKey: input.idempotencyKey,
      provider: connection.provider,
      status: 'pending',
      startedAt: now,
      completedAt: null,
    },
    receipt: null,
    failureMessage: null,
  }
  writeState({
    ...state,
    orders: { ...state.orders, [session.user.id]: [...(state.orders[session.user.id] ?? []), order] },
    idempotency: { ...state.idempotency, [key]: { payload, orderId: order.id } },
  })
  return { order, created: true }
}

const createReceipt = (order: Order): Receipt => {
  const issuedAt = new Date().toISOString()
  const transactionHash = globalThis.crypto.randomUUID().replaceAll('-', '').padEnd(64, '0')
  return {
    transactionId: `0x${transactionHash.slice(0, 64)}`,
    explorerUrl: `https://explorer.kurio.example/${order.checkout.network.toLowerCase()}/tx/0x${transactionHash.slice(0, 64)}`,
    issuedAt,
    network: order.checkout.network,
    wallet: {
      walletId: order.checkout.walletId,
      walletAddress: order.checkout.walletAddress,
      walletType: order.checkout.walletType,
    },
    collector: {
      displayName: order.checkout.displayName,
      profileName: order.checkout.profileName,
      username: order.checkout.username,
      email: order.checkout.email,
      ensName: order.checkout.ensName,
      secondaryWalletAddress: order.checkout.secondaryWalletAddress,
      referralCode: order.checkout.referralCode,
      collectorNote: order.checkout.collectorNote,
    },
    items: order.items.map((item) => ({ ...item })),
    quote: { ...order.quote },
  }
}

export const transitionOrderState = (
  userId: string,
  orderId: string,
  status: Exclude<OrderStatus, 'pending'>,
): Order | null => {
  const state = readState()
  const orders = state.orders[userId] ?? []
  const current = orders.find((order) => order.id === orderId)
  if (!current || current.status !== 'pending') return current ?? null
  const updatedAt = new Date().toISOString()
  const order: Order = {
    ...current,
    status,
    version: current.version + 1,
    updatedAt,
    paymentAttempt: {
      ...current.paymentAttempt,
      status: status === 'confirmed' ? 'accepted' : 'declined',
      completedAt: updatedAt,
    },
    receipt: status === 'confirmed' ? createReceipt(current) : null,
    failureMessage: status === 'declined' ? 'O pagamento foi recusado pelo provedor simulado.' : null,
  }
  if (status === 'declined') {
    current.items.forEach((item) => releaseNftEdition(item.nftId, item.editionId, item.quantity))
  } else {
    removePurchasedCartItemsForUserState(userId, current.items)
  }
  writeState({
    ...state,
    orders: {
      ...state.orders,
      [userId]: orders.map((candidate) => (candidate.id === orderId ? order : candidate)),
    },
  })
  notifyOrder(order)
  return order
}

export const getOrderState = (orderId: string): Order | null => {
  const session = getSessionState()
  return session ? (readState().orders[session.user.id]?.find((order) => order.id === orderId) ?? null) : null
}

export const getOrderByAttemptState = (idempotencyKey: string): Order | null => {
  const session = getSessionState()
  if (!session) return null
  const state = readState()
  const record = state.idempotency[userAttemptKey(session.user.id, idempotencyKey)]
  return record ? (state.orders[session.user.id]?.find((order) => order.id === record.orderId) ?? null) : null
}

export const subscribeOrderState = (
  userId: string,
  orderId: string,
  listener: (event: OrderUpdatedEvent) => void,
): (() => void) => {
  const key = userOrderKey(userId, orderId)
  const listeners = subscribers.get(key) ?? new Set()
  listeners.add(listener)
  subscribers.set(key, listeners)
  return () => {
    listeners.delete(listener)
    if (listeners.size === 0) subscribers.delete(key)
  }
}

export const resetOrderState = () => {
  memoryState = { orders: {}, idempotency: {}, connections: {} }
  subscribers.clear()
  try {
    globalThis.localStorage?.removeItem(storageKey)
  } catch {
    // The deterministic in-memory state remains reset if storage is unavailable.
  }
}
