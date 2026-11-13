import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

type PromoCardProps = {
  image: string
  title: string
  description: string
}

export const PromoCard = ({ image, title, description }: PromoCardProps) => (
  <article
    data-testid="promo-card"
    className="grid min-h-62.5 grid-cols-1 items-stretch overflow-hidden rounded-[18px] bg-(--color-panel) sm:grid-cols-[292px_minmax(0,1fr)]"
  >
    <img
      src={image}
      alt=""
      loading="lazy"
      className="relative -left-1.25 h-62.5 w-[calc(100%+5px)] rounded-[18px] object-cover sm:w-73"
    />
    <div className="flex min-w-0 flex-col items-end justify-center px-6 py-5 text-right">
      <h2 className="mb-3 min-h-[2.6em] w-full text-[15px] leading-[1.3] font-bold">{title}</h2>

      <p className="mb-4 w-full flex-1 text-[12px] leading-[1.6] text-(--color-muted)">{description}</p>

      <Button
        asChild
        className="mt-auto inline-flex min-h-9 shrink-0 items-center gap-1.75 self-end rounded border-0 bg-(--color-primary) px-4 font-bold text-primary-foreground! no-underline hover:bg-(--color-primary-bright)"
      >
        <a href="#catalog">
          Explorar <ArrowRight aria-hidden="true" className="size-3.5" />
        </a>
      </Button>
    </div>
  </article>
)
