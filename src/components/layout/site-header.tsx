import { useRef, useState } from 'react'
import { Search, ShoppingCart, UserRound, X } from 'lucide-react'
import { Link, useNavigate } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { FieldLabel } from '@/components/ui/field-label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import { useAuthFlow } from '@/features/auth/components/auth-flow-context'
import { useLogout, useSession } from '@/features/auth/hooks/use-session'

type SiteHeaderProps = {
  cartCount: number
  searchValue: string
  onSearchChange: (value: string) => void
}

type NavItem =
  | { id: string; label: string; to: '/' }
  | { id: string; label: string; href: string }
  | { id: string; label: string; disabled: true }

const navItems: readonly NavItem[] = [
  { id: 'home', label: 'Início', to: '/' },
  { id: 'market', label: 'Mercado', href: '#catalog' },
  { id: 'creators', label: 'Criadores', disabled: true },
  { id: 'learn', label: 'Aprenda', disabled: true },
]

const navItemClass = 'flex items-center border-b-2 px-0.5 text-[13px] no-underline'
const iconButtonClass = 'relative h-8.5 w-8.5 bg-transparent p-0 text-(--color-foreground)'

export const SiteHeader = ({ cartCount, searchValue, onSearchChange }: SiteHeaderProps) => {
  const authTriggerRef = useRef<HTMLButtonElement>(null)
  const [searchOpen, setSearchOpen] = useState(false)
  const session = useSession()
  const navigate = useNavigate()
  const logout = useLogout(async () => {
    await navigate({ to: '/' })
    await new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()))
  })
  const { openAuthDialog } = useAuthFlow()
  const closeSearch = () => setSearchOpen(false)

  return (
    <>
      <header className="relative grid h-18 grid-cols-[1fr_auto_1fr] items-center max-[760px]:hidden">
        <Link
          className="w-fit text-[15px] font-bold tracking-[0.12em] text-(--color-foreground) no-underline"
          to="/"
          aria-label="Kurio — início"
        >
          KURIO
        </Link>

        <nav className="flex h-full items-stretch gap-8.5" aria-label="Navegação principal">
          {navItems.map((item) => {
            if ('disabled' in item) {
              return (
                <span
                  key={item.id}
                  className={`${navItemClass} border-transparent text-(--color-muted)`}
                  aria-disabled="true"
                >
                  {item.label}
                </span>
              )
            }
            if ('to' in item) {
              return (
                <Link
                  key={item.id}
                  className={navItemClass}
                  to={item.to}
                  activeOptions={{ exact: true, includeSearch: false }}
                  activeProps={{ className: 'border-(--color-primary) text-(--color-primary-bright)' }}
                  inactiveProps={{ className: 'border-transparent text-(--color-foreground)' }}
                >
                  {item.label}
                </Link>
              )
            }
            return (
              <a
                key={item.id}
                className={`${navItemClass} border-transparent text-(--color-foreground)`}
                href={item.href}
              >
                {item.label}
              </a>
            )
          })}
        </nav>

        <div className="flex items-center justify-end gap-3">
          <Popover open={searchOpen} onOpenChange={setSearchOpen}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className={iconButtonClass}
                aria-label="Ir para a busca"
              >
                <Search aria-hidden="true" className="size-4.5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-[min(320px,calc(100vw-32px))] p-3">
              <form
                id="header-search"
                role="search"
                className="flex items-center gap-2"
                onSubmit={(event) => event.preventDefault()}
              >
                <FieldLabel visuallyHidden htmlFor="header-search-input">
                  Buscar NFTs
                </FieldLabel>
                <Input
                  autoFocus
                  id="header-search-input"
                  type="search"
                  value={searchValue}
                  onChange={(event) => onSearchChange(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Escape') closeSearch()
                  }}
                  placeholder="Buscar NFTs..."
                  className="h-auto min-w-0 flex-1 border-0 bg-transparent px-0 text-[12px] shadow-none focus-visible:ring-0"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Fechar busca"
                  className="size-8 text-(--color-muted) hover:text-(--color-foreground)"
                  onClick={closeSearch}
                >
                  <X aria-hidden="true" className="size-4" />
                </Button>
              </form>
            </PopoverContent>
          </Popover>

          <Button asChild variant="ghost" size="icon" className={iconButtonClass}>
            <Link to="/cart" aria-label={`Carrinho, ${cartCount} ${cartCount === 1 ? 'item' : 'itens'}`}>
              <ShoppingCart aria-hidden="true" className="size-4.5" />
              <Badge className="absolute top-0 -right-0.5 min-w-3.25 border-0 px-0.75 py-0 text-[9px] leading-3.25 text-background">
                {cartCount}
              </Badge>
            </Link>
          </Button>

          {session.data ? (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="inline-flex h-8.5 items-center gap-2 px-3 text-[13px] font-bold"
                >
                  <UserRound aria-hidden="true" className="size-4.5" /> Minha conta
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-44 p-1.5">
                <Button asChild variant="ghost" className="w-full justify-start">
                  <Link to="/profile">Meu perfil</Link>
                </Button>
                <Button asChild variant="ghost" className="w-full justify-start">
                  <Link to="/profile/wallets">Carteiras</Link>
                </Button>
                <Separator className="my-1" />
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full justify-start"
                  disabled={logout.isPending}
                  onClick={() => logout.mutate()}
                >
                  {logout.isPending ? 'Saindo…' : 'Sair'}
                </Button>
              </PopoverContent>
            </Popover>
          ) : (
            <Button
              ref={authTriggerRef}
              type="button"
              className="inline-flex h-8.5 items-center gap-2 rounded bg-(--color-primary) px-3 text-[13px] font-bold text-primary-foreground!"
              onClick={() => openAuthDialog(authTriggerRef.current)}
            >
              <UserRound aria-hidden="true" className="size-4.5" />
              Entrar
            </Button>
          )}
        </div>
      </header>
      <Separator className="max-[760px]:hidden" />
    </>
  )
}
