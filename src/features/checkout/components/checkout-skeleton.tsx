import { Skeleton } from '@/components/ui/skeleton'

export const CheckoutSkeleton = () => (
  <div className="grid grid-cols-[minmax(0,1.3fr)_minmax(300px,0.7fr)] gap-10 py-10 max-[900px]:grid-cols-1">
    <div className="space-y-5">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-56 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
    <Skeleton className="h-115 w-full" />
  </div>
)
