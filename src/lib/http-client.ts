import axios from 'axios'
import { waitForApiReadiness } from '@/lib/api-readiness'

export const httpClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 8000,
})

httpClient.interceptors.request.use(async (config) => {
  await waitForApiReadiness()
  if (import.meta.env.VITE_ENABLE_MOCKS === 'true') {
    const scenario = globalThis.localStorage?.getItem('kurio:mock-scenario')
    if (scenario) config.headers.set('x-kurio-mock-scenario', scenario)
  }
  if (config.url?.startsWith('/cart')) {
    config.headers.set('x-kurio-cart-state', globalThis.localStorage?.getItem('kurio:visitor-cart') ?? '[]')
  }
  return config
})

httpClient.interceptors.response.use((response) => {
  if (response.config.url?.startsWith('/cart') && Array.isArray(response.data?.items)) {
    const isMutation = response.config.method !== 'get'
    const hasSnapshot = globalThis.localStorage?.getItem('kurio:visitor-cart') !== null
    if (response.data.owner?.kind === 'user') {
      globalThis.localStorage?.removeItem('kurio:visitor-cart')
    } else if (isMutation || !hasSnapshot) {
      globalThis.localStorage?.setItem('kurio:visitor-cart', JSON.stringify(response.data.items))
    }
  }
  if (response.config.url === '/cart/merge' && response.data?.cart?.owner?.kind === 'user') {
    globalThis.localStorage?.removeItem('kurio:visitor-cart')
    globalThis.localStorage?.removeItem('kurio:visitor-id')
  }
  if (response.config.url === '/mock/reset') {
    globalThis.localStorage?.removeItem('kurio:visitor-cart')
    globalThis.localStorage?.removeItem('kurio:visitor-id')
  }
  return response
})
