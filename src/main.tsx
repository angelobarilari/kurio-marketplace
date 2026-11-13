import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from '@tanstack/react-router'
import './index.css'
import { queryClient } from '@/lib/query-client'
import { setApiReadiness } from '@/lib/api-readiness'
import { router } from '@/router'

const enableMocks = async () => {
  if (import.meta.env.VITE_ENABLE_MOCKS !== 'true') return

  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
  })

  const { worker } = await import('@/mocks/browser')
  await worker.start({
    onUnhandledRequest: 'bypass',
    serviceWorker: { url: '/mockServiceWorker.js' },
  })
}

const startApplication = () => {
  const mocksReady = enableMocks()
  setApiReadiness(mocksReady)
  void mocksReady.catch((error: unknown) => console.error('Could not start the mock API worker.', error))
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </StrictMode>,
  )
}

startApplication()
