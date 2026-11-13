import { useEffect, useId, useRef, useState, type ChangeEvent } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { ImagePlus, Trash2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { FieldError } from '@/components/ui/field-error'
import { FieldLabel } from '@/components/ui/field-label'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { getApiError } from '@/features/auth/utils/get-api-error'
import {
  useChangePassword,
  useProfile,
  useUpdateAvatar,
  useUpdateProfile,
} from '@/features/auth/hooks/use-account'
import { applyApiFieldErrors } from '@/features/auth/utils/form-errors'
import { PasswordInput } from '@/features/auth/components/password-input'
import {
  passwordChangeSchema,
  profileSchema,
  type PasswordChangeFormValues,
  type ProfileFormValues,
} from '@/features/auth/schemas'

type ProfileFormsProps = { sessionId: string }

const inputClass =
  'h-11 rounded-sm border-(--color-border) bg-transparent px-4 text-(--color-foreground) placeholder:text-(--color-muted)'

export const ProfileForms = ({ sessionId }: ProfileFormsProps) => {
  const formId = useId()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const profile = useProfile(sessionId)
  const updateProfile = useUpdateProfile(sessionId)
  const updateAvatar = useUpdateAvatar(sessionId)
  const changePassword = useChangePassword()
  const [profileStatus, setProfileStatus] = useState('')
  const [avatarError, setAvatarError] = useState('')
  const [passwordStatus, setPasswordStatus] = useState('')

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { displayName: '', username: '', email: '', ensName: '', walletAlias: '' },
  })
  const passwordForm = useForm<PasswordChangeFormValues>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: { currentPassword: '', newPassword: '', passwordConfirmation: '' },
  })

  useEffect(() => {
    if (!profile.data) return
    profileForm.reset({
      displayName: profile.data.displayName,
      username: profile.data.username,
      email: profile.data.email,
      ensName: profile.data.ensName ?? '',
      walletAlias: profile.data.walletAlias,
    })
  }, [profile.data, profileForm])

  const saveProfile = profileForm.handleSubmit((values) => {
    setProfileStatus('')
    updateProfile.mutate(
      { ...values, ensName: values.ensName || null },
      {
        onSuccess: () => {
          setProfileStatus('Dados do perfil salvos.')
          profileForm.reset(values)
        },
        onError: (error) =>
          setProfileStatus(
            applyApiFieldErrors(error, profileForm.setError, {
              fields: ['displayName', 'username', 'email', 'ensName', 'walletAlias'],
              fallbackMessage: 'Não foi possível salvar. Tente novamente.',
            }),
          ),
      },
    )
  })

  const changeAvatar = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      setAvatarError('Use uma imagem PNG, JPEG ou WebP.')
      return
    }
    if (file.size > 1_000_000) {
      setAvatarError('A imagem deve ter no máximo 1 MB.')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result !== 'string') return
      setAvatarError('')
      updateAvatar.mutate(
        { avatarUrl: reader.result },
        {
          onError: (error) =>
            setAvatarError(getApiError(error)?.message ?? 'Não foi possível alterar o avatar.'),
        },
      )
    }
    reader.readAsDataURL(file)
  }

  const savePassword = passwordForm.handleSubmit((values) => {
    setPasswordStatus('')
    changePassword.mutate(values, {
      onSuccess: () => {
        setPasswordStatus('Senha alterada com sucesso.')
        passwordForm.reset()
      },
      onError: (error) =>
        setPasswordStatus(
          applyApiFieldErrors(error, passwordForm.setError, {
            fields: ['currentPassword', 'newPassword', 'passwordConfirmation'],
            fallbackMessage: 'Não foi possível alterar a senha. Tente novamente.',
          }),
        ),
    })
  })

  if (profile.isPending) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-72 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (profile.isError || !profile.data) {
    return (
      <div role="alert" className="rounded border border-(--color-border) p-6">
        <p>Não foi possível carregar o perfil.</p>
        <Button type="button" className="mt-4" onClick={() => profile.refetch()}>
          Tentar novamente
        </Button>
      </div>
    )
  }

  const profileFields = [
    { name: 'displayName', label: 'Nome de exibição', required: true },
    { name: 'username', label: 'Nome de usuário', required: true },
    { name: 'email', label: 'E-mail', required: true, type: 'email' },
    { name: 'ensName', label: 'Nome ENS', required: false, placeholder: 'nome.eth' },
    { name: 'walletAlias', label: 'Apelido público', required: true },
  ] as const

  return (
    <div className="pb-16">
      <h2 className="mb-7 text-xl font-bold">Perfil do colecionador</h2>
      <form
        className="grid grid-cols-2 gap-x-7 gap-y-5 max-[760px]:grid-cols-1"
        onSubmit={saveProfile}
        noValidate
      >
        {profileFields.map(({ name, label, required, ...field }) => {
          const error = profileForm.formState.errors[name]
          const id = `${formId}-${name}`
          return (
            <div key={name} className={name === 'walletAlias' ? 'max-[760px]:order-0' : undefined}>
              <FieldLabel className="mb-2 block" htmlFor={id}>
                {label}
                {required && (
                  <span className="text-red-400" aria-hidden="true">
                    *
                  </span>
                )}
              </FieldLabel>
              <Input
                id={id}
                className={inputClass}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? `${id}-error` : undefined}
                {...field}
                {...profileForm.register(name)}
              />
              <FieldError id={`${id}-error`} message={error?.message} />
            </div>
          )
        })}

        <fieldset>
          <legend className="mb-2">Avatar</legend>
          <div className="flex flex-wrap items-center gap-3">
            <div className="grid size-16 place-items-center overflow-hidden rounded-full border border-(--color-border) bg-(--color-panel)">
              {profile.data.avatarUrl ? (
                <img src={profile.data.avatarUrl} alt="Avatar atual" className="size-full object-cover" />
              ) : (
                <ImagePlus aria-hidden="true" className="text-(--color-primary-bright)" />
              )}
            </div>
            <FieldLabel visuallyHidden htmlFor={`${formId}-avatar-file`}>
              Imagem do avatar
            </FieldLabel>
            <Input
              ref={fileInputRef}
              id={`${formId}-avatar-file`}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="sr-only"
              aria-label="Imagem do avatar"
              onChange={changeAvatar}
            />
            <Button
              type="button"
              disabled={updateAvatar.isPending}
              onClick={() => fileInputRef.current?.click()}
            >
              Alterar
            </Button>
            <Button
              type="button"
              variant="ghost"
              disabled={!profile.data.avatarUrl || updateAvatar.isPending}
              onClick={() => updateAvatar.mutate({ avatarUrl: null })}
            >
              <Trash2 aria-hidden="true" /> Remover
            </Button>
          </div>
          <FieldError id={`${formId}-avatar-error`} message={avatarError} />
        </fieldset>

        <div className="col-span-2 flex items-center gap-4 max-[760px]:col-span-1">
          <Button
            type="submit"
            className="min-w-32"
            disabled={updateProfile.isPending || !profileForm.formState.isDirty}
          >
            {updateProfile.isPending ? 'Salvando…' : 'Salvar perfil'}
          </Button>
          <p className="text-sm" role="status" aria-live="polite">
            {profileStatus}
          </p>
        </div>
      </form>

      <div className="my-9 h-px bg-(--color-border)" />

      <form className="max-w-2xl space-y-5" onSubmit={savePassword} noValidate>
        <h2 className="text-xl font-bold">Alterar senha</h2>
        {(
          [
            ['currentPassword', 'Senha atual'],
            ['newPassword', 'Nova senha'],
            ['passwordConfirmation', 'Confirmar nova senha'],
          ] as const
        ).map(([name, label]) => {
          const id = `${formId}-${name}`
          const error = passwordForm.formState.errors[name]
          return (
            <div key={name}>
              <FieldLabel className="mb-2 block" htmlFor={id}>
                {label}
              </FieldLabel>
              <PasswordInput
                id={id}
                invalid={Boolean(error)}
                aria-describedby={error ? `${id}-error` : undefined}
                className={inputClass}
                {...passwordForm.register(name)}
              />
              <FieldError id={`${id}-error`} message={error?.message} />
            </div>
          )
        })}
        <div className="flex items-center gap-4">
          <Button type="submit" className="min-w-32" disabled={changePassword.isPending}>
            {changePassword.isPending ? 'Salvando…' : 'Salvar senha'}
          </Button>
          <p className="text-sm" role="status" aria-live="polite">
            {passwordStatus}
          </p>
        </div>
      </form>
    </div>
  )
}
