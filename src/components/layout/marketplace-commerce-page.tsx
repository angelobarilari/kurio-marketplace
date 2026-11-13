import type { ReactNode } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MarketplaceBreadcrumb } from '@/components/layout/marketplace-breadcrumb'
import { cn } from '@/lib/utils'

type MarketplaceCommercePageProps = {
  children: ReactNode
  currentPage: string
  mobileTitle: string
  backLabel: string
  onBack: () => void
  className?: string
}

export const MarketplaceCommercePage = ({
  children,
  currentPage,
  mobileTitle,
  backLabel,
  onBack,
  className,
}: MarketplaceCommercePageProps) => (
  <main
    className={cn(
      'py-12 max-[760px]:relative max-[760px]:left-1/2 max-[760px]:w-screen max-[760px]:-translate-x-1/2 max-[760px]:px-5 max-[760px]:pt-6 max-[760px]:pb-8',
      className,
    )}
  >
    <MarketplaceBreadcrumb className="mb-5 text-sm font-bold max-[760px]:hidden" currentPage={currentPage} />
    <div className="mb-8 hidden items-center gap-6 max-[760px]:flex">
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="size-10 shrink-0 rounded-full bg-(--color-panel)"
        aria-label={backLabel}
        onClick={onBack}
      >
        <ArrowLeft aria-hidden="true" />
      </Button>
      <h1 className="mb-0 text-xl font-bold">{mobileTitle}</h1>
    </div>
    <h1 className="sr-only max-[760px]:hidden">{currentPage}</h1>
    {children}
  </main>
)
