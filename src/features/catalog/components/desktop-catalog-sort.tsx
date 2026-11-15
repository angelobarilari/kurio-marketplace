import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { catalogSortOptions } from '@/features/catalog/catalog-options'

type DesktopCatalogSortProps = {
  value: string
  onValueChange: (value: string) => void
}

export const DesktopCatalogSort = ({ value, onValueChange }: DesktopCatalogSortProps) => (
  <div className="flex items-center gap-1.5 text-xs whitespace-nowrap text-(--color-muted) max-[760px]:hidden">
    <span>Ordenar por:</span>
    <Select value={value} onValueChange={onValueChange}>
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
)
