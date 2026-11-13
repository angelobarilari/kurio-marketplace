import type { UseFormReturn } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { FieldError } from '@/components/ui/field-error'
import { FieldLabel } from '@/components/ui/field-label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { CheckoutWalletPicker } from '@/features/checkout/components/checkout-wallet-picker'
import type { CheckoutFormValues } from '@/features/checkout/schemas'
import type { CheckoutCollectorFormActions, CheckoutCollectorFormModel } from '@/features/checkout/types'

type CheckoutCollectorFormProps = {
  form: UseFormReturn<CheckoutFormValues>
  model: CheckoutCollectorFormModel
  actions: CheckoutCollectorFormActions
}

const fieldClass = 'h-11 rounded-sm border-(--color-border) bg-transparent px-4'

export const CheckoutCollectorForm = ({
  form,
  model: {
    values,
    wallets,
    selectedWallet,
    networks,
    couponCode,
    isMobileViewport,
    mobileCheckoutStep,
    connectionError,
    isConnecting,
  },
  actions: { onSubmit, onNetworkChange, onSelectWallet, onContinue, onRemoveCoupon },
}: CheckoutCollectorFormProps) => {
  const fieldError = (name: keyof CheckoutFormValues) => form.formState.errors[name]?.message
  const renderCollectorField = (
    name: 'displayName' | 'profileName' | 'username' | 'email' | 'ensName' | 'referralCode',
    label: string,
    type: 'text' | 'email' = 'text',
  ) => {
    const id = `checkout-${name}`
    return (
      <div key={name}>
        <FieldLabel htmlFor={id} className="mb-2 block">
          {label}
          <span className="ml-1 text-(--color-primary-bright)" aria-hidden="true">
            *
          </span>
        </FieldLabel>
        <Input
          id={id}
          type={type}
          className={fieldClass}
          aria-required="true"
          aria-invalid={Boolean(fieldError(name))}
          aria-describedby={fieldError(name) ? `${id}-error` : undefined}
          {...form.register(name)}
        />
        <FieldError id={`${id}-error`} message={fieldError(name)} />
      </div>
    )
  }

  return (
    <form
      id="checkout-form"
      className={isMobileViewport && mobileCheckoutStep === 'payment' ? 'hidden' : 'space-y-8'}
      onSubmit={form.handleSubmit(onSubmit)}
      noValidate
    >
      {isMobileViewport && couponCode && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-(--color-primary)/50 bg-(--color-panel) px-4 py-3">
          <span className="text-sm font-semibold">Desconto aplicado</span>
          <Button
            type="button"
            variant="link"
            className="h-auto p-0 text-sm text-(--color-primary-bright)"
            onClick={onRemoveCoupon}
          >
            Remover cupom {couponCode}
          </Button>
        </div>
      )}
      <section className="space-y-5" aria-labelledby="collector-title">
        <div>
          <h2 id="collector-title" className="mb-1 text-xl font-bold max-[760px]:sr-only">
            Perfil do colecionador
          </h2>
        </div>
        <div className="grid grid-cols-2 gap-5 max-[600px]:grid-cols-1">
          {renderCollectorField('displayName', 'Nome de exibição')}
          {renderCollectorField('username', 'Nome de usuário')}
          <div>
            <FieldLabel htmlFor="checkout-network" className="mb-2 block">
              Rede{' '}
              <span className="ml-1 text-(--color-primary-bright)" aria-hidden="true">
                *
              </span>
            </FieldLabel>
            <Select value={values.network} onValueChange={onNetworkChange}>
              <SelectTrigger
                id="checkout-network"
                aria-required="true"
                aria-invalid={Boolean(fieldError('network'))}
                className="h-11 w-full"
              >
                <SelectValue placeholder="Selecione uma rede" />
              </SelectTrigger>
              <SelectContent>
                {networks.map((network) => (
                  <SelectItem key={network} value={network}>
                    {network}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError id="checkout-network-error" message={fieldError('network')} />
          </div>
          {renderCollectorField('profileName', 'Nome do perfil')}
          <div>
            <FieldLabel htmlFor="checkout-wallet-address" className="mb-2 block">
              Endereço da carteira{' '}
              <span className="ml-1 text-(--color-primary-bright)" aria-hidden="true">
                *
              </span>
            </FieldLabel>
            <Input
              id="checkout-wallet-address"
              value={selectedWallet?.address ?? ''}
              placeholder="Endereço 0x da carteira"
              readOnly
              disabled={!selectedWallet}
              aria-required="true"
              aria-invalid={Boolean(fieldError('walletId'))}
              aria-describedby={fieldError('walletId') ? 'checkout-wallet-id-error' : undefined}
              className={fieldClass}
            />
            <FieldError id="checkout-wallet-id-error" message={fieldError('walletId')} />
          </div>
          <div>
            <FieldLabel htmlFor="checkout-secondary-wallet" className="mb-2 block">
              ENS ou carteira secundária <span className="font-normal text-(--color-muted)">(opcional)</span>
            </FieldLabel>
            <Input
              id="checkout-secondary-wallet"
              placeholder="ENS ou carteira secundária"
              className={fieldClass}
              aria-invalid={Boolean(fieldError('secondaryWalletAddress'))}
              aria-describedby={
                fieldError('secondaryWalletAddress') ? 'checkout-secondary-wallet-error' : undefined
              }
              {...form.register('secondaryWalletAddress')}
            />
            <FieldError id="checkout-secondary-wallet-error" message={fieldError('secondaryWalletAddress')} />
          </div>
          <CheckoutWalletPicker
            wallets={wallets}
            selectedWalletId={values.walletId ?? ''}
            network={values.network ?? 'Ethereum'}
            couponCode={couponCode}
            error={fieldError('walletId')}
            onSelect={onSelectWallet}
          />
          {renderCollectorField('referralCode', 'Código de indicação')}
          {renderCollectorField('email', 'E-mail', 'email')}
          {renderCollectorField('ensName', 'Nome ENS')}
        </div>
        <div>
          <FieldLabel htmlFor="checkout-collector-note" className="mb-2 block">
            Observação do colecionador <span className="font-normal text-(--color-muted)">(opcional)</span>
          </FieldLabel>
          <Textarea
            id="checkout-collector-note"
            rows={3}
            maxLength={500}
            aria-invalid={Boolean(fieldError('collectorNote'))}
            aria-describedby={fieldError('collectorNote') ? 'checkout-collector-note-error' : undefined}
            {...form.register('collectorNote')}
          />
          <FieldError id="checkout-collector-note-error" message={fieldError('collectorNote')} />
        </div>
      </section>
      {isMobileViewport && (
        <>
          {connectionError && (
            <p className="mb-0 text-sm text-(--color-destructive)" role="alert">
              {connectionError}
            </p>
          )}
          <Button
            type="button"
            className="h-14 w-full rounded-full text-base font-bold"
            disabled={!form.formState.isValid || isConnecting}
            onClick={onContinue}
          >
            {isConnecting ? 'Conectando carteira…' : 'Continuar para pagamento'}
          </Button>
        </>
      )}
    </form>
  )
}
