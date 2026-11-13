import type { ApiError } from '@/features/auth/types'

const authErrorCodes = [
  'AUTH_REQUIRED',
  'SESSION_EXPIRED',
  'INVALID_CREDENTIALS',
  'EMAIL_CONFLICT',
  'USERNAME_CONFLICT',
  'VALIDATION_ERROR',
  'CURRENT_PASSWORD_INVALID',
  'WALLET_CONFLICT',
  'RESOURCE_NOT_FOUND',
  'SERVICE_UNAVAILABLE',
] as const satisfies readonly ApiError['code'][]

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const isAuthErrorCode = (value: unknown): value is ApiError['code'] =>
  typeof value === 'string' && authErrorCodes.some((code) => code === value)

export const getApiError = (error: unknown): ApiError | null => {
  if (!isRecord(error) || !isRecord(error.response) || !isRecord(error.response.data)) return null

  const data = error.response.data
  if (!isAuthErrorCode(data.code) || typeof data.message !== 'string') return null

  const fieldErrors: Record<string, string> = {}
  if (isRecord(data.fieldErrors)) {
    for (const [field, message] of Object.entries(data.fieldErrors)) {
      if (typeof message === 'string') fieldErrors[field] = message
    }
  }

  return {
    code: data.code,
    message: data.message,
    ...(Object.keys(fieldErrors).length > 0 ? { fieldErrors } : {}),
  }
}
