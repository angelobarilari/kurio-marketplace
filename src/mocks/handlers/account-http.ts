import { delay, http, HttpResponse } from 'msw'
import type {
  AvatarUpdateInput,
  PasswordChangeInput,
  ProfileUpdateInput,
  WalletInput,
} from '@/features/auth/types'
import {
  changePasswordState,
  createWalletState,
  getProfileState,
  getWalletsState,
  updateAvatarState,
  updateProfileState,
  updateWalletState,
} from '@/mocks/state/account-store'
import { validationErrorResponse } from '@/mocks/handlers/http-utils'

const unauthorized = () =>
  HttpResponse.json({ code: 'AUTH_REQUIRED', message: 'Entre para continuar.' }, { status: 401 })

const validateProfile = (input: ProfileUpdateInput) => {
  const errors: Record<string, string> = {}
  if (input.displayName.trim().length < 2) errors.displayName = 'Informe ao menos 2 caracteres.'
  if (!/^[a-zA-Z0-9._-]{3,24}$/.test(input.username.trim())) {
    errors.username = 'Use entre 3 e 24 letras, números, ponto, hífen ou sublinhado.'
  }
  if (!/^\S+@\S+\.\S+$/.test(input.email.trim())) errors.email = 'Informe um e-mail válido.'
  if (input.ensName && !/^(?:[a-z0-9-]+\.)+eth$/i.test(input.ensName)) {
    errors.ensName = 'Informe um nome ENS terminado em .eth.'
  }
  return errors
}

const validateWallet = (input: WalletInput) => {
  const errors: Record<string, string> = {}
  if (input.displayName.trim().length < 2) errors.displayName = 'Informe um nome para a carteira.'
  if (input.alias.trim().length < 2) errors.alias = 'Informe um apelido.'
  const validAddress =
    input.network === 'Solana'
      ? /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(input.address)
      : /^0x[a-fA-F0-9]{40}$/.test(input.address)
  if (!validAddress) errors.address = `Informe um endereço válido para ${input.network}.`
  if (input.ensName && !/^(?:[a-z0-9-]+\.)+eth$/i.test(input.ensName)) {
    errors.ensName = 'Informe um nome ENS terminado em .eth.'
  }
  return errors
}

export const accountHttpHandlers = [
  http.get('/api/profile', async () => {
    await delay(140)
    const profile = getProfileState()
    return profile ? HttpResponse.json(profile) : unauthorized()
  }),

  http.patch('/api/profile', async ({ request }) => {
    await delay(180)
    const input = (await request.json()) as ProfileUpdateInput
    const errors = validateProfile(input)
    if (Object.keys(errors).length) return validationErrorResponse(errors)
    const result = updateProfileState(input)
    if (!result) return unauthorized()
    if ('conflict' in result) {
      const emailConflict = result.conflict === 'email'
      return HttpResponse.json(
        {
          code: emailConflict ? 'EMAIL_CONFLICT' : 'USERNAME_CONFLICT',
          message: emailConflict ? 'Este e-mail já está cadastrado.' : 'Este usuário já está em uso.',
          fieldErrors: emailConflict
            ? { email: 'Este e-mail já está cadastrado.' }
            : { username: 'Este usuário já está em uso.' },
        },
        { status: 409 },
      )
    }
    return HttpResponse.json(result)
  }),

  http.put('/api/profile/avatar', async ({ request }) => {
    await delay(180)
    const input = (await request.json()) as AvatarUpdateInput
    if (input.avatarUrl && !/^data:image\/(png|jpeg|webp);base64,/.test(input.avatarUrl)) {
      return validationErrorResponse({ avatarUrl: 'Use uma imagem PNG, JPEG ou WebP.' })
    }
    if (input.avatarUrl && input.avatarUrl.length > 1_500_000) {
      return validationErrorResponse({ avatarUrl: 'A imagem deve ter no máximo 1 MB.' })
    }
    const profile = updateAvatarState(input)
    return profile ? HttpResponse.json(profile) : unauthorized()
  }),

  http.put('/api/profile/password', async ({ request }) => {
    await delay(200)
    const input = (await request.json()) as PasswordChangeInput
    const errors: Record<string, string> = {}
    if (!input.currentPassword) errors.currentPassword = 'Informe a senha atual.'
    if (
      input.newPassword.length < 8 ||
      !/[A-Z]/.test(input.newPassword) ||
      !/[a-z]/.test(input.newPassword) ||
      !/\d/.test(input.newPassword)
    ) {
      errors.newPassword = 'Use ao menos 8 caracteres, com maiúscula, minúscula e número.'
    }
    if (input.passwordConfirmation !== input.newPassword) {
      errors.passwordConfirmation = 'As senhas não coincidem.'
    }
    if (Object.keys(errors).length) return validationErrorResponse(errors)
    const result = await changePasswordState(input)
    if (!result) return unauthorized()
    if (result === 'invalid-current-password') {
      return HttpResponse.json(
        {
          code: 'CURRENT_PASSWORD_INVALID',
          message: 'A senha atual está incorreta.',
          fieldErrors: { currentPassword: 'A senha atual está incorreta.' },
        },
        { status: 422 },
      )
    }
    return new HttpResponse(null, { status: 204 })
  }),

  http.get('/api/wallets', async () => {
    await delay(140)
    const wallets = getWalletsState()
    return wallets ? HttpResponse.json(wallets) : unauthorized()
  }),

  http.post('/api/wallets', async ({ request }) => {
    await delay(180)
    const input = (await request.json()) as WalletInput
    const errors = validateWallet(input)
    if (Object.keys(errors).length) return validationErrorResponse(errors)
    const result = createWalletState(input)
    if (!result) return unauthorized()
    if ('conflict' in result) {
      return HttpResponse.json(
        {
          code: 'WALLET_CONFLICT',
          message: 'Este endereço já está cadastrado.',
          fieldErrors: { address: 'Este endereço já está cadastrado.' },
        },
        { status: 409 },
      )
    }
    return HttpResponse.json(result, { status: 201 })
  }),

  http.put('/api/wallets/:walletId', async ({ params, request }) => {
    await delay(180)
    const input = (await request.json()) as WalletInput
    const errors = validateWallet(input)
    if (Object.keys(errors).length) return validationErrorResponse(errors)
    const result = updateWalletState(String(params.walletId), input)
    if (!result) return unauthorized()
    if (result === 'not-found') {
      return HttpResponse.json(
        { code: 'RESOURCE_NOT_FOUND', message: 'Carteira não encontrada.' },
        { status: 404 },
      )
    }
    if ('conflict' in result) {
      return HttpResponse.json(
        {
          code: 'WALLET_CONFLICT',
          message: 'Este endereço já está cadastrado.',
          fieldErrors: { address: 'Este endereço já está cadastrado.' },
        },
        { status: 409 },
      )
    }
    return HttpResponse.json(result)
  }),
]
