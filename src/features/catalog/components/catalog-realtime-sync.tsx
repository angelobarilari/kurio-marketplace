import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { Socket } from 'socket.io-client'
import type { NftListResponse } from '@/features/catalog/types'
import type { NftDetail, NftUpdatedEvent } from '@/types/nft'
import { waitForApiReadiness } from '@/lib/api-readiness'

export const CatalogRealtimeSync = () => {
  const queryClient = useQueryClient()

  useEffect(() => {
    const configuredSocketUrl = import.meta.env.VITE_SOCKET_URL
    if (!configuredSocketUrl) return
    const socketUrl = configuredSocketUrl === 'same-origin' ? globalThis.location.origin : configuredSocketUrl

    let socket: Socket | undefined
    let disposed = false

    const handleNftUpdate = (event: NftUpdatedEvent) => {
      queryClient.setQueriesData<NftListResponse>(
        { predicate: (query) => query.queryKey[0] === 'nfts' && query.queryKey.length === 2 },
        (current) => {
          if (!current) return current
          const item = current.items.find((nft) => nft.id === event.id)
          if (!item || item.version >= event.version) return current

          return {
            ...current,
            items: current.items.map((nft) =>
              nft.id === event.id
                ? {
                    ...nft,
                    version: event.version,
                    priceEth: event.priceEth,
                    available: event.available,
                  }
                : nft,
            ),
          }
        },
      )

      queryClient.setQueryData<NftDetail>(['nfts', 'detail', event.id], (current) => {
        if (!current || current.version >= event.version) return current

        return {
          ...current,
          version: event.version,
          priceEth: event.priceEth,
          available: event.available,
          editions: current.editions.map((edition) =>
            edition.id === 'default' ? { ...edition, priceEth: event.priceEth } : edition,
          ),
        }
      })

      void queryClient.invalidateQueries({ queryKey: ['cart'] })
    }

    void waitForApiReadiness()
      .then(() => import('socket.io-client'))
      .then(({ io }) => {
        if (disposed) return
        socket = io(socketUrl, {
          path: '/socket.io/',
          transports: ['websocket'],
          reconnection: true,
        })

        socket.on('connect', () => {
          void queryClient.invalidateQueries({
            predicate: (query) => query.queryKey[0] === 'nfts' && query.getObserversCount() > 0,
          })
          socket?.emit('catalog.subscribe')
        })
        socket.on('nft.updated', handleNftUpdate)
      })
      .catch((error: unknown) => console.error('Could not initialize catalog realtime updates.', error))

    return () => {
      disposed = true
      socket?.removeAllListeners()
      socket?.disconnect()
    }
  }, [queryClient])

  return null
}
