import { HttpResponse } from 'msw'

export const validationErrorResponse = (fieldErrors: Record<string, string>) =>
  HttpResponse.json(
    { code: 'VALIDATION_ERROR', message: 'Revise os campos informados.', fieldErrors },
    { status: 422 },
  )
