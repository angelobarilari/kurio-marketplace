import { Link } from '@tanstack/react-router'
import { Heart, House, Search, ShoppingCart, UserRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { UnavailableAction } from '@/components/ui/unavailable-action'

type MobileBottomNavProps = {
  hidden: boolean
}

export const MobileBottomNav = ({ hidden }: MobileBottomNavProps) => (
  <nav
    className={`fixed inset-x-0 bottom-0 z-20 hidden h-[calc(76px+env(safe-area-inset-bottom))] items-center justify-around rounded-t-[34px] bg-(--color-panel) px-3 pb-[env(safe-area-inset-bottom)] shadow-[0_-10px_30px_var(--color-shadow)] [&_svg]:size-5.5 [&_svg]:fill-current [&>a]:grid [&>a]:size-12 [&>a]:place-items-center [&>a]:text-(--color-muted) [&>button]:size-12 [&>button]:border-0 [&>button]:bg-transparent [&>button]:p-0 [&>button]:text-(--color-muted) ${hidden ? '' : 'max-[760px]:flex'}`}
    aria-label="Navegação mobile"
  >
    <Link className="text-(--color-primary-bright)!" to="/" aria-label="Início">
      <House aria-hidden="true" />
    </Link>

    <UnavailableAction message="Favoritos em breve">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-12 border-0 bg-transparent p-0 text-(--color-muted)"
        aria-label="Favoritos em breve"
        disabled
      >
        <Heart aria-hidden="true" />
      </Button>
    </UnavailableAction>

    <Button
      type="button"
      className="-mt-7 size-15! rounded-full border-[5px]! border-background! bg-(--color-primary)! text-background! [&_svg]:fill-none"
      aria-label="Explorar coleções"
      onClick={() => document.getElementById('mobile-search')?.focus()}
    >
      <Search aria-hidden="true" />
    </Button>

    <UnavailableAction message="Carrinho em breve">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-12 border-0 bg-transparent p-0 text-(--color-muted)"
        aria-label="Carrinho em breve"
        disabled
      >
        <ShoppingCart aria-hidden="true" />
      </Button>
    </UnavailableAction>

    <Link to="/profile" aria-label="Meu perfil">
      <UserRound aria-hidden="true" />
    </Link>
  </nav>
)
