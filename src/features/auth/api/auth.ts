import axios from 'axios'
import { httpClient } from '@/lib/http-client'
import type {
  ApiError,
  AuthCredentials,
  PasswordRecoveryInput,
  PasswordRecoveryResult,
  RegistrationInput,
  Session,
  SocialAuthProvider,
} from '@/features/auth/types'

export const getSession = async (signal?: AbortSignal): Promise<Session | null> => {
  try {
    const response = await httpClient.get<Session>('/session', { signal })
    return response.data
  } catch (error) {
    if (axios.isAxiosError<ApiError>(error) && error.response?.status === 401) return null
    throw error
  }
}

export const login = async (input: AuthCredentials): Promise<Session> => {
  const response = await httpClient.post<Session>('/session/login', input)
  return response.data
}

export const register = async (input: RegistrationInput): Promise<Session> => {
  const response = await httpClient.post<Session>('/session/register', input)
  return response.data
}

export const loginWithSocialProvider = async (provider: SocialAuthProvider): Promise<Session> => {
  const response = await httpClient.post<Session>(`/session/social/${provider}`)
  return response.data
}

export const logout = async (): Promise<void> => {
  await httpClient.post('/session/logout')
}

export const recoverPassword = async (input: PasswordRecoveryInput): Promise<PasswordRecoveryResult> => {
  const response = await httpClient.post<PasswordRecoveryResult>('/session/recover-password', input)
  return response.data
}
