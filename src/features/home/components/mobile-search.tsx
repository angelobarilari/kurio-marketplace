import { Search, SlidersHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FieldLabel } from '@/components/ui/field-label'

type MobileSearchProps = {
  value: string
  filtersOpen: boolean
  onChange: (value: string) => void
  onToggleFilters: () => void
}

export const MobileSearch = ({ value, filtersOpen, onChange, onToggleFilters }: MobileSearchProps) => (
  <div className="hidden gap-2.5 py-7 max-[760px]:flex">
    <form
      className="flex h-14.5 min-w-0 flex-1 items-center gap-3 rounded-[14px] bg-(--color-panel) px-4 text-(--color-muted)"
      onSubmit={(event) => event.preventDefault()}
      role="search"
    >
      <Search aria-hidden="true" className="size-5.5 shrink-0" />
      <FieldLabel visuallyHidden htmlFor="mobile-search">
        Explorar coleções
      </FieldLabel>
      <Input
        id="mobile-search"
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Explorar coleções"
        className="h-auto min-w-0 border-0 bg-transparent px-0 text-[15px] shadow-none placeholder:opacity-100 focus-visible:ring-0"
      />
    </form>

    <Button
      type="button"
      className="size-14.5 rounded-[14px] bg-(--color-primary) p-0 text-background [&_svg]:size-6"
      aria-expanded={filtersOpen}
      aria-controls={filtersOpen ? 'mobile-filters' : undefined}
      aria-label={filtersOpen ? 'Fechar filtros' : 'Abrir filtros'}
      onClick={onToggleFilters}
    >
      <SlidersHorizontal aria-hidden="true" />
    </Button>
  </div>
)
