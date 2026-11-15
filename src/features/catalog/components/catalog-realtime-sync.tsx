import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { Socket } from 'socket.io-client'
import type { NftUpdatedEvent } from '@/types/nft'
import { applyNftUpdate as updateNftCache } from '@/features/catalog/utils/apply-nft-update'
import { waitForApiReadiness } from '@/lib/api-readiness'

export const CatalogRealtimeSync = () => {
  const queryClient = useQueryClient()

  useEffect(() => {
    const configuredSocketUrl = import.meta.env.VITE_SOCKET_URL
    if (!configuredSocketUrl) return
    const socketUrl = configuredSocketUrl === 'same-origin' ? globalThis.location.origin : configuredSocketUrl

    let socket: Socket | undefined
    let disposed = false
    const latestEvents = new Map<string, NftUpdatedEvent>()

    const applyNftUpdate = (event: NftUpdatedEvent) => {
      updateNftCache(queryClient, event)
    }

    const handleNftUpdate = (event: NftUpdatedEvent) => {
      if ((latestEvents.get(event.id)?.version ?? -1) >= event.version) return
      latestEvents.set(event.id, event)
      applyNftUpdate(event)
      void queryClient.invalidateQueries({ queryKey: ['cart'] })
    }

    // A REST snapshot may finish after a newer socket event, including before
    // the first cache entry exists. Reapply only newer versions after that fetch.
    const unsubscribeCache = queryClient.getQueryCache().subscribe((event) => {
      if (
        event.type === 'updated' &&
        event.query.queryKey[0] === 'nfts' &&
        event.action.type === 'success' &&
        !event.action.manual
      ) {
        latestEvents.forEach(applyNftUpdate)
      }
    })

    void waitForApiReadiness()
      .then(() => import('socket.io-client'))
      .then(({ io }) => {
        if (disposed) return
        socket = io(socketUrl, {
          path: '/socket.io/',
          transports: ['websocket'],
          reconnection: true,
        })

        let hasConnected = false
        socket.on('connect', () => {
          if (hasConnected) {
            void queryClient.invalidateQueries({
              predicate: (query) => query.queryKey[0] === 'nfts' && query.getObserversCount() > 0,
            })
          }
          hasConnected = true
          socket?.emit('catalog.subscribe')
        })
        socket.on('nft.updated', handleNftUpdate)
      })
      .catch((error: unknown) => console.error('Could not initialize catalog realtime updates.', error))

    return () => {
      disposed = true
      unsubscribeCache()
      latestEvents.clear()
      socket?.removeAllListeners()
      socket?.disconnect()
    }
  }, [queryClient])

  return null
}
