import { beforeEach, describe, expect, it, vi } from 'vitest'

const { get } = vi.hoisted(() => ({ get: vi.fn() }))
vi.mock('@/lib/http-client', () => ({ httpClient: { get } }))

import { getSession } from '@/features/auth/api/auth'

describe('getSession API boundary', () => {
  beforeEach(() => {
    get.mockReset()
  })

  it('returns the session response body on success', async () => {
    const session = { id: 'session-1', user: { id: 'user-1' } }
    get.mockResolvedValueOnce({ data: session })

    await expect(getSession()).resolves.toEqual(session)
  })

  it('treats an Axios 401 as an unauthenticated session', async () => {
    get.mockRejectedValueOnce({
      isAxiosError: true,
      response: { status: 401 },
    })

    await expect(getSession()).resolves.toBeNull()
  })

  it.each([new Error('Network unavailable'), { isAxiosError: true, response: { status: 503 } }])(
    'propagates errors other than an Axios 401',
    async (error) => {
      get.mockRejectedValueOnce(error)

      await expect(getSession()).rejects.toBe(error)
    },
  )
})
