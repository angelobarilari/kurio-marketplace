import { useId, useState, type ReactNode } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { FaFacebookF } from 'react-icons/fa6'
import { FcGoogle } from 'react-icons/fc'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { FieldError } from '@/components/ui/field-error'
import { FieldLabel } from '@/components/ui/field-label'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { applyApiFieldErrors } from '@/features/auth/utils/form-errors'
import { getApiError } from '@/features/auth/utils/get-api-error'
import { useLogin, usePasswordRecovery, useRegister, useSocialLogin } from '@/features/auth/hooks/use-session'
import { PasswordInput } from '@/features/auth/components/password-input'
import { createAuthFormSchema, passwordRecoverySchema, type AuthFormValues } from '@/features/auth/schemas'
import type { Session } from '@/features/auth/types'

type AuthMode = 'login' | 'register'
type AuthDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialMode?: AuthMode
  onAuthenticated?: (session: Session) => void
  presentation?: 'dialog' | 'page'
  pageFooter?: ReactNode
}
const initialValues: AuthFormValues = { username: '', email: '', password: '', confirmation: '' }

export const AuthDialog = ({
  open,
  onOpenChange,
  initialMode = 'login',
  onAuthenticated,
  presentation = 'dialog',
  pageFooter,
}: AuthDialogProps) => {
  const formId = useId()
  const [mode, setMode] = useState<AuthMode>(initialMode)
  const [showPassword, setShowPassword] = useState(false)
  const loginMutation = useLogin()
  const registerMutation = useRegister()
  const recoveryMutation = usePasswordRecovery()
  const socialMutation = useSocialLogin()
  const mutation = mode === 'login' ? loginMutation : registerMutation
  const form = useForm<AuthFormValues>({
    resolver: zodResolver(createAuthFormSchema(mode)),
    defaultValues: initialValues,
  })

  const resetTransientState = () => {
    loginMutation.reset()
    registerMutation.reset()
    recoveryMutation.reset()
    socialMutation.reset()
    form.clearErrors()
  }

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      resetTransientState()
      form.reset(initialValues)
      setShowPassword(false)
      setMode(initialMode)
    }
    onOpenChange(nextOpen)
  }

  const changeMode = (nextMode: AuthMode) => {
    setMode(nextMode)
    resetTransientState()
  }

  const submit = form.handleSubmit((values) => {
    const onSuccess = (session: Session) => {
      onAuthenticated?.(session)
      handleOpenChange(false)
    }
    const onError = (error: unknown) =>
      applyApiFieldErrors(error, form.setError, {
        fields: ['username', 'email', 'password', 'confirmation'],
        fieldNames: { passwordConfirmation: 'confirmation' },
        fallbackMessage: 'Não foi possível autenticar.',
      })
    if (mode === 'login') {
      loginMutation.mutate({ email: values.email, password: values.password }, { onSuccess, onError })
      return
    }
    registerMutation.mutate(
      {
        username: values.username,
        email: values.email,
        password: values.password,
        passwordConfirmation: values.confirmation,
      },
      { onSuccess, onError },
    )
  })

  const recoverPassword = () => {
    const validation = passwordRecoverySchema.safeParse({ email: form.getValues('email') })
    if (!validation.success) {
      form.setError('email', { type: 'validate', message: validation.error.issues[0]?.message })
      return
    }
    form.clearErrors('email')
    recoveryMutation.mutate(validation.data)
  }

  const errors = form.formState.errors
  const apiError = getApiError(mutation.error)
  const inputClass = 'h-12 rounded-[5px] bg-background px-4 text-(--color-muted)'
  const isPage = presentation === 'page'

  const formContent = (
    <>
      {!isPage && (
        <div className="mb-9 flex justify-center gap-2.5 text-xl font-bold" aria-label="Modo de acesso">
          <Button
            type="button"
            variant="ghost"
            className={`h-auto bg-transparent px-0 text-xl hover:bg-transparent ${mode === 'login' ? 'text-(--color-primary-bright)' : 'text-(--color-foreground)'}`}
            onClick={() => changeMode('login')}
          >
            Entrar
          </Button>
          <span aria-hidden="true" className="text-(--color-primary-bright)">
            |
          </span>
          <Button
            type="button"
            variant="ghost"
            className={`h-auto bg-transparent px-0 text-xl hover:bg-transparent ${mode === 'register' ? 'text-(--color-primary-bright)' : 'text-(--color-foreground)'}`}
            onClick={() => changeMode('register')}
          >
            Criar conta
          </Button>
        </div>
      )}
      {isPage ? (
        <h1 className="text-center text-xl font-bold">
          {mode === 'login' ? 'Entrar' : 'Criar perfil de colecionador'}
        </h1>
      ) : (
        <DialogTitle className="sr-only">
          {mode === 'login' ? 'Entrar na Kurio' : 'Criar perfil de colecionador'}
        </DialogTitle>
      )}
      {!isPage && (
        <DialogDescription className="mx-auto mb-7 max-w-115 text-center text-[13px] leading-relaxed text-(--color-foreground)">
          {mode === 'login'
            ? 'Entre para gerenciar sua carteira, coleção e perfil de criador.'
            : 'Crie seu perfil de colecionador e conecte uma carteira quando quiser.'}
        </DialogDescription>
      )}

      <form className={isPage ? 'mt-8 space-y-3' : 'space-y-3'} onSubmit={submit} noValidate>
        {mode === 'register' && (
          <div>
            <FieldLabel visuallyHidden htmlFor={`${formId}-username`}>
              Nome de usuário
            </FieldLabel>
            <Input
              id={`${formId}-username`}
              placeholder="Nome de usuário"
              autoComplete="username"
              aria-invalid={Boolean(errors.username)}
              aria-describedby={errors.username ? `${formId}-username-error` : undefined}
              className={inputClass}
              {...form.register('username')}
            />
            <FieldError id={`${formId}-username-error`} message={errors.username?.message} />
          </div>
        )}
        <div>
          <FieldLabel visuallyHidden htmlFor={`${formId}-email`}>
            E-mail
          </FieldLabel>
          <Input
            id={`${formId}-email`}
            type="email"
            placeholder={isPage && mode === 'register' ? 'Digite seu e-mail' : 'contato@email.com'}
            autoComplete="email"
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? `${formId}-email-error` : undefined}
            className={inputClass}
            {...form.register('email', { onChange: () => recoveryMutation.reset() })}
          />
          <FieldError id={`${formId}-email-error`} message={errors.email?.message} />
        </div>
        <div>
          <div className="relative">
            <FieldLabel visuallyHidden htmlFor={`${formId}-password`}>
              Senha
            </FieldLabel>
            <PasswordInput
              id={`${formId}-password`}
              placeholder="Senha"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              invalid={Boolean(errors.password)}
              aria-describedby={errors.password ? `${formId}-password-error` : undefined}
              className={inputClass}
              {...form.register('password')}
              visible={showPassword}
              onToggle={() => setShowPassword((visible) => !visible)}
              toggleClassName="right-1 bg-transparent hover:bg-transparent hover:text-(--color-primary-bright)"
            />
          </div>
          <FieldError id={`${formId}-password-error`} message={errors.password?.message} />
        </div>
        {mode === 'register' && (
          <div>
            <FieldLabel visuallyHidden htmlFor={`${formId}-confirmation`}>
              Confirmar senha
            </FieldLabel>
            <PasswordInput
              id={`${formId}-confirmation`}
              placeholder="Confirmar senha"
              autoComplete="new-password"
              invalid={Boolean(errors.confirmation)}
              aria-describedby={errors.confirmation ? `${formId}-confirmation-error` : undefined}
              className={inputClass}
              {...form.register('confirmation')}
              visible={showPassword}
              showToggle={false}
            />
            <FieldError id={`${formId}-confirmation-error`} message={errors.confirmation?.message} />
          </div>
        )}
        {mode === 'login' && (
          <div className="flex min-h-7 items-center justify-end">
            {recoveryMutation.isSuccess ? (
              <p className="mb-0 text-right text-[11px] text-(--color-muted)" role="status">
                {recoveryMutation.data.message}
              </p>
            ) : (
              <Button
                type="button"
                variant="ghost"
                className="h-auto px-0 text-xs font-normal text-(--color-primary-bright) hover:bg-transparent hover:text-(--color-primary)"
                disabled={recoveryMutation.isPending}
                onClick={recoverPassword}
              >
                {recoveryMutation.isPending ? 'Enviando...' : 'Esqueceu a senha?'}
              </Button>
            )}
          </div>
        )}
        {getApiError(recoveryMutation.error) && (
          <p className="text-right text-xs text-red-300" role="alert">
            {getApiError(recoveryMutation.error)?.message}
          </p>
        )}
        {apiError && !apiError.fieldErrors && (
          <p className="text-center text-sm text-red-300" role="alert">
            {apiError.message}
          </p>
        )}
        <Button
          className={`mt-1 w-full rounded-[5px] font-bold ${isPage ? 'h-14 text-lg' : 'h-12 text-sm'}`}
          type="submit"
          disabled={mutation.isPending}
        >
          {mutation.isPending
            ? 'Aguarde...'
            : mode === 'login'
              ? 'Entrar'
              : isPage
                ? 'Criar perfil'
                : 'Criar conta'}
        </Button>
      </form>

      <div className={`${isPage ? 'my-8' : 'my-5'} flex items-center gap-3`} aria-hidden="true">
        <Separator className="flex-1" />
        <span className={`${isPage ? 'text-sm' : 'text-xs'} text-(--color-foreground)`}>Ou continue com</span>
        <Separator className="flex-1" />
      </div>
      <div className="space-y-3">
        <Button
          type="button"
          variant="outline"
          className={`w-full rounded-[5px] text-(--color-muted) ${isPage ? 'h-10 text-sm' : 'h-11 text-xs'}`}
          disabled={socialMutation.isPending}
          onClick={() =>
            socialMutation.mutate('google', {
              onSuccess: (session) => {
                onAuthenticated?.(session)
                handleOpenChange(false)
              },
            })
          }
        >
          <FcGoogle aria-hidden="true" className="size-5" />
          Continuar com Google
        </Button>
        <Button
          type="button"
          variant="outline"
          className={`w-full rounded-[5px] text-(--color-muted) ${isPage ? 'h-10 text-sm' : 'h-11 text-xs'}`}
          disabled={socialMutation.isPending}
          onClick={() =>
            socialMutation.mutate('facebook', {
              onSuccess: (session) => {
                onAuthenticated?.(session)
                handleOpenChange(false)
              },
            })
          }
        >
          <FaFacebookF aria-hidden="true" className="size-5 text-[#4267b2]" />
          Continuar com Facebook
        </Button>
        {getApiError(socialMutation.error) && (
          <p className="text-center text-xs text-red-300" role="alert">
            {getApiError(socialMutation.error)?.message}
          </p>
        )}
      </div>
    </>
  )

  if (isPage) {
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-125 flex-col bg-background px-6 pt-[calc(122px+env(safe-area-inset-top))] pb-[calc(112px+env(safe-area-inset-bottom))]">
        <p className="mb-18 text-center text-3xl font-bold tracking-[0.14em]">KURIO</p>
        {formContent}
        {pageFooter && (
          <div className="mt-auto pt-12 text-center text-base text-(--color-muted)">{pageFooter}</div>
        )}
      </main>
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[calc(100vh-32px)] w-[min(92vw,560px)] overflow-y-auto rounded-lg border border-b-[9px] border-(--color-border) border-b-(--color-primary) bg-(--color-panel) px-15 pt-10 pb-14 shadow-none max-[760px]:max-h-dvh max-[760px]:w-full max-[760px]:rounded-none max-[760px]:border-x-0 max-[760px]:border-t-0 max-[760px]:px-7 max-[760px]:pt-20 max-[760px]:pb-[calc(32px+env(safe-area-inset-bottom))]">
        {formContent}
      </DialogContent>
    </Dialog>
  )
}
