import * as React from 'react'
import useEmblaCarousel, { type UseEmblaCarouselType } from 'embla-carousel-react'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type CarouselApi = UseEmblaCarouselType[1]
type CarouselContextValue = {
  carouselRef: ReturnType<typeof useEmblaCarousel>[0]
  api: CarouselApi
  scrollPrev: () => void
  scrollNext: () => void
  canScrollPrev: boolean
  canScrollNext: boolean
}

const CarouselContext = React.createContext<CarouselContextValue | null>(null)
const useCarousel = () => {
  const context = React.useContext(CarouselContext)
  if (!context) throw new Error('Carousel components must be used inside Carousel')
  return context
}

const Carousel = ({
  className,
  opts,
  setApi,
  children,
  ...props
}: React.ComponentProps<'section'> & {
  opts?: Parameters<typeof useEmblaCarousel>[0]
  setApi?: (api: CarouselApi) => void
}) => {
  const [carouselRef, api] = useEmblaCarousel(opts)
  const [canScrollPrev, setCanScrollPrev] = React.useState(false)
  const [canScrollNext, setCanScrollNext] = React.useState(false)

  React.useEffect(() => {
    if (!api) return
    const update = () => {
      setCanScrollPrev(api.canScrollPrev())
      setCanScrollNext(api.canScrollNext())
    }
    update()
    api.on('select', update)
    api.on('reInit', update)
    setApi?.(api)
    return () => {
      api.off('select', update)
      api.off('reInit', update)
    }
  }, [api, setApi])

  return (
    <CarouselContext.Provider
      value={{
        carouselRef,
        api,
        scrollPrev: () => api?.scrollPrev(),
        scrollNext: () => api?.scrollNext(),
        canScrollPrev,
        canScrollNext,
      }}
    >
      <section aria-roledescription="carousel" className={cn('relative', className)} {...props}>
        {children}
      </section>
    </CarouselContext.Provider>
  )
}

const CarouselContent = ({ className, ...props }: React.ComponentProps<'div'>) => {
  const { carouselRef } = useCarousel()
  return (
    <div ref={carouselRef} className="overflow-hidden">
      <div className={cn('-ml-4 flex', className)} {...props} />
    </div>
  )
}
const CarouselItem = ({ className, ...props }: React.ComponentProps<'div'>) => (
  <div
    role="group"
    aria-roledescription="slide"
    className={cn('min-w-0 shrink-0 grow-0 basis-full pl-4', className)}
    {...props}
  />
)
const CarouselPrevious = ({ className, ...props }: React.ComponentProps<typeof Button>) => {
  const { scrollPrev, canScrollPrev } = useCarousel()
  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      className={cn('rounded-full', className)}
      disabled={!canScrollPrev}
      onClick={scrollPrev}
      aria-label="Item anterior"
      {...props}
    >
      <ArrowLeft />
    </Button>
  )
}
const CarouselNext = ({ className, ...props }: React.ComponentProps<typeof Button>) => {
  const { scrollNext, canScrollNext } = useCarousel()
  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      className={cn('rounded-full', className)}
      disabled={!canScrollNext}
      onClick={scrollNext}
      aria-label="Próximo item"
      {...props}
    >
      <ArrowRight />
    </Button>
  )
}

const CarouselControls = ({ label }: { label: string }) => {
  const { canScrollPrev, canScrollNext } = useCarousel()
  if (!canScrollPrev && !canScrollNext) return null

  return (
    <div role="group" aria-label={label} className="mt-6 flex justify-center gap-3 pb-6">
      <CarouselPrevious />
      <CarouselNext />
    </div>
  )
}

export {
  Carousel,
  CarouselContent,
  CarouselControls,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
}
