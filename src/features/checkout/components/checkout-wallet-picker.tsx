import { Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { FieldError } from '@/components/ui/field-error'
import { FieldLabel } from '@/components/ui/field-label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import type { Network, Wallet } from '@/types/account'

type WalletPickerProps = {
  wallets: Wallet[]
  selectedWalletId: string
  network: Network
  couponCode: string | null
  error?: string
  onSelect: (walletId: string) => void
}

export const CheckoutWalletPicker = ({
  wallets,
  selectedWalletId,
  network,
  couponCode,
  error,
  onSelect,
}: WalletPickerProps) => (
  <div>
    <FieldLabel htmlFor="checkout-wallet" className="mb-2 block">
      Tipo de carteira{' '}
      <span className="ml-1 text-(--color-primary-bright)" aria-hidden="true">
        *
      </span>
    </FieldLabel>
    <Select value={selectedWalletId} onValueChange={onSelect} disabled={!wallets.length}>
      <SelectTrigger
        id="checkout-wallet"
        aria-required="true"
        aria-invalid={Boolean(error)}
        aria-describedby={error ? 'checkout-wallet-select-error' : undefined}
        className="h-11 w-full"
      >
        <SelectValue placeholder="Selecione uma carteira" />
      </SelectTrigger>
      <SelectContent>
        {wallets.map((wallet) => (
          <SelectItem key={wallet.id} value={wallet.id}>
            {wallet.displayName} · {wallet.network}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
    <FieldError id="checkout-wallet-select-error" message={error} />
    {!wallets.some((wallet) => wallet.network === network) && (
      <Button asChild variant="link" className="mt-1 h-auto p-0 text-xs">
        <Link
          to="/profile/wallets"
          search={{ returnTo: '/checkout', network, couponCode: couponCode ?? undefined }}
        >
          Cadastrar carteira nesta rede
        </Link>
      </Button>
    )}
  </div>
)

type CheckoutWalletCardsProps = WalletPickerProps & {
  isConnected: boolean
  onChangeWallet: () => void
}

export const CheckoutWalletCards = ({
  wallets,
  selectedWalletId,
  network,
  couponCode,
  onSelect,
  isConnected,
  onChangeWallet,
}: CheckoutWalletCardsProps) => (
  <section className="space-y-3" aria-labelledby="mobile-wallet-title">
    <div className="flex items-center justify-between gap-4">
      <h2 id="mobile-wallet-title" className="mb-0 text-base font-bold">
        {isConnected ? 'Carteira conectada' : 'Carteira selecionada'}
      </h2>
      <Button
        type="button"
        variant="link"
        className="h-auto p-0 text-sm font-bold text-(--color-primary-bright)"
        onClick={onChangeWallet}
      >
        Trocar carteira
      </Button>
    </div>
    <ToggleGroup
      type="single"
      value={selectedWalletId}
      onValueChange={onSelect}
      aria-label="Carteira cadastrada"
      className="flex w-full flex-col gap-3"
    >
      {wallets.map((wallet) => (
        <ToggleGroupItem
          key={wallet.id}
          value={wallet.id}
          aria-label={`${wallet.alias || wallet.displayName}, rede ${wallet.network}`}
          className="h-auto min-h-24 w-full justify-start rounded-[18px] border border-transparent bg-(--color-panel) px-5 py-4 text-left text-(--color-foreground) data-[state=on]:border-(--color-primary) data-[state=on]:bg-(--color-panel) data-[state=on]:text-(--color-foreground)"
        >
          <span
            aria-hidden="true"
            className="mr-4 grid size-6 shrink-0 place-items-center rounded-full border border-current"
          >
            {selectedWalletId === wallet.id && (
              <span className="size-3 rounded-full bg-(--color-primary-bright)" />
            )}
          </span>
          <span className="min-w-0">
            <span className="block font-bold">{wallet.alias || wallet.displayName}</span>
            <span className="block truncate text-(--color-muted)">{wallet.ensName || wallet.address}</span>
            <span className="block text-(--color-muted)">Rede {wallet.network}</span>
          </span>
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
    {!wallets.some((wallet) => wallet.network === network) && (
      <Button asChild variant="link" className="h-auto p-0 text-(--color-primary-bright)">
        <Link
          to="/profile/wallets"
          search={{ returnTo: '/checkout', network, couponCode: couponCode ?? undefined }}
        >
          Cadastrar carteira nesta rede
        </Link>
      </Button>
    )}
  </section>
)
