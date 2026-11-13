import { useEffect, useId, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { FieldError } from '@/components/ui/field-error'
import { FieldLabel } from '@/components/ui/field-label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useCreateWallet, useUpdateWallet } from '@/features/auth/hooks/use-account'
import { applyApiFieldErrors } from '@/features/auth/utils/form-errors'
import { getApiError } from '@/features/auth/utils/get-api-error'
import { walletSchema, type WalletFormValues } from '@/features/auth/schemas'
import type { Wallet } from '@/features/auth/types'

type WalletFormProps = {
  sessionId: string
  priority: 'primary' | 'secondary'
  wallet?: Wallet
  onSaved?: () => void
}

const inputClass =
  'h-11 w-full rounded-sm border-(--color-border) bg-transparent px-4 text-(--color-foreground) placeholder:text-(--color-muted)'

const defaults = (priority: WalletFormProps['priority'], wallet?: Wallet): WalletFormValues => ({
  displayName: wallet?.displayName ?? '',
  alias: wallet?.alias ?? '',
  network: wallet?.network ?? 'Ethereum',
  address: wallet?.address ?? '',
  provider: wallet?.provider ?? 'MetaMask',
  ensName: wallet?.ensName ?? '',
  priority,
})

export const WalletForm = ({ sessionId, priority, wallet, onSaved }: WalletFormProps) => {
  const formId = useId()
  const createWallet = useCreateWallet(sessionId)
  const updateWallet = useUpdateWallet(sessionId)
  const mutation = wallet ? updateWallet : createWallet
  const submitLabel = wallet || priority === 'primary' ? 'Salvar carteira' : 'Adicionar carteira'
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const form = useForm<WalletFormValues>({
    resolver: zodResolver(walletSchema),
    defaultValues: defaults(priority, wallet),
  })

  useEffect(() => form.reset(defaults(priority, wallet)), [form, priority, wallet])

  const submit = form.handleSubmit((values) => {
    setStatus(null)
    const input = { ...values, ensName: values.ensName || null }
    const options = {
      onSuccess: () => {
        form.reset(values)
        setStatus({ type: 'success', message: 'Carteira salva.' })
        onSaved?.()
      },
      onError: (error: unknown) => {
        const message = applyApiFieldErrors(error, form.setError, {
          fields: ['displayName', 'alias', 'network', 'address', 'provider', 'ensName', 'priority'],
          fallbackMessage: 'Não foi possível salvar a carteira.',
        })
        if (getApiError(error)?.fieldErrors?.address) {
          setStatus(null)
          return
        }
        setStatus({ type: 'error', message })
      },
    }
    if (wallet) updateWallet.mutate({ id: wallet.id, input }, options)
    else createWallet.mutate(input, options)
  })

  const fields = [
    { name: 'displayName', label: 'Nome de exibição', placeholder: 'Principal', optional: false },
    { name: 'alias', label: 'Apelido da carteira', placeholder: 'Minha carteira', optional: false },
    {
      name: 'address',
      label: 'Endereço da carteira',
      placeholder: priority === 'primary' ? 'Endereço 0x ou Solana' : 'Endereço secundário',
      optional: false,
    },
    { name: 'ensName', label: 'Nome ENS', placeholder: 'nome.eth', optional: true },
  ] as const

  return (
    <form className="grid grid-cols-2 gap-x-7 gap-y-5 max-[760px]:grid-cols-1" onSubmit={submit} noValidate>
      {fields.slice(0, 2).map(({ name, label, placeholder, optional }) => {
        const id = `${formId}-${name}`
        const error = form.formState.errors[name]
        return (
          <div key={name}>
            <FieldLabel className="mb-2 block" htmlFor={id}>
              {label}
              {!optional && (
                <span className="text-red-400" aria-hidden="true">
                  *
                </span>
              )}
            </FieldLabel>
            <Input
              id={id}
              className={inputClass}
              placeholder={placeholder}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? `${id}-error` : undefined}
              {...form.register(name)}
            />
            <FieldError id={`${id}-error`} message={error?.message} />
          </div>
        )
      })}

      <Controller
        control={form.control}
        name="network"
        render={({ field, fieldState }) => (
          <div>
            <FieldLabel className="mb-2 block" htmlFor={`${formId}-network`}>
              Rede
              <span className="text-red-400" aria-hidden="true">
                *
              </span>
            </FieldLabel>
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger
                id={`${formId}-network`}
                className={inputClass}
                aria-invalid={Boolean(fieldState.error)}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="w-(--radix-select-trigger-width)">
                {['Ethereum', 'Polygon', 'Solana'].map((network) => (
                  <SelectItem key={network} value={network}>
                    {network}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError id={`${formId}-network-error`} message={fieldState.error?.message} />
          </div>
        )}
      />

      <Controller
        control={form.control}
        name="provider"
        render={({ field, fieldState }) => (
          <div>
            <FieldLabel className="mb-2 block" htmlFor={`${formId}-provider`}>
              Tipo de carteira
              <span className="text-red-400" aria-hidden="true">
                *
              </span>
            </FieldLabel>
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger
                id={`${formId}-provider`}
                className={inputClass}
                aria-invalid={Boolean(fieldState.error)}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="w-(--radix-select-trigger-width)">
                {['MetaMask', 'WalletConnect', 'Coinbase Wallet'].map((provider) => (
                  <SelectItem key={provider} value={provider}>
                    {provider}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError id={`${formId}-provider-error`} message={fieldState.error?.message} />
          </div>
        )}
      />

      {fields.slice(2).map(({ name, label, placeholder, optional }) => {
        const id = `${formId}-${name}`
        const error = form.formState.errors[name]
        return (
          <div key={name}>
            <FieldLabel className="mb-2 block" htmlFor={id}>
              {label}
              {!optional && (
                <span className="text-red-400" aria-hidden="true">
                  *
                </span>
              )}
            </FieldLabel>
            <Input
              id={id}
              className={inputClass}
              placeholder={placeholder}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? `${id}-error` : undefined}
              {...form.register(name)}
            />
            <FieldError id={`${id}-error`} message={error?.message} />
          </div>
        )
      })}

      <div className="col-span-2 flex items-center gap-4 max-[760px]:col-span-1">
        <Button
          type="submit"
          className="min-w-40"
          disabled={mutation.isPending || (Boolean(wallet) && !form.formState.isDirty)}
        >
          {mutation.isPending ? 'Salvando…' : submitLabel}
        </Button>
        {status && (
          <p
            role={status.type === 'success' ? 'status' : 'alert'}
            className={status.type === 'error' ? 'text-sm text-red-300' : 'text-sm'}
          >
            {status.message}
          </p>
        )}
        {wallet?.priority === 'secondary' && (
          <Button
            type="button"
            variant="outline"
            disabled={updateWallet.isPending}
            onClick={() =>
              updateWallet.mutate({
                id: wallet.id,
                input: {
                  displayName: wallet.displayName,
                  alias: wallet.alias,
                  network: wallet.network,
                  address: wallet.address,
                  provider: wallet.provider,
                  ensName: wallet.ensName,
                  priority: 'primary',
                },
              })
            }
          >
            Definir como principal
          </Button>
        )}
      </div>
    </form>
  )
}
