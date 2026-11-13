import { useCallback, useState } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { useProfile, useWallets } from '@/features/auth/hooks/use-account'
import { useSession } from '@/features/auth/hooks/use-session'
import { useCart } from '@/features/cart/hooks/use-cart'
import { useCouponApplication } from '@/features/cart/hooks/use-coupon-application'
import { useCheckoutAttempt } from '@/features/checkout/hooks/use-checkout-attempt'
import { useCheckoutForm } from '@/features/checkout/hooks/use-checkout-form'
import { useCheckoutSubmission } from '@/features/checkout/hooks/use-checkout-submission'
import type {
  CheckoutAttemptStatusModel,
  CheckoutBlockingPageState,
  CheckoutCollectorFormActions,
  CheckoutCollectorFormModel,
  CheckoutPageState,
  CheckoutPaymentPanelActions,
  CheckoutPaymentPanelModel,
  CheckoutStep,
} from '@/features/checkout/types'
import { useMediaQuery } from '@/hooks/use-media-query'

export const useCheckoutController = () => {
  const navigate = useNavigate()
  const search = useSearch({ from: '/checkout' })
  const session = useSession()
  const cart = useCart()
  const sessionId = session.data?.id ?? ''
  const userId = session.data?.user.id ?? ''
  const profile = useProfile(sessionId)
  const wallets = useWallets(sessionId)
  const [mobileStep, setMobileStep] = useState<CheckoutStep>('collector')
  const isMobile = useMediaQuery('(max-width: 760px)')
  const coupon = useCouponApplication({
    enabled: Boolean(cart.data?.items.length),
    initialCouponCode: search.couponCode ?? null,
  })
  const checkoutForm = useCheckoutForm({
    profile: profile.data,
    wallets: wallets.data,
    cart: cart.data,
    requestedNetwork: search.network,
  })
  const { couponCode, couponInput, quote } = coupon
  const navigateToOrder = useCallback(
    (orderId: string) => void navigate({ to: '/orders/$orderId', params: { orderId }, replace: true }),
    [navigate],
  )
  const attempt = useCheckoutAttempt({ userId, sessionId, onRecovered: navigateToOrder })
  const clearAttempt = attempt.clear
  const openOrder = useCallback(
    (orderId: string) => {
      clearAttempt()
      navigateToOrder(orderId)
    },
    [clearAttempt, navigateToOrder],
  )
  const loginRequired = useCallback(
    () =>
      navigate({
        to: '/login',
        search: { returnTo: '/checkout', couponCode: couponCode ?? undefined },
      }),
    [couponCode, navigate],
  )
  const submission = useCheckoutSubmission({
    sessionId,
    form: checkoutForm.form,
    values: checkoutForm.values,
    wallets: wallets.data ?? [],
    quote,
    getAttemptKey: attempt.getOrCreateKey,
    onOpenOrder: openOrder,
    onLoginRequired: loginRequired,
    onPaymentReady: () => setMobileStep('payment'),
  })
  const searchCatalog = useCallback(
    (value: string) => void navigate({ to: '/', search: { q: value || undefined }, hash: 'catalog' }),
    [navigate],
  )

  let pageState: CheckoutPageState = { kind: 'ready' }
  if (
    session.isPending ||
    cart.isPending ||
    (session.data && (profile.isPending || wallets.isPending || submission.connection.isPending))
  ) {
    pageState = { kind: 'loading' }
  } else if (!session.data && session.isError) {
    pageState = { kind: 'session-error', onRetry: () => void session.refetch() }
  } else if (!session.data) {
    pageState = { kind: 'unauthenticated', couponCode: search.couponCode }
  } else if (cart.isError || !cart.data || profile.isError || wallets.isError) {
    pageState = {
      kind: 'load-error',
      onRetry: () => {
        void cart.refetch()
        void profile.refetch()
        void wallets.refetch()
      },
    }
  } else if (!cart.data.items.length) {
    pageState = { kind: 'empty' }
  }

  if (pageState.kind !== 'ready') {
    return {
      status: 'state' as const,
      pageState: pageState satisfies CheckoutBlockingPageState,
      searchCatalog,
    }
  }

  if (!cart.data) {
    const unavailableCartState = {
      kind: 'load-error' as const,
      onRetry: () => void cart.refetch(),
    }
    return { status: 'state' as const, pageState: unavailableCartState, searchCatalog }
  }

  const collectorModel = {
    values: checkoutForm.values,
    wallets: wallets.data ?? [],
    selectedWallet: checkoutForm.selectedWallet,
    networks: checkoutForm.networks,
    couponCode,
    isMobileViewport: isMobile,
    mobileCheckoutStep: mobileStep,
    connectionError: submission.connectionError,
    isConnecting: submission.connectWallet.isPending,
  } satisfies CheckoutCollectorFormModel
  const collectorActions = {
    onSubmit: submission.submit,
    onNetworkChange: checkoutForm.changeNetwork,
    onSelectWallet: checkoutForm.selectWallet,
    onContinue: () => void submission.continueToPayment(),
    onRemoveCoupon: coupon.removeCoupon,
  } satisfies CheckoutCollectorFormActions
  const paymentModel = {
    values: checkoutForm.values,
    cart: cart.data,
    wallets: wallets.data ?? [],
    couponCode,
    couponInput,
    couponError: coupon.couponError,
    couponErrorRetryable: coupon.couponErrorRetryable,
    isApplyingCoupon: coupon.isApplyingCoupon,
    checkoutError: submission.checkoutError,
    connectionError: submission.connectionError,
    isMobile,
    mobileStep,
    connectedForSelection: submission.connectedForSelection,
    mustReviewQuote: submission.mustReviewQuote,
    reviewedFingerprint: submission.reviewedFingerprint,
    attemptPending: Boolean(attempt.key && attempt.order.isPending),
    quote: {
      data: quote.data,
      error: quote.error,
      isPending: quote.isPending,
      isError: quote.isError,
      isFetching: quote.isFetching,
    },
    connectionHasError: submission.connection.isError,
    isConnecting: submission.connectWallet.isPending,
    isDisconnecting: submission.disconnectWallet.isPending,
    isCreatingOrder: submission.createOrder.isPending,
  } satisfies CheckoutPaymentPanelModel
  const paymentActions = {
    onCouponInputChange: coupon.updateCouponInput,
    onApplyCoupon: () => {
      submission.resetQuoteReview()
      void coupon.applyCoupon()
    },
    onRemoveCoupon: coupon.removeCoupon,
    onRetryCoupon: () => void coupon.applyCoupon(),
    onSelectWallet: checkoutForm.selectWallet,
    onChangeWallet: () => setMobileStep('collector'),
    onDisconnect: submission.disconnect,
    onAcceptQuote: submission.setReviewedFingerprint,
    onRetryQuote: () => void quote.refetch(),
    onRetryConnection: () => void submission.connection.refetch(),
  } satisfies CheckoutPaymentPanelActions
  const attemptModel = {
    hasAttempt: Boolean(attempt.key),
    isPending: attempt.order.isPending,
    isError: attempt.order.isError,
    error: attempt.order.error,
  } satisfies CheckoutAttemptStatusModel

  return {
    status: 'ready' as const,
    pageState,
    searchCatalog,
    form: checkoutForm.form,
    collector: { model: collectorModel, actions: collectorActions },
    payment: { model: paymentModel, actions: paymentActions },
    attempt: attemptModel,
    page: {
      currentPage: 'Pagamento',
      mobileTitle: mobileStep === 'payment' ? 'Pagamento com carteira' : 'Dados do colecionador',
      backLabel: mobileStep === 'payment' ? 'Voltar aos dados do colecionador' : 'Voltar ao carrinho',
      onBack: () => {
        if (mobileStep === 'payment') setMobileStep('collector')
        else void navigate({ to: '/cart' })
      },
    },
  }
}
