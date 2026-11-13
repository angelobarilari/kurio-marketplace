import { useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { nftImages } from '@/assets'
import { Button } from '@/components/ui/button'

const heroSlides = [
  {
    name: 'Emerald Ape',
    image: nftImages.emeraldApe,
    alt: 'Arte digital Emerald Ape da coleção Kurio Apes',
  },
  {
    name: 'Sage Nomad',
    image: nftImages.sageNomad,
    alt: 'Arte digital Sage Nomad da coleção Kurio Apes',
  },
  {
    name: 'Ivory Baron',
    image: nftImages.ivoryBaron,
    alt: 'Arte digital Ivory Baron da coleção Kurio Apes',
  },
] as const

export const HeroSection = () => {
  const [activeSlide, setActiveSlide] = useState(0)
  const slide = heroSlides[activeSlide]

  return (
    <section
      className="hero relative grid min-h-125 grid-cols-[1fr_minmax(360px,480px)] items-center gap-12 px-10.5 pt-10.5 pb-12.5 max-[1100px]:min-h-102.5 max-[1100px]:grid-cols-[1fr_minmax(280px,40%)] max-[1100px]:gap-7 max-[1100px]:px-5 max-[760px]:block max-[760px]:min-h-52 max-[760px]:overflow-hidden max-[760px]:rounded-[28px] max-[760px]:bg-[radial-gradient(ellipse_at_68%_50%,var(--color-hero-highlight)_0,var(--color-hero-mid)_42%,transparent_68%),linear-gradient(115deg,var(--color-hero-start),var(--color-hero-end)_76%)] max-[760px]:px-4 max-[760px]:pt-5 max-[760px]:pb-4 before:max-[760px]:absolute before:max-[760px]:-top-10 before:max-[760px]:right-[37%] before:max-[760px]:h-70 before:max-[760px]:w-52.5 before:max-[760px]:rotate-25 before:max-[760px]:rounded-full before:max-[760px]:bg-(--color-hero-glow) before:max-[760px]:content-[''] max-[390px]:min-h-52 max-[390px]:px-3.5"
      aria-labelledby="hero-title"
    >
      <div
        className="col-start-1 row-start-1 max-w-142.5 max-[760px]:relative max-[760px]:z-1 max-[760px]:w-[55%]"
        data-testid="hero-copy"
      >
        <p className="mb-4.5 text-[13px] tracking-wider text-(--color-foreground) max-[760px]:mb-2 max-[760px]:text-xs">
          Bem-vindo à Kurio
        </p>

        <h1
          id="hero-title"
          className="mb-4.5 max-w-147.5 text-[clamp(32px,3.2vw,46px)] leading-[1.35] text-(--color-foreground) uppercase max-[760px]:mb-2 max-[760px]:max-w-62.5 max-[760px]:text-[clamp(16px,4.5vw,22px)] max-[760px]:leading-[1.3]"
        >
          <span className="max-[760px]:hidden">Seja dono do futuro da arte digital</span>
          <span className="hidden max-[760px]:inline">Seja dono da cultura digital</span>
        </h1>

        <p className="mb-7 max-w-142.5 text-sm leading-[1.8] text-(--color-muted) max-[760px]:mb-0 max-[760px]:max-w-60 max-[760px]:text-[11px] max-[760px]:leading-[1.4]">
          <span className="max-[760px]:hidden">
            Descubra NFTs selecionados de criadores emergentes e consagrados. Colecione arte digital rara e
            apoie artistas que fazem parte da cultura da internet.
          </span>
          <span className="hidden max-[760px]:inline">
            Descubra NFTs selecionados de criadores do mundo todo.
          </span>
        </p>

        <Button
          asChild
          className="min-h-9 gap-1.75 rounded bg-(--color-primary) px-4 font-bold text-primary-foreground! hover:bg-(--color-primary-bright) max-[760px]:min-h-0 max-[760px]:bg-transparent max-[760px]:p-0 max-[760px]:text-[13px] max-[760px]:text-[#E89B55]! max-[760px]:[&_svg]:size-4.25"
        >
          <a href="#catalog">
            Explorar <ArrowRight aria-hidden="true" />
          </a>
        </Button>
      </div>

      <div
        className="relative col-start-2 row-start-1 min-h-97.5 self-stretch max-[1100px]:min-h-80 max-[760px]:absolute max-[760px]:top-3 max-[760px]:right-3.5 max-[760px]:aspect-square max-[760px]:min-h-0 max-[760px]:w-[36%]"
        data-testid="hero-art"
      >
        <img
          className="h-full max-h-102.5 w-full rounded-[18px] object-cover object-[center_35%] max-[760px]:rounded-2xl max-[760px]:object-[center_25%]"
          src={slide.image}
          alt={slide.alt}
          fetchPriority="high"
        />
      </div>
      <div
        className="hidden max-[760px]:absolute max-[760px]:bottom-3 max-[760px]:left-1/2 max-[760px]:flex max-[760px]:-translate-x-1/2 max-[760px]:justify-center max-[760px]:gap-2.5"
        role="group"
        aria-label="Destaques do marketplace"
      >
        {heroSlides.map((item, index) => (
          <button
            key={item.name}
            type="button"
            className={`size-2.5 rounded-full transition-colors ${activeSlide === index ? 'bg-(--color-primary)' : 'bg-primary/50'}`}
            aria-label={`Mostrar destaque ${index + 1}: ${item.name}`}
            aria-pressed={activeSlide === index}
            onClick={() => setActiveSlide(index)}
          />
        ))}
      </div>
    </section>
  )
}
