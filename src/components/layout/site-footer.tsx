import type { CSSProperties } from 'react'
import { Link } from '@tanstack/react-router'
import { FaFacebookF, FaInstagram, FaLinkedinIn, FaXTwitter, FaYoutube } from 'react-icons/fa6'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { FieldLabel } from '@/components/ui/field-label'
import { footerHighlights } from '@/components/layout/site-footer-content'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Separator } from '@/components/ui/separator'

const footerGroups = [
  {
    title: 'Meu perfil',
    items: [
      { label: 'Meu perfil', to: '/profile' },
      { label: 'Minha coleção' },
      { label: 'Atividade' },
      { label: 'Estúdio do criador' },
      { label: 'Lista de interesse' },
    ],
  },
  {
    title: 'Central de ajuda',
    items: [
      { label: 'Central de ajuda' },
      { label: 'Como comprar NFTs' },
      { label: 'Carteira e segurança' },
      { label: 'Política do mercado' },
      { label: 'Denunciar item' },
    ],
  },
  {
    title: 'Coleções',
    items: [
      { label: 'Arte digital', href: '#catalog' },
      { label: 'Fotografia', href: '#catalog' },
      { label: 'Música', href: '#catalog' },
      { label: 'Arte 3D', href: '#catalog' },
      { label: 'Utilidade', href: '#catalog' },
    ],
  },
] as const

const socialItems = [
  { label: 'Facebook', Icon: FaFacebookF },
  { label: 'Instagram', Icon: FaInstagram },
  { label: 'X', Icon: FaXTwitter },
  { label: 'LinkedIn', Icon: FaLinkedinIn },
  { label: 'YouTube', Icon: FaYoutube },
] as const

const wallets = ['METAMASK', 'WALLETCONNECT', 'COINBASE'] as const

const footerTopStyle = { padding: 32 } satisfies CSSProperties
const highlightBadgeStyle = { width: 64, height: 64 } satisfies CSSProperties
const newsletterStyle = { paddingLeft: 16 } satisfies CSSProperties
const contactBarStyle = { width: '100%', height: 88, gap: 10, padding: 32 } satisfies CSSProperties
const footerNavigationStyle = { padding: '28px 32px' } satisfies CSSProperties
const walletStyle = {
  fontSize: 9,
  fontWeight: 700,
  lineHeight: '100%',
  letterSpacing: '0.1px',
} satisfies CSSProperties
const copyrightStyle = { margin: '12px 0' } satisfies CSSProperties

export const SiteFooter = () => (
  <footer className="mt-24 bg-(--color-panel) max-[760px]:hidden">
    <div className="grid grid-cols-4" style={footerTopStyle}>
      {footerHighlights.map((item) => (
        <article key={item.id} className="border-r border-(--color-primary) px-3 first:pl-0">
          <span
            className="mb-3 grid shrink-0 place-items-center rounded-full bg-(--color-primary) text-base font-bold text-primary-foreground"
            style={highlightBadgeStyle}
            aria-hidden="true"
          >
            {item.symbol}
          </span>
          <h2 className="mb-2 text-sm font-bold text-(--color-foreground)">{item.title}</h2>
          <p className="mb-0 max-w-48 text-xs leading-[1.6] text-(--color-muted)">{item.description}</p>
        </article>
      ))}

      <form className="min-w-0" style={newsletterStyle} onSubmit={(event) => event.preventDefault()}>
        <FieldLabel
          className="mb-2.5 block max-w-60 text-sm leading-[1.05] font-bold text-(--color-foreground)"
          htmlFor="newsletter-email"
        >
          Antecipe-se ao próximo lançamento
        </FieldLabel>
        <div className="flex h-9 overflow-hidden rounded-md">
          <Input
            className="h-full min-w-0 flex-1 rounded-none border-0 bg-(--color-footer) px-2 text-[11px] shadow-none focus-visible:ring-0"
            id="newsletter-email"
            type="email"
            placeholder="digite seu e-mail..."
            autoComplete="email"
          />
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                className="h-full cursor-pointer rounded-l-none rounded-r-md bg-(--color-primary) px-3 font-bold text-primary-foreground! hover:bg-(--color-primary-bright)"
                aria-disabled="true"
              >
                Enviar
              </Button>
            </TooltipTrigger>
            <TooltipContent>Envio de newsletter em breve</TooltipContent>
          </Tooltip>
        </div>
        <p className="mt-3 mb-0 text-[11px] leading-[1.7] text-(--color-muted)">
          Receba lançamentos selecionados, histórias de criadores e novidades do mercado.
        </p>
      </form>
    </div>

    <div
      className="grid grid-cols-4 items-center bg-(--color-footer) text-[11px] text-(--color-foreground)"
      style={contactBarStyle}
    >
      <Link className="w-fit font-bold tracking-[0.12em] no-underline" to="/" aria-label="Kurio — início">
        KURIO
      </Link>
      <p className="mb-0 max-w-52 leading-normal">Feito para colecionadores, criadores e cultura</p>
      <a
        className="w-fit no-underline hover:text-(--color-primary-bright)"
        href="mailto:contato@kurio.example"
      >
        contato@email.com
      </a>
      <a
        className="w-fit justify-self-center no-underline hover:text-(--color-primary-bright)"
        href="tel:+551140028922"
      >
        +55 11 4002 8922
      </a>
    </div>

    <div className="grid grid-cols-4 gap-8" style={footerNavigationStyle}>
      {footerGroups.map((group) => (
        <nav key={group.title} aria-label={group.title}>
          <h2 className="mb-2.5 text-sm font-bold text-(--color-foreground)">{group.title}</h2>
          <ul className="m-0 grid list-none gap-2 p-0 text-[11px] text-(--color-foreground)">
            {group.items.map((item) => (
              <li key={item.label}>
                {'to' in item ? (
                  <Link className="no-underline hover:text-(--color-primary-bright)" to={item.to}>
                    {item.label}
                  </Link>
                ) : 'href' in item ? (
                  <a className="no-underline hover:text-(--color-primary-bright)" href={item.href}>
                    {item.label}
                  </a>
                ) : (
                  <span className="text-(--color-muted)" aria-disabled="true">
                    {item.label}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </nav>
      ))}

      <div>
        <section aria-labelledby="social-title">
          <h2 id="social-title" className="mb-3 text-sm font-bold text-(--color-foreground)">
            Redes sociais
          </h2>
          <div className="flex gap-1.5">
            {socialItems.map((social) => (
              <span
                key={social.label}
                className="grid size-7 place-items-center rounded border border-(--color-primary) text-[11px] font-bold text-(--color-primary)"
                role="img"
                aria-label={`${social.label} — em breve`}
              >
                <social.Icon className="size-3.5" aria-hidden="true" />
              </span>
            ))}
          </div>
        </section>

        <section className="mt-6" aria-labelledby="wallets-title">
          <h2 id="wallets-title" className="mb-2.5 text-sm font-bold text-(--color-foreground)">
            Carteiras compatíveis
          </h2>
          <Badge
            variant="outline"
            className="inline-flex max-w-full rounded border-(--color-border) bg-(--color-footer) px-2 py-1.5 text-center whitespace-nowrap text-(--color-primary)"
            style={walletStyle}
          >
            {wallets.join(' · ')}
          </Badge>
        </section>
      </div>
    </div>

    <Separator />
    <p
      className="bg-background py-4 text-center text-[10px] text-(--color-foreground)"
      style={copyrightStyle}
    >
      © 2026 Kurio. Propriedade digital para todos.
    </p>
  </footer>
)
