import { isAxiosError } from 'axios'
import { LoaderCircle } from 'lucide-react'
import type { CheckoutAttemptStatusModel } from '@/features/checkout/types'

export const CheckoutAttemptStatus = ({ model }: { model: CheckoutAttemptStatusModel }) => (
  <>
    {model.hasAttempt &&
      model.isError &&
      isAxiosError(model.error) &&
      model.error.response?.status !== 404 && (
        <div className="mb-6 rounded-lg border border-(--color-destructive) p-4 text-sm" role="alert">
          Não foi possível consultar uma tentativa anterior. Você pode tentar novamente sem criar uma cobrança
          duplicada.
        </div>
      )}
    {model.hasAttempt && model.isPending && (
      <p className="mb-6 flex items-center gap-2 text-sm text-(--color-muted)" role="status">
        <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
        Verificando se a tentativa anterior criou um pedido…
      </p>
    )}
  </>
)
