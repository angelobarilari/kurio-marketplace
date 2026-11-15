import { setupServer } from 'msw/node'
import { catalogHttpHandlers } from '@/mocks/handlers/catalog-http'

export const mockServer = setupServer(...catalogHttpHandlers)
