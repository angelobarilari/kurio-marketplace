import { useState } from 'react'
import { isAxiosError } from 'axios'
import { useQueryClient } from '@tanstack/react-query'
import type { UseFormReturn } from 'react-hook-form'
import { applyApiFieldErrors } from '@/features/auth/utils/form-errors'
import { sessionQueryKey } from '@/features/auth/hooks/use-session'
import {
  useCheckoutWalletConnection,
  useConnectCheckoutWallet,
  useCreateOrder,
  useDisconnectCheckoutWallet,
} from '@/features/checkout/hooks/use-checkout'
import type { CheckoutFormValues } from '@/features/checkout/schemas'
import { getOrderByAttempt } from '@/features/order/api/orders'
import type { CartQuote } from '@/features/cart/types'
import type { Wallet } from '@/types/account'
import type { CheckoutApiError, CheckoutDraft } from '@/types/order'

type UseCheckoutSubmissionInput = {
  sessionId: string
  form: UseFormReturn<CheckoutFormValues>
  values: Partial<CheckoutFormValues>
  wallets: Wallet[]
  quote: {
    data?: CartQuote
    refetch: () => unknown
  }
  getAttemptKey: () => string
  onOpenOrder: (orderId: string) => void
  onLoginRequired: () => Promise<unknown>
  onPaymentReady: () => void
}

const checkoutFields: (keyof CheckoutFormValues)[] = [
  'displayName',
  'profileName',
  'username',
  'email',
  'ensName',
  'secondaryWalletAddress',
  'referralCode',
  'collectorNote',
  'network',
  'walletId',
  'walletType',
]

export const useCheckoutSubmission = ({
  sessionId,
  form,
  values,
  wallets,
  quote,
  getAttemptKey,
  onOpenOrder,
  onLoginRequired,
  onPaymentReady,
}: UseCheckoutSubmissionInput) => {
  const queryClient = useQueryClient()
  const connection = useCheckoutWalletConnection(sessionId)
  const connectWallet = useConnectCheckoutWallet(sessionId)
  const disconnectWallet = useDisconnectCheckoutWallet(sessionId)
  const createOrder = useCreateOrder(sessionId)
  const [checkoutError, setCheckoutError] = useState('')
  const [connectionError, setConnectionError] = useState('')
  const [mustReviewQuote, setMustReviewQuote] = useState(false)
  const [reviewedFingerprint, setReviewedFingerprint] = useState<string | null>(null)
  const connectedForSelection =
    Boolean(connection.data) &&
    connection.data?.walletId === values.walletId &&
    connection.data?.network === values.network &&
    connection.data?.provider === values.walletType

  const connectSelectedWallet = async (formValues: CheckoutFormValues) => {
    const wallet = wallets.find((candidate) => candidate.id === formValues.walletId)
    if (!wallet) return null
    if (connectedForSelection && connection.data) return connection.data

    try {
      setConnectionError('')
      return await connectWallet.mutateAsync({
        walletId: wallet.id,
        network: formValues.network,
        provider: formValues.walletType,
      })
    } catch (error) {
      setConnectionError(
        (isAxiosError<CheckoutApiError>(error) && error.response?.data.message) ||
          'Não foi possível conectar a carteira. Tente novamente.',
      )
      return null
    }
  }

  const submit = async (formValues: CheckoutFormValues) => {
    setCheckoutError('')
    const wallet = wallets.find((candidate) => candidate.id === formValues.walletId)
    if (!wallet || !quote.data) {
      setCheckoutError('Selecione uma carteira e atualize a cotação antes de continuar.')
      return
    }

    const walletConnection = await connectSelectedWallet(formValues)
    if (!walletConnection) return
    const activeAttemptKey = getAttemptKey()
    const checkout: CheckoutDraft = {
      displayName: formValues.displayName,
      profileName: formValues.profileName,
      username: formValues.username,
      email: formValues.email,
      network: formValues.network,
      walletId: wallet.id,
      walletAddress: wallet.address,
      secondaryWalletAddress: formValues.secondaryWalletAddress || null,
      walletType: formValues.walletType,
      ensName: formValues.ensName,
      referralCode: formValues.referralCode,
      collectorNote: formValues.collectorNote || null,
    }

    try {
      const order = await createOrder.mutateAsync({
        idempotencyKey: activeAttemptKey,
        checkout,
        quoteRevision: quote.data,
        connectionId: walletConnection.id,
      })
      onOpenOrder(order.id)
    } catch (error) {
      if (isAxiosError<CheckoutApiError>(error) && error.response?.status === 401) {
        queryClient.removeQueries({ queryKey: sessionQueryKey })
        queryClient.removeQueries({ predicate: (query) => query.meta?.private === true })
        await onLoginRequired()
        return
      }

      const apiError = isAxiosError<CheckoutApiError>(error) ? error.response?.data : undefined
      if (apiError?.code === 'QUOTE_STALE' || apiError?.code === 'EDITION_UNAVAILABLE') {
        setMustReviewQuote(true)
        setReviewedFingerprint(null)
        void quote.refetch()
      }
      const fallbackMessage = applyApiFieldErrors(error, form.setError, {
        fields: checkoutFields,
        fieldNames: { walletAddress: 'walletId' },
        fallbackMessage:
          apiError?.message ??
          'Não foi possível confirmar o pedido. A tentativa pode ser recuperada sem duplicar a compra.',
      })

      try {
        const recoveredOrder = await getOrderByAttempt(activeAttemptKey)
        onOpenOrder(recoveredOrder.id)
      } catch (recoveryError) {
        setCheckoutError(
          isAxiosError(recoveryError) && recoveryError.response?.status !== 404
            ? 'A confirmação foi interrompida e não foi possível consultar a tentativa. Tente novamente com segurança.'
            : fallbackMessage,
        )
      }
    }
  }

  const continueToPayment = async () => {
    if (!(await form.trigger())) return
    const walletConnection = await connectSelectedWallet(form.getValues())
    if (walletConnection) onPaymentReady()
  }

  const disconnect = () => {
    if (!connection.data) return
    disconnectWallet.mutate(connection.data.id, {
      onError: () => setConnectionError('Não foi possível desconectar a carteira.'),
    })
  }

  const resetQuoteReview = () => {
    setCheckoutError('')
    setMustReviewQuote(false)
    setReviewedFingerprint(null)
  }

  return {
    connection,
    connectWallet,
    disconnectWallet,
    createOrder,
    checkoutError,
    connectionError,
    mustReviewQuote,
    reviewedFingerprint,
    connectedForSelection,
    submit,
    continueToPayment,
    disconnect,
    resetQuoteReview,
    setReviewedFingerprint,
  }
}
