import { delay, http, HttpResponse } from 'msw'
import { getCatalogNfts } from '@/mocks/state/catalog-store'
import { addFavoriteState, getFavoriteNftIdsState, removeFavoriteState } from '@/mocks/state/account-store'

const unauthorized = () =>
  HttpResponse.json({ code: 'AUTH_REQUIRED', message: 'Entre para continuar.' }, { status: 401 })

const serializeFavorites = (nftIds: string[]) => ({
  nftIds,
  items: nftIds.flatMap((id) => {
    const nft = getCatalogNfts().find((item) => item.id === id)
    return nft ? [nft] : []
  }),
})

const getScenario = (request: Request) => request.headers.get('x-kurio-mock-scenario') ?? 'default'

export const favoritesHttpHandlers = [
  http.get('/api/favorites', async () => {
    await delay(120)
    const nftIds = getFavoriteNftIdsState()
    return nftIds ? HttpResponse.json(serializeFavorites(nftIds)) : unauthorized()
  }),

  http.put('/api/favorites/:nftId', async ({ params, request }) => {
    await delay(160)
    if (getScenario(request) === 'favorite-error') {
      return HttpResponse.json(
        { code: 'SERVICE_UNAVAILABLE', message: 'Não foi possível atualizar os favoritos.' },
        { status: 503 },
      )
    }
    const nftId = String(params.nftId)
    if (!getCatalogNfts().some((nft) => nft.id === nftId)) {
      return HttpResponse.json(
        { code: 'RESOURCE_NOT_FOUND', message: 'NFT não encontrado.' },
        { status: 404 },
      )
    }
    const nftIds = addFavoriteState(nftId)
    return nftIds ? HttpResponse.json(serializeFavorites(nftIds)) : unauthorized()
  }),

  http.delete('/api/favorites/:nftId', async ({ params, request }) => {
    await delay(160)
    if (getScenario(request) === 'favorite-error') {
      return HttpResponse.json(
        { code: 'SERVICE_UNAVAILABLE', message: 'Não foi possível atualizar os favoritos.' },
        { status: 503 },
      )
    }
    const nftIds = removeFavoriteState(String(params.nftId))
    return nftIds ? HttpResponse.json(serializeFavorites(nftIds)) : unauthorized()
  }),
]
