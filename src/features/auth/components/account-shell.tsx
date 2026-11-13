import type { ReactNode } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { AlertTriangle, Download, Heart, LogOut, MapPin, ShoppingCart, Tag, UserRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLogout } from '@/features/auth/hooks/use-session'

type AccountShellProps = {
  activeSection: 'profile' | 'wallets' | 'favorites'
  children: ReactNode
}

const accountNavItems = [
  { label: 'Dados do perfil', icon: UserRound, enabled: true, to: '/profile' },
  { label: 'Carteiras', icon: MapPin, enabled: true, to: '/profile/wallets' },
  { label: 'Lista de interesse', icon: Heart, enabled: true, to: '/profile/favorites' },
  { label: 'Atividade', icon: ShoppingCart, enabled: false },
  { label: 'Ofertas', icon: Tag, enabled: false },
  { label: 'Arquivos baixados', icon: Download, enabled: false },
  { label: 'Suporte', icon: AlertTriangle, enabled: false },
] as const

const navigationClass =
  'flex h-12 w-full items-center justify-start gap-4 rounded-none border-l-4 border-transparent px-5 text-left text-base font-normal text-(--color-primary-bright) no-underline transition-colors hover:bg-background/30 [&_svg]:size-5'

export const AccountShell = ({ activeSection, children }: AccountShellProps) => {
  const navigate = useNavigate()
  const logout = useLogout(async () => {
    await navigate({ to: '/' })
    await new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()))
  })

  const handleLogout = () => {
    logout.mutate()
  }

  return (
    <main className="grid grid-cols-[310px_minmax(0,1fr)] gap-7 py-8 max-[900px]:grid-cols-1 max-[760px]:py-5">
      <aside className="self-start bg-(--color-panel)" aria-label="Minha conta">
        <h1 className="px-5 pt-5 pb-3 text-xl font-bold">Meu perfil</h1>
        <nav className="flex flex-col" aria-label="Seções da conta">
          {accountNavItems.map((item) => {
            const Icon = item.icon
            return item.enabled ? (
              <Button key={item.label} asChild variant="ghost" className={navigationClass}>
                <Link
                  to={item.to}
                  activeOptions={{ exact: true }}
                  activeProps={{
                    'aria-current': 'page',
                    className: 'border-(--color-primary)! bg-background/40',
                  }}
                >
                  <Icon aria-hidden="true" /> {item.label}
                </Link>
              </Button>
            ) : (
              <Button
                key={item.label}
                type="button"
                variant="ghost"
                disabled
                className={`${navigationClass} disabled:opacity-55`}
                title="Disponível em uma próxima etapa"
              >
                <Icon aria-hidden="true" /> {item.label}
              </Button>
            )
          })}
        </nav>
        <Button
          type="button"
          variant="ghost"
          className="h-14 w-full justify-start rounded-none border-t border-(--color-border) px-6 text-(--color-primary-bright)"
          disabled={logout.isPending}
          onClick={handleLogout}
        >
          <LogOut aria-hidden="true" /> {logout.isPending ? 'Saindo…' : 'Sair'}
        </Button>
      </aside>
      <section
        aria-label={
          activeSection === 'profile'
            ? 'Dados do perfil'
            : activeSection === 'wallets'
              ? 'Carteiras'
              : 'Lista de interesse'
        }
      >
        {children}
      </section>
    </main>
  )
}
