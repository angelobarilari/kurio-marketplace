import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { UnavailableAction } from '@/components/ui/unavailable-action'

type JournalCardProps = {
  image: string
  title: string
}

export const JournalCard = ({ image, title }: JournalCardProps) => (
  <article data-testid="journal-card" className="overflow-hidden rounded-lg bg-(--color-panel)">
    <img src={image} alt="" loading="lazy" className="aspect-[1.1] w-full object-cover" />

    <div className="p-3.5 text-xs leading-4 font-medium text-(--color-muted)">
      <p className="mb-0">12 de setembro | Leitura de 6 min</p>

      <h3 className="my-2 text-base leading-none font-bold text-(--color-foreground)">{title}</h3>

      <p className="mb-2">Aprenda a colecionar, negociar e verificar ativos digitais.</p>

      <UnavailableAction message="Conteúdo editorial em breve">
        <Button variant="link" disabled className="h-auto gap-1.5 p-0 font-bold disabled:opacity-100">
          Ler mais <ArrowRight aria-hidden="true" className="size-3.5" />
        </Button>
      </UnavailableAction>
    </div>
  </article>
)
