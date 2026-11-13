import { delay, http, HttpResponse } from 'msw'
import { sortNfts } from '@/features/catalog/utils/sort-nfts'
import { ethToWei } from '@/lib/eth-to-wei'
import { getCatalogNfts, getNftDetailState, resetCatalog } from '@/mocks/state/catalog-store'
import { catalogCategories, catalogNetworks } from '@/features/catalog/catalog-options'
import { resetCart } from '@/mocks/state/cart-store'
import { resetAccountState } from '@/mocks/state/account-store'
import { resetOrderState } from '@/mocks/state/order-store'
import type { CatalogSort } from '@/features/catalog/types'

const pageSize = 9
const validSorts: CatalogSort[] = ['recent', 'newest', 'popular', 'price-asc', 'price-desc']
const isEthAmount = (value: string): boolean => /^\d+(?:\.\d{1,18})?$/.test(value)
const getScenario = (request: Request): string => request.headers.get('x-kurio-mock-scenario') ?? 'default'

export const catalogHttpHandlers = [
  http.get('/api/nfts', async ({ request }) => {
    const scenario = getScenario(request)
    const url = new URL(request.url)
    const network = url.searchParams.get('network')
    const query = url.searchParams.get('q')?.trim().toLocaleLowerCase('pt-BR') ?? ''
    const category = url.searchParams.get('category')
    const minPriceEth = url.searchParams.get('minPriceEth')
    const maxPriceEth = url.searchParams.get('maxPriceEth')
    const hasFilters = Boolean(network || query || category || minPriceEth || maxPriceEth)
    const requestedPage = Number(url.searchParams.get('page') ?? 1)
    const responseDelay =
      scenario === 'catalog-out-of-order'
        ? network === 'Ethereum'
          ? 900
          : network === 'Polygon'
            ? 600
            : network === 'Solana'
              ? 100
              : 240
        : scenario === 'catalog-slow'
          ? 1500
          : hasFilters || requestedPage > 1
            ? 240
            : 0
    await delay(responseDelay)

    if (scenario === 'catalog-error') {
      return HttpResponse.json({ code: 'CATALOG_UNAVAILABLE' }, { status: 503 })
    }

    const requestedSort = url.searchParams.get('sort')
    const sort = validSorts.includes(requestedSort as CatalogSort) ? (requestedSort as CatalogSort) : 'recent'
    const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1
    const nfts = getCatalogNfts()

    if (
      (minPriceEth && !isEthAmount(minPriceEth)) ||
      (maxPriceEth && !isEthAmount(maxPriceEth)) ||
      (minPriceEth && maxPriceEth && ethToWei(minPriceEth) > ethToWei(maxPriceEth))
    ) {
      return HttpResponse.json({ code: 'INVALID_PRICE_RANGE' }, { status: 400 })
    }

    const matchesFilters = (nft: (typeof nfts)[number], excludedFilter?: 'category' | 'network'): boolean => {
      const matchesQuery =
        query.length === 0 ||
        `${nft.name} ${nft.tokenId} ${nft.collection}`.toLocaleLowerCase('pt-BR').includes(query)
      const matchesCategory = excludedFilter === 'category' || !category || nft.category === category
      const matchesNetwork = excludedFilter === 'network' || !network || nft.network === network
      const price = ethToWei(nft.priceEth)
      const matchesMinPrice = !minPriceEth || price >= ethToWei(minPriceEth)
      const matchesMaxPrice = !maxPriceEth || price <= ethToWei(maxPriceEth)
      return matchesQuery && matchesCategory && matchesNetwork && matchesMinPrice && matchesMaxPrice
    }
    const filtered = scenario === 'catalog-empty' ? [] : nfts.filter((nft) => matchesFilters(nft))
    const facets = {
      categories: catalogCategories.map((item) => ({
        ...item,
        count: nfts.filter((nft) => nft.category === item.id && matchesFilters(nft, 'category')).length,
      })),
      networks: catalogNetworks.map((name) => ({
        name,
        count: nfts.filter((nft) => nft.network === name && matchesFilters(nft, 'network')).length,
      })),
    }
    const sorted = sortNfts(filtered, sort)
    const start = (page - 1) * pageSize

    return HttpResponse.json({
      items: sorted.slice(start, start + pageSize),
      page,
      pageSize,
      totalItems: sorted.length,
      totalPages: Math.max(1, Math.ceil(sorted.length / pageSize)),
      facets,
    })
  }),

  http.get('/api/nfts/:id', async ({ params, request }) => {
    await delay(0)
    const scenario = getScenario(request)
    if (scenario === 'detail-error') {
      return HttpResponse.json({ code: 'NFT_DETAIL_UNAVAILABLE' }, { status: 503 })
    }
    const nft = getCatalogNfts().find((item) => item.id === params.id)
    if (!nft) {
      return HttpResponse.json({ code: 'NFT_NOT_FOUND' }, { status: 404 })
    }
    const detail = getNftDetailState(nft.id)
    if (!detail) {
      return HttpResponse.json({ code: 'NFT_NOT_FOUND' }, { status: 404 })
    }
    if (scenario === 'nft-unavailable') {
      return HttpResponse.json({
        ...detail,
        available: false,
        editions: detail.editions.map((edition) => ({ ...edition, availableQuantity: 0 })),
      })
    }
    if (scenario === 'editions-sold-out') {
      return HttpResponse.json({
        ...detail,
        available: true,
        editions: detail.editions.map((edition) => ({ ...edition, availableQuantity: 0 })),
      })
    }
    return HttpResponse.json(detail)
  }),

  http.post('/api/mock/reset', () => {
    resetCatalog()
    resetCart()
    resetAccountState()
    resetOrderState()
    return new HttpResponse(null, { status: 204 })
  }),
]
