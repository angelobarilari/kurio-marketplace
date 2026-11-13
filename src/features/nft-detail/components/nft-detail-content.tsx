import { Carousel, CarouselContent, CarouselControls, CarouselItem } from '@/components/ui/carousel'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { NftCard } from '@/features/catalog/components/nft-card'
import type { NftDetail } from '@/types/nft'

type NftDetailContentProps = { nft: NftDetail }

export const NftDetailContent = ({ nft }: NftDetailContentProps) => (
  <>
    <section className="mt-20 max-[760px]:mt-10" aria-labelledby="nft-information-title">
      <h2 id="nft-information-title" className="sr-only">
        Informações do NFT
      </h2>
      <Tabs defaultValue="details">
        <TabsList
          className="gap-8 overflow-x-auto border-b border-(--color-border)"
          aria-label="Informações do NFT"
        >
          <TabsTrigger
            value="details"
            className="shrink-0 border-b-2 border-transparent px-0 pb-2 text-lg text-(--color-foreground) data-[state=active]:border-(--color-primary) data-[state=active]:font-bold data-[state=active]:text-(--color-primary-bright)"
          >
            Detalhes do NFT
          </TabsTrigger>
          <TabsTrigger
            value="reviews"
            className="shrink-0 border-b-2 border-transparent px-0 pb-2 text-lg text-(--color-foreground) data-[state=active]:border-(--color-primary) data-[state=active]:font-bold data-[state=active]:text-(--color-primary-bright)"
          >
            Avaliações de colecionadores ({nft.rating.count})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="max-w-none py-5 text-sm leading-8 text-(--color-muted)">
          {nft.description.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
          <dl className="mt-8 grid gap-5">
            <div>
              <dt className="font-bold text-(--color-foreground)">Rede:</dt>
              <dd className="m-0">
                Cunhado na {nft.network} com procedência imutável e metadados armazenados no{' '}
                {nft.provenance.storage}.
              </dd>
            </div>
            <div>
              <dt className="font-bold text-(--color-foreground)">Contrato:</dt>
              <dd className="m-0">
                Direitos autorais do criador: {nft.provenance.royaltyPercent}% nas vendas secundárias.
              </dd>
            </div>
            <div>
              <dt className="font-bold text-(--color-foreground)">Token:</dt>
              <dd className="m-0">
                {nft.provenance.contractAddress} · Contrato inteligente {nft.provenance.tokenStandard}{' '}
                verificado.
              </dd>
            </div>
          </dl>
        </TabsContent>
        <TabsContent
          value="reviews"
          className="grid min-h-52 place-content-center text-center text-(--color-muted)"
        >
          <p className="mb-0">As {nft.rating.count} avaliações são somente leitura nesta etapa.</p>
        </TabsContent>
      </Tabs>
    </section>

    {nft.relatedNfts.length > 0 && (
      <section className="mt-20" aria-labelledby="related-title">
        <h2
          id="related-title"
          className="mb-8 border-b border-(--color-border) pb-2 text-xl font-bold text-(--color-primary-bright)"
        >
          Mais desta coleção
        </h2>
        <Carousel opts={{ align: 'start' }} aria-label="NFTs relacionados">
          <CarouselContent>
            {nft.relatedNfts.map((related) => (
              <CarouselItem
                key={related.id}
                className="basis-1/5 max-[1100px]:basis-1/4 max-[760px]:basis-1/2"
              >
                <NftCard nft={related} />
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselControls label="Navegar pelos NFTs relacionados" />
        </Carousel>
      </section>
    )}
  </>
)
