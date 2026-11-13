import { Skeleton } from '@/components/ui/skeleton'

export const NftDetailSkeleton = () => (
  <main
    className="relative left-1/2 w-[min(1280px,calc(100vw-40px))] -translate-x-1/2 py-14 max-[760px]:left-auto max-[760px]:w-auto max-[760px]:translate-x-0 max-[760px]:pt-0"
    aria-label="Carregando detalhes do NFT"
    aria-busy="true"
  >
    <Skeleton className="mb-4 h-5 w-36 max-[760px]:hidden" />
    <div className="grid grid-cols-[minmax(560px,1fr)_minmax(500px,1fr)] gap-9 max-[1100px]:block">
      <div className="grid grid-cols-[108px_minmax(0,1fr)] gap-7 max-[760px]:block">
        <div className="grid grid-rows-4 gap-4 max-[760px]:hidden">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-full min-h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="aspect-square w-full rounded-2xl bg-(--color-panel-raised)" />
      </div>
      <div className="grid content-start gap-5 max-[1100px]:mt-8 max-[760px]:mt-0 max-[760px]:rounded-t-[42px] max-[760px]:p-6">
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="h-7 w-1/3" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-12 w-2/3" />
        <Skeleton className="h-32 w-full" />
      </div>
    </div>
    <Skeleton className="mt-20 h-64 w-full" />
  </main>
)
