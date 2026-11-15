import { useSyncExternalStore } from 'react'

export const useMediaQuery = (query: string) =>
  useSyncExternalStore(
    (onStoreChange) => {
      const mediaQuery = window.matchMedia(query)
      mediaQuery.addEventListener('change', onStoreChange)
      return () => mediaQuery.removeEventListener('change', onStoreChange)
    },
    () => window.matchMedia(query).matches,
    () => false,
  )
