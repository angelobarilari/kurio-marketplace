import { getApiError } from '@/features/auth/utils/get-api-error'
import type { FieldValues, Path, UseFormSetError } from 'react-hook-form'

type ApplyApiFieldErrorsOptions<T extends FieldValues> = {
  fields: readonly Path<T>[]
  fieldNames?: Readonly<Record<string, Path<T>>>
  fallbackMessage: string
}

/**
 * Maps API field errors to known React Hook Form fields and returns a user-facing fallback message.
 *
 * Unknown API fields are ignored so a server response cannot create errors for fields absent from the form.
 */
export const applyApiFieldErrors = <T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  options: ApplyApiFieldErrorsOptions<T>,
) => {
  const apiError = getApiError(error)
  const allowedFields = new Set<string>(options.fields)

  Object.entries(apiError?.fieldErrors ?? {}).forEach(([field, message]) => {
    const mappedField = options.fieldNames?.[field] ?? field
    if (!allowedFields.has(mappedField)) return
    const formField = options.fields.find((candidate) => candidate === mappedField)
    if (formField) setError(formField, { type: 'server', message })
  })

  return apiError?.message ?? options.fallbackMessage
}
