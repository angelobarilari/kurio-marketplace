import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { nftImages } from '@/assets'
import { MarketplaceShell } from '@/components/layout/marketplace-shell'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Pagination, PaginationContent, PaginationItem } from '@/components/ui/pagination'
import {
  catalogCategories,
  catalogNetworks,
  catalogSortOptions,
  catalogSortTabs,
} from '@/features/catalog/catalog-options'
import { CatalogFilters } from '@/features/catalog/components/catalog-filters'
import { NftCard } from '@/features/catalog/components/nft-card'
import { NftCardSkeleton } from '@/features/catalog/components/nft-card-skeleton'
import { useCatalogSearch } from '@/features/catalog/hooks/use-catalog-search'
import { useNftCatalog } from '@/features/catalog/hooks/use-nft-catalog'
import type { CatalogSearch } from '@/features/catalog/types'
import { HeroSection } from '@/features/home/components/hero-section'
import { HomeEditorial } from '@/features/home/components/home-editorial'
import { MobileBottomNav } from '@/features/home/components/mobile-bottom-nav'
import { MobileSearch } from '@/features/home/components/mobile-search'
import { ethToWei } from '@/lib/eth-to-wei'

const gridClass =
  'grid grid-cols-3 gap-x-5.5 gap-y-7 max-[1100px]:gap-x-3.5 max-[760px]:grid-cols-2 max-[760px]:gap-x-3.5 max-[760px]:gap-y-5.5 max-[390px]:gap-x-2.5'

