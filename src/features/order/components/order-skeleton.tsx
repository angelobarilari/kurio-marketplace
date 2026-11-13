import { Skeleton } from '@/components/ui/skeleton'

export const OrderSkeleton = () => (
  <div className="mx-auto max-w-3xl space-y-5 py-12">
    <Skeleton className="h-10 w-72" />
    <Skeleton className="h-72 w-full" />
    <Skeleton className="h-44 w-full" />
  </div>
)
