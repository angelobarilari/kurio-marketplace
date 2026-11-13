import { RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet'
import { catalogNetworks, catalogSortOptions } from '@/features/catalog/catalog-options'
import { PriceFilter } from '@/features/catalog/components/price-filter'
import type { CatalogSearch } from '@/features/catalog/types'

type CategoryFilter = { id: string; label: string; count?: number }
type NetworkFilter = { name: string; count?: number }
type CatalogFiltersProps = {
  search: CatalogSearch
  categories: CategoryFilter[]
  networks: NetworkFilter[]
  priceFilterKey: string
  hasInvalidPriceRange: boolean
  hasActiveFilters: boolean
  mobileOpen: boolean
  onCloseMobile: () => void
  onUpdate: (next: Partial<CatalogSearch>) => void
  onClear: () => void
}

const ClearFiltersButton = ({ onClear }: { onClear: () => void }) => (
  <Button type="button" variant="outline" className="mt-6 w-full gap-2 [&_svg]:size-3.75" onClick={onClear}>
    <RotateCcw aria-hidden="true" /> Limpar filtros
  </Button>
)

export const CatalogFilters = ({
  search,
  categories,
  networks,
  priceFilterKey,
  hasInvalidPriceRange,
  hasActiveFilters,
  mobileOpen,
  onCloseMobile,
  onUpdate,
  onClear,
}: CatalogFiltersProps) => (
  <>
    <aside
      className="col-start-1 row-start-1 bg-(--color-panel) px-4.5 py-5.5 max-[760px]:hidden"
      aria-label="Filtros do catálogo"
    >
      <div>
        <h2 className="mb-3.5 text-[15px] text-(--color-foreground)">Coleções</h2>
        <ToggleGroup
          type="single"
          value={search.category ?? ''}
          onValueChange={(value) => onUpdate({ category: value || undefined })}
          className="grid gap-1.25"
          aria-label="Coleções"
        >
          {categories.map((category) => (
            <ToggleGroupItem
              key={category.id}
              value={category.id}
              className="w-full cursor-pointer justify-between px-2 py-1.5 text-left text-[13px] text-[#E89B55]"
            >
              <span>{category.label}</span>
              <span>{category.count === undefined ? '-' : `(${category.count})`}</span>
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>
      <div className="mt-7.5">
        <h2 className="mb-3.5 text-[15px] text-(--color-foreground)">Faixa de preço</h2>
        <PriceFilter
          key={priceFilterKey}
          idPrefix="desktop-price"
          minPriceEth={search.minPriceEth}
          maxPriceEth={search.maxPriceEth}
          hasInvalidRange={hasInvalidPriceRange}
          onApply={(minPriceEth, maxPriceEth) => onUpdate({ minPriceEth, maxPriceEth })}
        />
      </div>
      <div className="mt-7.5">
        <h2 className="mb-3.5 text-[15px] text-(--color-foreground)">Rede</h2>
        <ToggleGroup
          type="single"
          value={search.network ?? ''}
          onValueChange={(value) => onUpdate({ network: value || undefined })}
          className="grid gap-1.25"
          aria-label="Rede"
        >
          {networks.map((network) => (
            <ToggleGroupItem
              key={network.name}
              value={network.name}
              className="w-full cursor-pointer justify-between px-2 py-1.5 text-left text-[13px] text-[#E89B55]"
            >
              <span>{network.name}</span>
              <span>{network.count === undefined ? '-' : `(${network.count})`}</span>
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>
      {hasActiveFilters && <ClearFiltersButton onClear={onClear} />}
    </aside>

    <Sheet
      open={mobileOpen}
      onOpenChange={(open) => {
        if (!open) onCloseMobile()
      }}
    >
      <SheetContent
        side="bottom"
        id="mobile-filters"
        className="pb-[calc(24px+env(safe-area-inset-bottom))] min-[761px]:hidden"
      >
        <SheetTitle>Filtrar por coleção</SheetTitle>
        <SheetDescription className="sr-only">
          Escolha categorias, faixa de preço, ordenação e rede.
        </SheetDescription>
        <ToggleGroup
          type="single"
          value={search.category ?? ''}
          onValueChange={(value) => onUpdate({ category: value || undefined })}
          className="my-3.5 flex-wrap gap-2"
          aria-label="Coleções mobile"
        >
          {categories.map((category) => (
            <ToggleGroupItem
              key={category.id}
              value={category.id}
              className="rounded-full border border-(--color-border) px-2.5 py-1.75 text-[11px] text-(--color-muted) data-[state=on]:border-(--color-primary) data-[state=on]:bg-(--color-primary) data-[state=on]:text-background"
            >
              {category.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <div className="my-3.5">
          <h3 className="mb-2 text-xs font-normal text-(--color-muted)">Faixa de preço</h3>
          <PriceFilter
            key={priceFilterKey}
            idPrefix="mobile-price"
            minPriceEth={search.minPriceEth}
            maxPriceEth={search.maxPriceEth}
            hasInvalidRange={hasInvalidPriceRange}
            onApply={(minPriceEth, maxPriceEth) => onUpdate({ minPriceEth, maxPriceEth })}
          />
        </div>
        <div className="flex items-center justify-between text-xs text-(--color-muted)">
          <span>Ordenar por</span>
          <Select
            value={search.sort ?? 'recent'}
            onValueChange={(value) => onUpdate({ sort: value as CatalogSearch['sort'] })}
          >
            <SelectTrigger className="max-w-52.5 text-xs" aria-label="Ordenar por">
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
        <div className="mt-2 flex items-center justify-between text-xs text-(--color-muted)">
          <span>Rede</span>
          <Select
            value={search.network ?? 'all'}
            onValueChange={(value) => onUpdate({ network: value === 'all' ? undefined : value })}
          >
            <SelectTrigger className="max-w-52.5 text-xs" aria-label="Rede">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as redes</SelectItem>
              {catalogNetworks.map((network) => (
                <SelectItem key={network} value={network}>
                  {network}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {hasActiveFilters && <ClearFiltersButton onClear={onClear} />}
      </SheetContent>
    </Sheet>
  </>
)
