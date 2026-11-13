import { Skeleton } from '@/components/ui/skeleton'

export const NftCardSkeleton = () => (
  <article className="grid min-w-0 gap-2.5" aria-hidden="true">
    <Skeleton className="aspect-square w-full animate-[shimmer_1.6s_infinite] rounded-[10px] bg-(--color-panel-raised) bg-[linear-gradient(90deg,transparent,var(--color-shimmer),transparent)] bg-size-[200%_100%] max-[760px]:rounded-[22px]" />
    <Skeleton className="h-3 w-[72%] animate-[shimmer_1.6s_infinite] rounded-xs bg-(--color-panel-raised) bg-[linear-gradient(90deg,transparent,var(--color-shimmer),transparent)] bg-size-[200%_100%]" />
    <Skeleton className="h-3 w-[36%] animate-[shimmer_1.6s_infinite] rounded-xs bg-(--color-panel-raised) bg-[linear-gradient(90deg,transparent,var(--color-shimmer),transparent)] bg-size-[200%_100%]" />
  </article>
)
