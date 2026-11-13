import { catalogHttpHandlers } from '@/mocks/handlers/catalog-http'
import { catalogRealtimeHandler } from '@/mocks/handlers/catalog-realtime'
import { cartHttpHandlers } from '@/mocks/handlers/cart-http'
import { authHttpHandlers } from '@/mocks/handlers/auth-http'
import { accountHttpHandlers } from '@/mocks/handlers/account-http'
import { favoritesHttpHandlers } from '@/mocks/handlers/favorites-http'
import { orderHttpHandlers } from '@/mocks/handlers/order-http'

export const handlers = [
  ...catalogHttpHandlers,
  ...cartHttpHandlers,
  ...authHttpHandlers,
  ...accountHttpHandlers,
  ...favoritesHttpHandlers,
  ...orderHttpHandlers,
  catalogRealtimeHandler,
]
