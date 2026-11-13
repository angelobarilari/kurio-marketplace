import { Skeleton } from '@/components/ui/skeleton'

export const CartSkeleton = () => (
  <main className="py-14" aria-label="Carregando carrinho">
    <Skeleton className="mb-8 h-7 w-72" />
    <div className="grid grid-cols-[minmax(0,1fr)_330px] gap-16 max-[900px]:grid-cols-1">
      <div className="space-y-4">
        {Array.from({ length: 3 }, (_, index) => (
          <Skeleton key={index} className="h-36 w-full rounded-md max-[760px]:h-44" />
        ))}
      </div>
      <Skeleton className="h-96 w-full rounded-md" />
    </div>
  </main>
)
