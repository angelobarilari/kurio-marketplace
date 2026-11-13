import * as React from 'react'
import { Slider as SliderPrimitive } from 'radix-ui'
import { cn } from '@/lib/utils'

type SliderProps = React.ComponentProps<typeof SliderPrimitive.Root> & {
  thumbLabels?: string[]
  getValueText?: (value: number) => string
}

const Slider = ({
  className,
  defaultValue,
  value,
  min = 0,
  max = 100,
  thumbLabels,
  getValueText,
  ...props
}: SliderProps) => {
  const values = React.useMemo(() => value ?? defaultValue ?? [min], [value, defaultValue, min])

  return (
    <SliderPrimitive.Root
      data-slot="slider"
      className={cn(
        'relative flex w-full touch-none items-center select-none data-disabled:opacity-50',
        className,
      )}
      defaultValue={defaultValue}
      value={value}
      min={min}
      max={max}
      {...props}
    >
      <SliderPrimitive.Track
        data-slot="slider-track"
        className="relative h-1 grow overflow-hidden rounded-full bg-(--color-border)"
      >
        <SliderPrimitive.Range data-slot="slider-range" className="absolute h-full bg-(--color-primary)" />
      </SliderPrimitive.Track>
      {values.map((_, index) => (
        <SliderPrimitive.Thumb
          key={index}
          data-slot="slider-thumb"
          className="block size-4 shrink-0 cursor-grab rounded-full border-2 border-background bg-(--color-primary) shadow-[0_0_0_1px_var(--color-primary)] transition-shadow focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-(--color-primary-bright) active:cursor-grabbing disabled:pointer-events-none disabled:opacity-50"
          aria-label={thumbLabels?.[index]}
          aria-valuetext={getValueText?.(values[index])}
        />
      ))}
    </SliderPrimitive.Root>
  )
}

export { Slider }
