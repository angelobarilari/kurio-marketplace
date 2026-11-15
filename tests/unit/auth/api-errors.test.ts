import assert from 'node:assert/strict'
import type { UseFormSetError } from 'react-hook-form'
import { describe, it } from 'vitest'
import { applyApiFieldErrors } from '@/features/auth/utils/form-errors'
import { getApiError } from '@/features/auth/utils/get-api-error'

type FormFields = {
  email: string
  username: string
}

type SetErrorName = Parameters<UseFormSetError<FormFields>>[0]
type SetErrorOption = Parameters<UseFormSetError<FormFields>>[1]

const createErrorCollector = () => {
  const errors: Array<{
    name: SetErrorName
    type: SetErrorOption['type']
    message: SetErrorOption['message']
  }> = []
  const setError: UseFormSetError<FormFields> = (name, error) => {
    errors.push({ name, type: error.type, message: error.message })
  }

  return { errors, setError }
}

describe('getApiError', () => {
  it('accepts a known API error and keeps only string field messages', () => {
    const result = getApiError({
      response: {
        data: {
          code: 'VALIDATION_ERROR',
          message: 'Check the submitted fields.',
          fieldErrors: {
            email: 'Already registered.',
            username: 409,
            password: null,
          },
        },
      },
    })

    assert.deepEqual(result, {
      code: 'VALIDATION_ERROR',
      message: 'Check the submitted fields.',
      fieldErrors: { email: 'Already registered.' },
    })
  })

  it('omits field errors when none have a string message', () => {
    const result = getApiError({
      response: {
        data: {
          code: 'SERVICE_UNAVAILABLE',
          message: 'Try again later.',
          fieldErrors: { email: false },
        },
      },
    })

    assert.deepEqual(result, {
      code: 'SERVICE_UNAVAILABLE',
      message: 'Try again later.',
    })
  })

  it('rejects malformed responses, unsupported codes, and non-string messages', () => {
    const invalidErrors: unknown[] = [
      null,
      'request failed',
      new Error('request failed'),
      { response: null },
      { response: { data: null } },
      { response: { data: { code: 'UNKNOWN_CODE', message: 'Failure.' } } },
      { response: { data: { code: 'VALIDATION_ERROR', message: 422 } } },
      { response: { data: { code: 422, message: 'Failure.' } } },
    ]

    for (const error of invalidErrors) {
      assert.equal(getApiError(error), null)
    }
  })
})

describe('applyApiFieldErrors', () => {
  it('maps allowed fields and ignores fields not present in the form', () => {
    const { errors, setError } = createErrorCollector()
    const message = applyApiFieldErrors(
      {
        response: {
          data: {
            code: 'VALIDATION_ERROR',
            message: 'Check the submitted fields.',
            fieldErrors: {
              email: 'Already registered.',
              display_name: 'Name is taken.',
              admin: 'Not a form field.',
            },
          },
        },
      },
      setError,
      {
        fields: ['email', 'username'],
        fieldNames: { display_name: 'username' },
        fallbackMessage: 'Could not save the form.',
      },
    )

    assert.equal(message, 'Check the submitted fields.')
    assert.deepEqual(errors, [
      { name: 'email', type: 'server', message: 'Already registered.' },
      { name: 'username', type: 'server', message: 'Name is taken.' },
    ])
  })

  it('returns the fallback message when the response is not a recognized API error', () => {
    const { errors, setError } = createErrorCollector()
    const message = applyApiFieldErrors(new Error('network failure'), setError, {
      fields: ['email'],
      fallbackMessage: 'Could not save the form.',
    })

    assert.equal(message, 'Could not save the form.')
    assert.deepEqual(errors, [])
  })
})
