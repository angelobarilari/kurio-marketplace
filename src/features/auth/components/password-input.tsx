import { useState, type ComponentProps } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

type PasswordInputProps = Omit<ComponentProps<typeof Input>, 'type'> & {
  invalid?: boolean
  visible?: boolean
  onToggle?: () => void
  showToggle?: boolean
  toggleClassName?: string
}

export const PasswordInput = ({
  invalid,
  visible,
  onToggle,
  showToggle = true,
  toggleClassName,
  className,
  ...props
}: PasswordInputProps) => {
  const [localVisible, setLocalVisible] = useState(false)
  const isVisible = visible ?? localVisible

  const toggleVisibility = () => {
    if (onToggle) onToggle()
    else setLocalVisible((current) => !current)
  }

  return (
    <div className="relative">
      <Input
        {...props}
        type={isVisible ? 'text' : 'password'}
        aria-invalid={invalid}
        className={cn(className, 'pr-12')}
      />
      {showToggle && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn('absolute top-1/2 right-1.5 -translate-y-1/2 text-(--color-muted)', toggleClassName)}
          onClick={toggleVisibility}
          aria-label={isVisible ? 'Ocultar senha' : 'Mostrar senha'}
        >
          {isVisible ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
        </Button>
      )}
    </div>
  )
}
