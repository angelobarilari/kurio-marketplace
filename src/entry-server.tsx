import { StrictMode } from 'react'
import { renderToReadableStream } from 'react-dom/server'
import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from '@tanstack/react-router'
import { attachRouterServerSsrUtils, transformHtmlStringWithRouter } from '@tanstack/react-router/ssr/server'
import { createQueryClient } from '@/lib/query-client'
import { createAppRouter, preloadAppRoute } from '@/router'

export type PrerenderRoute = {
  path: string
  outputPath?: string
  pattern?: 'order'
}

const isMockCatalogEnabled = import.meta.env.VITE_ENABLE_MOCKS === 'true'

export const getPrerenderRoutes = async (): Promise<PrerenderRoute[]> => {
  const nftRoutes = isMockCatalogEnabled
    ? (await import('@/mocks/fixtures/catalog')).createNfts().map(({ id }) => ({ path: `/nfts/${id}` }))
    : []
  const fixedRoutes = [
    '/cart',
    '/checkout',
    '/login',
    '/register',
    '/profile',
    '/profile/wallets',
    '/profile/favorites',
  ].map((path) => ({ path }))

  return [
    ...(isMockCatalogEnabled ? [{ path: '/' }] : []),
    ...fixedRoutes,
    ...nftRoutes,
    { path: '/orders/order-prerender', outputPath: 'orders.html', pattern: 'order' },
  ]
}

const preloadRouteDependencies = (path: string) => {
  const shared = [
    import('@/components/layout/desktop-marketplace-header'),
    import('@/components/layout/site-footer'),
  ]
  const home = [
    import('@/features/home/components/home-editorial'),
    import('@/features/catalog/components/catalog-filters'),
    import('@/features/catalog/components/desktop-catalog-sort'),
  ]

  return Promise.all([preloadAppRoute(path), ...shared, ...(path === '/' ? home : [])])
}

export const renderPrerenderRoute = async (indexHtml: string, route: PrerenderRoute): Promise<string> => {
  const router = createAppRouter(route.path)
  attachRouterServerSsrUtils({ router, manifest: undefined })
  await Promise.all([router.load(), preloadRouteDependencies(route.path)])
  await router.serverSsr?.dehydrate()
  const queryClient = createQueryClient()
  const errors: unknown[] = []
  const stream = await renderToReadableStream(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </StrictMode>,
    {
      onError: (error) => {
        errors.push(error)
      },
    },
  )
  await stream.allReady
  if (errors.length > 0) throw errors[0]
  const markup = await new Response(stream).text()

  const emptyRoot = '<div id="root"></div>'
  if (!indexHtml.includes(emptyRoot)) {
    throw new Error('Could not find the empty application root in the production HTML.')
  }
  const expectedPath = JSON.stringify(route.path)
  const pattern = JSON.stringify(route.pattern ?? null)
  const guard = `<script>(()=>{const path=${expectedPath};const pattern=${pattern};const matches=pattern==="order"?/^\\/orders\\/[^/]+$/.test(location.pathname):location.pathname===path;if(!matches||location.search!==""){const root=document.getElementById("root");root.replaceChildren();root.removeAttribute("data-prerendered");root.removeAttribute("data-prerender-path");root.removeAttribute("data-prerender-pattern")}})()</script>`
  const rootAttributes = [
    'data-prerendered="true"',
    `data-prerender-path="${route.path}"`,
    ...(route.pattern ? [`data-prerender-pattern="${route.pattern}"`] : []),
  ].join(' ')
  const documentHtml = indexHtml.replace(
    emptyRoot,
    `<div id="root" ${rootAttributes}>${markup}</div>${guard}`,
  )
  return transformHtmlStringWithRouter(router, documentHtml.replace(/^<!doctype html>\s*/i, ''))
}
