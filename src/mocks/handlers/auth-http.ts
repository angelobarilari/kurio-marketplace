import { delay, http, HttpResponse } from 'msw'
import type {
  AuthCredentials,
  PasswordRecoveryInput,
  RegistrationInput,
  SocialAuthProvider,
} from '@/features/auth/types'
import {
  expireSessionState,
  getSessionState,
  loginState,
  logoutState,
  recoverPasswordState,
  registerState,
  socialLoginState,
} from '@/mocks/state/account-store'
import { validationErrorResponse } from '@/mocks/handlers/http-utils'
import { clearUserWalletConnectionState } from '@/mocks/state/order-store'

const validatePassword = (password: string) =>
  password.length >= 8 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /\d/.test(password)

export const authHttpHandlers = [
  http.get('/api/session', async ({ request }) => {
    await delay(120)
    if (request.headers.get('x-kurio-mock-scenario') === 'session-expired') expireSessionState()
    const session = getSessionState()
    return session
      ? HttpResponse.json(session)
      : HttpResponse.json({ code: 'AUTH_REQUIRED', message: 'Entre para continuar.' }, { status: 401 })
  }),

  http.post('/api/session/login', async ({ request }) => {
    await delay(180)
    const input = (await request.json()) as AuthCredentials
    const fieldErrors: Record<string, string> = {}
    if (!/^\S+@\S+\.\S+$/.test(input.email?.trim() ?? '')) fieldErrors.email = 'Informe um e-mail válido.'
    if (!input.password) fieldErrors.password = 'Informe sua senha.'
    if (Object.keys(fieldErrors).length) return validationErrorResponse(fieldErrors)
    const session = await loginState(input)
    return session
      ? HttpResponse.json(session)
      : HttpResponse.json(
          { code: 'INVALID_CREDENTIALS', message: 'E-mail ou senha incorretos.' },
          { status: 401 },
        )
  }),

  http.post('/api/session/register', async ({ request }) => {
    await delay(220)
    const input = (await request.json()) as RegistrationInput
    const fieldErrors: Record<string, string> = {}
    if (!/^[a-zA-Z0-9._-]{3,24}$/.test(input.username?.trim() ?? '')) {
      fieldErrors.username = 'Use entre 3 e 24 letras, números, ponto, hífen ou sublinhado.'
    }
    if (!/^\S+@\S+\.\S+$/.test(input.email?.trim() ?? '')) fieldErrors.email = 'Informe um e-mail válido.'
    if (!validatePassword(input.password ?? '')) {
      fieldErrors.password = 'Use ao menos 8 caracteres, com maiúscula, minúscula e número.'
    }
    if (input.passwordConfirmation !== input.password) {
      fieldErrors.passwordConfirmation = 'As senhas não coincidem.'
    }
    if (Object.keys(fieldErrors).length) return validationErrorResponse(fieldErrors)
    const result = await registerState(input)
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
    return HttpResponse.json(result, { status: 201 })
  }),

  http.post('/api/session/logout', async () => {
    await delay(100)
    const userId = getSessionState()?.user.id
    logoutState()
    if (userId) clearUserWalletConnectionState(userId)
    return new HttpResponse(null, { status: 204 })
  }),

  http.post('/api/session/social/:provider', async ({ params, request }) => {
    await delay(240)
    const provider = String(params.provider)
    if (request.headers.get('x-kurio-mock-scenario') === 'social-auth-error') {
      return HttpResponse.json(
        { code: 'SERVICE_UNAVAILABLE', message: 'O provedor de acesso está indisponível.' },
        { status: 503 },
      )
    }
    if (provider !== 'google' && provider !== 'facebook') {
      return HttpResponse.json(
        { code: 'RESOURCE_NOT_FOUND', message: 'Provedor de acesso desconhecido.' },
        { status: 404 },
      )
    }
    return HttpResponse.json(socialLoginState(provider as SocialAuthProvider))
  }),

  http.post('/api/session/recover-password', async ({ request }) => {
    await delay(180)
    const input = (await request.json()) as PasswordRecoveryInput
    if (!/^\S+@\S+\.\S+$/.test(input.email?.trim() ?? '')) {
      return validationErrorResponse({ email: 'Informe um e-mail válido.' })
    }
    return HttpResponse.json(recoverPasswordState(input.email))
  }),
]
