import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { hydrate } from '@tanstack/react-router/ssr/client'
import { RouterProvider } from '@tanstack/react-router'
import './index.css'
import { queryClient } from '@/lib/query-client'
import { setApiReadiness } from '@/lib/api-readiness'
import { createAppRouter, preloadAppRoute } from '@/router'

const router = createAppRouter()

const enableMocks = async () => {
  if (import.meta.env.VITE_ENABLE_MOCKS !== 'true') return

  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
  })

  const registration = await navigator.serviceWorker?.getRegistration('/')
  await registration?.update()

  const { worker } = await import('@/mocks/browser')
  await worker.start({
    onUnhandledRequest: 'bypass',
    serviceWorker: {
      url: '/mockServiceWorker.js',
      options: { updateViaCache: 'none' },
    },
  })
}

const startApplication = () => {
  const mocksReady = enableMocks()
  setApiReadiness(mocksReady)
  void mocksReady.catch((error: unknown) => console.error('Could not start the mock API worker.', error))
  const root = document.getElementById('root')
  if (!root) throw new Error('Application root element was not found.')
  const app = (
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </StrictMode>
  )

  const isMatchingPrerender =
    root.dataset.prerendered === 'true' &&
    window.location.search === '' &&
    (root.dataset.prerenderPath === window.location.pathname ||
      (root.dataset.prerenderPattern === 'order' && /^\/orders\/[^/]+$/.test(window.location.pathname)))

  if (isMatchingPrerender) {
    void Promise.all([preloadAppRoute(window.location.pathname), hydrate(router)])
      .then(() => hydrateRoot(root, app))
      .catch((error: unknown) => console.error('Could not hydrate the prerendered route.', error))
    return
  }

  root.replaceChildren()
  createRoot(root).render(app)
}

startApplication()
