import { Carousel, CarouselContent, CarouselControls, CarouselItem } from '@/components/ui/carousel'
import { NftCard } from '@/features/catalog/components/nft-card'
import { useNftCatalog } from '@/features/catalog/hooks/use-nft-catalog'

export const CartRecommendations = () => {
  const query = useNftCatalog({ sort: 'popular', page: 1 })
  if (!query.data?.items.length) return null
  return (
    <section className="mt-24 max-[760px]:mt-14" aria-labelledby="cart-recommendations-title">
      <h2
        id="cart-recommendations-title"
        className="mb-8 border-b border-(--color-border) pb-3 text-xl font-bold text-(--color-primary-bright)"
      >
        Colecionadores também viram
      </h2>
      <Carousel opts={{ align: 'start' }} aria-label="NFTs recomendados">
        <CarouselContent>
          {query.data.items.map((nft) => (
            <CarouselItem key={nft.id} className="basis-1/5 max-[1100px]:basis-1/4 max-[760px]:basis-1/2">
              <NftCard nft={nft} />
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselControls label="Navegar pelas recomendações" />
      </Carousel>
    </section>
  )
}
