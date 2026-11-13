import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'

const MIN_PRICE_CENTS = 2
const MAX_PRICE_CENTS = 1230
const MINIMUM_RANGE_CENTS = 1

const toCents = (priceEth: string): number => Math.round(Number(priceEth) * 100)
const formatEth = (cents: number): string =>
  new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100)

const getRangeFromProps = (minPriceEth?: string, maxPriceEth?: string): number[] => {
  const min = Math.max(
    MIN_PRICE_CENTS,
    Math.min(MAX_PRICE_CENTS - MINIMUM_RANGE_CENTS, toCents(minPriceEth ?? '0.02')),
  )
  const max = Math.max(min + MINIMUM_RANGE_CENTS, Math.min(MAX_PRICE_CENTS, toCents(maxPriceEth ?? '12.30')))
  return [min, max]
}

type PriceFilterProps = {
  idPrefix: string
  minPriceEth?: string
  maxPriceEth?: string
  hasInvalidRange: boolean
  onApply: (minPriceEth: string | undefined, maxPriceEth: string | undefined) => void
}

export const PriceFilter = ({
  idPrefix,
  minPriceEth,
  maxPriceEth,
  hasInvalidRange,
  onApply,
}: PriceFilterProps) => {
  const [range, setRange] = useState(() => getRangeFromProps(minPriceEth, maxPriceEth))

  const applyRange = () =>
    onApply(
      range[0] === MIN_PRICE_CENTS ? undefined : (range[0] / 100).toFixed(2),
      range[1] === MAX_PRICE_CENTS ? undefined : (range[1] / 100).toFixed(2),
    )

  return (
    <div className="grid gap-2.5" data-testid="price-filter">
      <p className="m-0 text-xs text-(--color-foreground)" id={idPrefix + '-value'} aria-live="polite">
        Preço: {formatEth(range[0])} - {formatEth(range[1])} ETH
      </p>
      <Slider
        className="h-5.5"
        data-testid="price-slider"
        value={range}
        min={MIN_PRICE_CENTS}
        max={MAX_PRICE_CENTS}
        step={1}
        minStepsBetweenThumbs={MINIMUM_RANGE_CENTS}
        onValueChange={setRange}
        disabled={hasInvalidRange}
        aria-labelledby={idPrefix + '-value'}
        thumbLabels={['Preço mínimo', 'Preço máximo']}
        getValueText={(value) => formatEth(value) + ' ETH'}
      />
      {hasInvalidRange && (
        <p id={idPrefix + '-error'} className="m-0 text-[11px] text-(--color-destructive)" role="alert">
          A faixa de preço informada na URL é inválida.
        </p>
      )}
      <Button
        type="button"
        className="min-h-9 justify-self-start rounded bg-(--color-primary) px-4 font-bold text-primary-foreground! hover:bg-(--color-primary-bright)"
        onClick={applyRange}
        disabled={hasInvalidRange}
      >
        Aplicar
      </Button>
    </div>
  )
}
