import { useNavigate, useSearch } from '@tanstack/react-router'
import type { CatalogSearch } from '@/features/catalog/types'

/**
 * Reads catalog search state from the URL and exposes scroll-preserving updates.
 *
 * Updating any catalog criterion resets the page to the first result page.
 *
 * @returns Current URL search state and its scroll-preserving update function.
 */
export const useCatalogSearch = () => {
  const search = useSearch({ from: '/' })
  const navigate = useNavigate({ from: '/' })

  const updateSearch = (next: Partial<CatalogSearch>) => {
    void navigate({
      search: (previous) => ({
        ...previous,
        ...next,
        page: next.page ?? 1,
      }),
      resetScroll: false,
    })
  }

  const clearSearch = () => {
    void navigate({
      search: {},
      resetScroll: false,
    })
  }

  return { search, updateSearch, clearSearch }
}
