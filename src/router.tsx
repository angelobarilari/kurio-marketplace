import {
  createRootRoute,
  createRoute,
  createRouter,
  lazyRouteComponent,
  Link,
  Outlet,
  stripSearchParams,
} from '@tanstack/react-router'
import { CatalogRealtimeSync } from '@/features/catalog/components/catalog-realtime-sync'
import type { AuthReturnTo } from '@/features/auth/types'
import type { CatalogSearch } from '@/features/catalog/types'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AuthFlowProvider } from '@/features/auth/components/auth-flow-provider'
import type { Network } from '@/types/account'

const HomePage = lazyRouteComponent(() => import('@/routes/home-page'), 'HomePage')
const NftDetailPage = lazyRouteComponent(() => import('@/routes/nft-detail-page'), 'NftDetailPage')
const CartPage = lazyRouteComponent(() => import('@/routes/cart-page'), 'CartPage')
const ProfilePage = lazyRouteComponent(() => import('@/routes/profile-page'), 'ProfilePage')
const WalletsPage = lazyRouteComponent(() => import('@/routes/wallets-page'), 'WalletsPage')
const FavoritesPage = lazyRouteComponent(() => import('@/routes/favorites-page'), 'FavoritesPage')
const CheckoutPage = lazyRouteComponent(() => import('@/routes/checkout-page'), 'CheckoutPage')
const OrderPage = lazyRouteComponent(() => import('@/routes/order-page'), 'OrderPage')
const LoginPage = lazyRouteComponent(() => import('@/routes/auth-page'), 'LoginPage')
const RegisterPage = lazyRouteComponent(() => import('@/routes/auth-page'), 'RegisterPage')

const rootRoute = createRootRoute({
  component: () => (
    <TooltipProvider>
      <AuthFlowProvider>
        <CatalogRealtimeSync />
        <Outlet />
      </AuthFlowProvider>
    </TooltipProvider>
  ),
  notFoundComponent: () => (
    <main className="mx-auto grid min-h-[70vh] w-[min(var(--content-width),calc(100%-48px))] place-content-center justify-items-center">
      <p className="mb-4.5 text-[13px] tracking-wider text-(--color-foreground)">
        404 — página não encontrada
      </p>
      <Link className="text-(--color-primary-bright)" to="/">
        Voltar ao início
      </Link>
    </main>
  ),
})

const validateCatalogSearch = (search: Record<string, unknown>): CatalogSearch => {
  const sort = search.sort
  const validSort =
    sort === 'newest' || sort === 'popular' || sort === 'price-asc' || sort === 'price-desc' ? sort : 'recent'

  return {
    q: typeof search.q === 'string' ? search.q : undefined,
    category: typeof search.category === 'string' ? search.category : undefined,
    network: typeof search.network === 'string' ? search.network : undefined,
    sort: validSort,
    minPriceEth:
      typeof search.minPriceEth === 'string' && /^\d+(?:\.\d{1,18})?$/.test(search.minPriceEth)
        ? search.minPriceEth
        : undefined,
    maxPriceEth:
      typeof search.maxPriceEth === 'string' && /^\d+(?:\.\d{1,18})?$/.test(search.maxPriceEth)
        ? search.maxPriceEth
        : undefined,
    page: typeof search.page === 'number' && search.page > 0 ? search.page : 1,
  }
}

const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  validateSearch: validateCatalogSearch,
  search: {
    middlewares: [stripSearchParams({ sort: 'recent', page: 1 })],
  },
  component: HomePage,
})

const nftDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/nfts/$nftId',
  component: NftDetailPage,
})

const cartRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/cart',
  component: CartPage,
})

const profileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/profile',
  component: ProfilePage,
})

const validateWalletsSearch = (search: Record<string, unknown>) => {
  const returnTo = search.returnTo === '/checkout' ? '/checkout' : undefined
  const network: Network | undefined =
    search.network === 'Ethereum' || search.network === 'Polygon' || search.network === 'Solana'
      ? search.network
      : undefined
  const couponCode =
    typeof search.couponCode === 'string' && /^[A-Za-z0-9-]{1,32}$/.test(search.couponCode)
      ? search.couponCode.toUpperCase()
      : undefined
  return {
    ...(returnTo ? { returnTo } : {}),
    ...(network ? { network } : {}),
    ...(couponCode ? { couponCode } : {}),
  }
}

const walletsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/profile/wallets',
  validateSearch: validateWalletsSearch,
  component: WalletsPage,
})

const favoritesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/profile/favorites',
  component: FavoritesPage,
})

const validateCheckoutSearch = (search: Record<string, unknown>) => {
  const couponCode =
    typeof search.couponCode === 'string' && /^[A-Za-z0-9-]{1,32}$/.test(search.couponCode)
      ? search.couponCode.toUpperCase()
      : undefined
  const network =
    search.network === 'Ethereum' || search.network === 'Polygon' || search.network === 'Solana'
      ? search.network
      : undefined

  return {
    ...(couponCode ? { couponCode } : {}),
    ...(network ? { network } : {}),
  }
}

const checkoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/checkout',
  validateSearch: validateCheckoutSearch,
  component: CheckoutPage,
})

const orderRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/orders/$orderId',
  component: OrderPage,
})

const validateAuthSearch = (
  search: Record<string, unknown>,
): { returnTo?: AuthReturnTo; couponCode?: string } => {
  const allowed: AuthReturnTo[] = [
    '/',
    '/cart',
    '/profile',
    '/profile/wallets',
    '/profile/favorites',
    '/checkout',
  ]
  const returnTo = typeof search.returnTo === 'string' ? search.returnTo : undefined
  return {
    returnTo:
      returnTo &&
      (allowed.includes(returnTo as AuthReturnTo) ||
        /^\/nfts\/[a-z0-9-]+$/.test(returnTo) ||
        /^\/orders\/order-[a-z0-9-]+$/.test(returnTo))
        ? (returnTo as AuthReturnTo)
        : undefined,
    couponCode:
      typeof search.couponCode === 'string' && /^[A-Za-z0-9-]{1,32}$/.test(search.couponCode)
        ? search.couponCode.toUpperCase()
        : undefined,
  }
}

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  validateSearch: validateAuthSearch,
  component: LoginPage,
})

const registerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/register',
  validateSearch: validateAuthSearch,
  component: RegisterPage,
})

const routeTree = rootRoute.addChildren([
  homeRoute,
  nftDetailRoute,
  cartRoute,
  checkoutRoute,
  orderRoute,
  profileRoute,
  walletsRoute,
  favoritesRoute,
  loginRoute,
  registerRoute,
])

export const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
