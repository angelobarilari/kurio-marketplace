import { ArrowLeft, Search } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { FavoriteButton } from '@/features/favorites/components/favorite-button'
import type { NftDetail, NftMedia } from '@/types/nft'

type NftGalleryProps = {
  nft: NftDetail
  gallery: NftMedia[]
  activeId: string
  onSelect: (id: string) => void
}

export const NftGallery = ({ nft, gallery, activeId, onSelect }: NftGalleryProps) => {
  const activeMedia = gallery.find((media) => media.id === activeId) ?? gallery[0]

  return (
    <section
      className="relative grid min-w-0 grid-cols-[108px_minmax(0,1fr)] items-stretch gap-7 max-[1100px]:grid-cols-[92px_minmax(0,1fr)] max-[1100px]:gap-5 max-[760px]:block"
      aria-label="Galeria do NFT"
    >
      <div className="absolute top-6 right-1.5 left-1.5 z-10 hidden items-center justify-between max-[760px]:flex max-[390px]:right-3 max-[390px]:left-3">
        <Button
          asChild
          variant="ghost"
          size="icon"
          className="size-9 rounded-full border border-(--color-border) bg-(--color-panel)/85 text-(--color-muted)"
        >
          <Link to="/" hash="catalog" aria-label="Voltar ao mercado">
            <ArrowLeft className="size-5" />
          </Link>
        </Button>
        <FavoriteButton
          nft={nft}
          className="size-9 rounded-full border border-(--color-border) bg-(--color-panel)/85 text-(--color-primary) [&_svg]:size-5"
        />
      </div>

      <div className="grid min-h-0 grid-rows-4 gap-4 max-[760px]:hidden" role="list" aria-label="Miniaturas">
        {gallery.map((media, index) => (
          <div key={media.id} role="listitem" className="min-h-0">
            <Button
              type="button"
              variant="ghost"
              className={`h-full min-h-0 w-full overflow-hidden rounded-xl border-2 bg-transparent p-0 ${media.id === activeMedia.id ? 'border-(--color-primary)' : 'border-transparent'}`}
              aria-pressed={media.id === activeMedia.id}
              aria-label={`Selecionar imagem ${index + 1}: ${media.alt}`}
              onClick={() => onSelect(media.id)}
            >
              <img className="size-full object-cover" src={media.src} alt="" aria-hidden="true" />
            </Button>
          </div>
        ))}
      </div>

      <div className="relative rounded-lg bg-(--color-panel) p-5 max-[1100px]:p-4 max-[760px]:-mx-5.5 max-[760px]:rounded-none max-[760px]:bg-[radial-gradient(circle_at_50%_0%,var(--color-hero-mid),var(--color-panel))] max-[760px]:px-5.5 max-[760px]:pt-16 max-[760px]:pb-0 max-[390px]:-mx-4 max-[390px]:px-4">
        <img
          className="aspect-square w-full rounded-2xl object-cover max-[760px]:rounded-[28px]"
          src={activeMedia.src}
          alt={activeMedia.alt}
          loading="eager"
          fetchPriority="high"
        />
        <Dialog>
          <DialogTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute top-5 right-5 size-10 rounded-full bg-(--color-panel)/80 text-(--color-foreground) max-[1100px]:top-4 max-[1100px]:right-4 max-[760px]:hidden"
              aria-label="Ampliar imagem"
            >
              <Search />
            </Button>
          </DialogTrigger>
          <DialogContent className="w-auto max-w-[92vw] p-3">
            <DialogTitle className="sr-only">Imagem ampliada do NFT</DialogTitle>
            <DialogDescription className="sr-only">
              Visualização ampliada de {activeMedia.alt}
            </DialogDescription>
            <img
              className="max-h-[85vh] max-w-[86vw] rounded-lg object-contain"
              src={activeMedia.src}
              alt={activeMedia.alt}
            />
          </DialogContent>
        </Dialog>
      </div>
    </section>
  )
}
