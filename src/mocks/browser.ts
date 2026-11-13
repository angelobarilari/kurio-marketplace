import { setupWorker } from 'msw/browser'
import { handlers } from '@/mocks/handlers/index'

export const worker = setupWorker(...handlers)
