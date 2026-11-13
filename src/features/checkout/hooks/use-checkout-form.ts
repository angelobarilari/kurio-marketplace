import { useEffect, useMemo } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useWatch } from 'react-hook-form'
import { checkoutNetworks, isNetwork } from '@/features/checkout/constants'
import { checkoutSchema, type CheckoutFormValues } from '@/features/checkout/schemas'
import type { Profile } from '@/features/auth/types'
import type { Cart } from '@/features/cart/types'
import type { Network, Wallet } from '@/types/account'

const defaultValues: CheckoutFormValues = {
  displayName: '',
  profileName: '',
  username: '',
  email: '',
  ensName: '',
  secondaryWalletAddress: '',
  referralCode: '',
  collectorNote: '',
  network: 'Ethereum',
  walletId: '',
  walletType: 'MetaMask',
}

type UseCheckoutFormInput = {
  profile?: Profile
  wallets?: Wallet[]
  cart?: Cart
  requestedNetwork?: string
}

export const useCheckoutForm = ({ profile, wallets = [], cart, requestedNetwork }: UseCheckoutFormInput) => {
  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    mode: 'onChange',
    defaultValues,
  })
  const values = useWatch({ control: form.control })
  const cartNetworks = useMemo<Network[]>(
    () => Array.from(new Set(cart?.items.map((item) => item.nft.network).filter(isNetwork) ?? [])),
    [cart?.items],
  )
  const selectedWallet = wallets.find((wallet) => wallet.id === values.walletId)

  useEffect(() => {
    if (!profile || !cart || form.formState.isDirty) return

    const preferredNetwork: Network =
      (requestedNetwork && isNetwork(requestedNetwork) ? requestedNetwork : undefined) ??
      wallets[0]?.network ??
      cartNetworks[0] ??
      'Ethereum'
    const preferredWallet = wallets.find((wallet) => wallet.network === preferredNetwork)

    form.reset({
      displayName: profile.displayName,
      profileName: profile.walletAlias || profile.displayName,
      username: profile.username,
      email: profile.email,
      ensName: preferredWallet?.ensName ?? profile.ensName ?? '',
      secondaryWalletAddress: '',
      referralCode: '',
      collectorNote: '',
      network: preferredNetwork,
      walletId: preferredWallet?.id ?? '',
      walletType: preferredWallet?.provider ?? 'MetaMask',
    })
  }, [cart, cartNetworks, form, profile, requestedNetwork, wallets])

  const selectWallet = (walletId: string) => {
    const wallet = wallets.find((candidate) => candidate.id === walletId)
    if (!wallet) return
    form.setValue('walletId', wallet.id, { shouldValidate: true })
    form.setValue('network', wallet.network, { shouldValidate: true })
    form.setValue('walletType', wallet.provider, { shouldValidate: true })
    form.setValue('ensName', wallet.ensName ?? profile?.ensName ?? '', { shouldValidate: true })
  }

  const changeNetwork = (value: string) => {
    if (!isNetwork(value)) return
    const nextWallet = wallets.find((wallet) => wallet.network === value)
    form.setValue('network', value, { shouldValidate: true })
    form.setValue('walletId', nextWallet?.id ?? '', { shouldValidate: true })
    form.setValue('walletType', nextWallet?.provider ?? 'MetaMask', { shouldValidate: true })
    form.setValue('ensName', nextWallet?.ensName ?? profile?.ensName ?? '', { shouldValidate: true })
  }

  return {
    form,
    values,
    selectedWallet,
    networks: checkoutNetworks,
    selectWallet,
    changeNetwork,
  }
}