export const HomePage = () => {
  const { search, updateSearch, clearSearch } = useCatalogSearch()
  const [filtersOpen, setFiltersOpen] = useState(false)
  const catalogSearch: CatalogSearch = { ...search, sort: search.sort ?? 'recent', page: search.page ?? 1 }
  const invalidRange = Boolean(
    catalogSearch.minPriceEth &&
    catalogSearch.maxPriceEth &&
    ethToWei(catalogSearch.minPriceEth) > ethToWei(catalogSearch.maxPriceEth),
  )
  const query = useNftCatalog(catalogSearch, !invalidRange)
  const categories = catalogCategories.map((item) => ({
    ...item,
    count: query.data?.facets.categories.find((facet) => facet.id === item.id)?.count,
  }))
  const networks = catalogNetworks.map((name) => ({
    name,
    count: query.data?.facets.networks.find((facet) => facet.name === name)?.count,
  }))
  const page = search.page ?? 1
  const hasFilters = Boolean(
    search.q ||
    search.category ||
    search.network ||
    search.minPriceEth ||
    search.maxPriceEth ||
    (search.sort && search.sort !== 'recent'),
  )
  const pages = query.data
    ? Array.from({ length: Math.min(4, query.data.totalPages) }, (_, index) =>
        Math.min(Math.max(1, Math.min(page - 2, query.data.totalPages - 3)) + index, query.data.totalPages),
      )
    : []

  return (
    <MarketplaceShell
      searchValue={search.q ?? ''}
      onSearchChange={(q) => updateSearch({ q: q || undefined })}
    >
      <main className="max-[760px]:pb-[calc(105px+env(safe-area-inset-bottom))]">
        <MobileSearch
          value={search.q ?? ''}
          filtersOpen={filtersOpen}
          onChange={(q) => updateSearch({ q: q || undefined })}
          onToggleFilters={() => setFiltersOpen((open) => !open)}
        />
        <HeroSection />

        <section
          className="grid grid-cols-[300px_minmax(0,1fr)] items-start gap-9 max-[1100px]:grid-cols-[230px_minmax(0,1fr)] max-[1100px]:gap-6 max-[760px]:mt-5 max-[760px]:block"
          id="catalog"
          aria-label="Catálogo de NFTs"
        >
          <CatalogFilters
            search={search}
            categories={categories}
            networks={networks}
            priceFilterKey={[search.minPriceEth ?? '', search.maxPriceEth ?? ''].join(':')}
            hasInvalidPriceRange={invalidRange}
            hasActiveFilters={hasFilters}
            mobileOpen={filtersOpen}
            onCloseMobile={() => setFiltersOpen(false)}
            onUpdate={updateSearch}
            onClear={clearSearch}
          />
          <div className="col-start-2 row-span-2 row-start-1 min-w-0">
            <h2 className="sr-only">NFTs disponíveis</h2>

            <div className="mb-4 flex min-h-11 items-start justify-between gap-4 border-b border-(--color-border) max-[760px]:mb-3 max-[760px]:block max-[760px]:overflow-hidden max-[760px]:border-0">
              <ToggleGroup
                type="single"
                value={search.sort ?? 'recent'}
                onValueChange={(value) => value && updateSearch({ sort: value as CatalogSearch['sort'] })}
                className="gap-5.5 max-[1100px]:gap-3 max-[760px]:w-full max-[760px]:scrollbar-none max-[760px]:gap-4.5 max-[760px]:overflow-x-auto"
                aria-label="Ordenar destaques"
              >
                {catalogSortTabs.map((tab) => (
                  <ToggleGroupItem
                    key={tab.label}
                    value={tab.value}
                    className="min-h-9.5 cursor-pointer rounded-none border-0 border-b-2 border-transparent bg-transparent px-0.5 text-[13px] whitespace-nowrap text-(--color-foreground) data-[state=on]:border-(--color-primary) data-[state=on]:text-(--color-primary-bright) max-[760px]:text-sm"
                  >
                    {tab.label}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>

              <div className="flex items-center gap-1.5 text-xs whitespace-nowrap text-(--color-muted) max-[760px]:hidden">
                <span>Ordenar por:</span>
                <Select
                  value={search.sort ?? 'recent'}
                  onValueChange={(value) => updateSearch({ sort: value as CatalogSearch['sort'] })}
                >
                  <SelectTrigger className="h-8 border-0 px-2 text-xs" aria-label="Ordenar por">
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent>
                    {catalogSortOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {invalidRange ? (
              <div className="grid min-h-75 place-content-center text-center" role="alert">
                <h2 data-testid="invalid-price-range">Faixa de preço inválida</h2>
                <p>O preço mínimo não pode superar o máximo.</p>
              </div>
            ) : query.isPending || (query.isFetching && query.isPlaceholderData) ? (
              <div className={gridClass} role="status" aria-label="Carregando NFTs" aria-busy="true">
                {Array.from({ length: 9 }, (_, index) => (
                  <NftCardSkeleton key={index} />
                ))}
              </div>
            ) : query.isError ? (
              <div className="grid min-h-75 place-content-center justify-items-center">
                <h2>Não foi possível carregar o catálogo</h2>
                <Button onClick={() => void query.refetch()}>Tentar novamente</Button>
              </div>
            ) : query.data.items.length === 0 ? (
              <div className="grid min-h-75 place-content-center justify-items-center">
                <h2>Nenhum NFT encontrado</h2>
                <Button variant="outline" onClick={clearSearch}>
                  Limpar filtros
                </Button>
              </div>
            ) : (
              <div className={gridClass}>
                {query.data.items.map((nft, index) => (
                  <NftCard key={nft.id} nft={nft} priority={index < 2} />
                ))}
              </div>
            )}

            {!invalidRange && query.data && query.data.totalItems > 0 && (
              <Pagination
                className="mt-7 justify-end max-[760px]:mt-13.5"
                aria-label="Paginação do catálogo"
                aria-busy={query.isFetching}
              >
                <PaginationContent className="gap-1.5 [&_button]:min-w-8 [&_button[data-variant=default]]:border-(--color-primary) [&_button[data-variant=default]]:bg-(--color-primary) [&_button[data-variant=default]]:text-primary-foreground! [&_button[data-variant=default]:hover]:bg-(--color-primary-bright)">
                  <PaginationItem>
                    <Button
                      variant="outline"
                      aria-label="Página anterior"
                      disabled={query.isFetching || page <= 1}
                      onClick={() => updateSearch({ page: page - 1 })}
                    >
                      <ChevronLeft />
                    </Button>
                  </PaginationItem>

                  {pages.map((item) => (
                    <PaginationItem key={item}>
                      <Button
                        variant={item === page ? 'default' : 'outline'}
                        aria-current={item === page ? 'page' : undefined}
                        aria-label={`Página ${item}`}
                        disabled={query.isFetching}
                        onClick={() => updateSearch({ page: item })}
                      >
                        {item}
                      </Button>
                    </PaginationItem>
                  ))}

                  <PaginationItem>
                    <Button
                      variant="outline"
                      aria-label="Próxima página"
                      disabled={query.isFetching || page >= query.data.totalPages}
                      onClick={() => updateSearch({ page: page + 1 })}
                    >
                      <ChevronRight />
                    </Button>
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </div>

          <aside className="col-start-1 row-start-2 bg-(--color-panel) px-4.5 py-5.5 max-[760px]:hidden">
            <p className="mb-2 text-center font-bold text-(--color-primary-bright) uppercase">
              NFT em destaque
            </p>
            <h2 className="text-center text-[13px] uppercase">Oferta limitada</h2>
            <img
              className="aspect-[0.82] w-full rounded-[10px] object-cover"
              src={nftImages.sageNomad}
              alt="Sage Nomad, NFT da coleção Kurio Apes"
            />
            <p className="mt-3.5">
              Sage Nomad <span className="text-(--color-muted)">#009</span>
            </p>
            <p className="font-bold text-(--color-primary-bright)">1.69 ETH</p>
          </aside>
        </section>

        <HomeEditorial />
      </main>

      <MobileBottomNav hidden={filtersOpen} />
    </MarketplaceShell>
  )
}
