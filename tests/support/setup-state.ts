import { afterEach, beforeEach, vi } from 'vitest'
import { resetAccountState } from '@/mocks/state/account-store'
import { resetCatalog } from '@/mocks/state/catalog-store'
import { resetCart } from '@/mocks/state/cart-store'
import { resetOrderState } from '@/mocks/state/order-store'

// A fresh storage adapter and domain state prevent order-dependent tests.
beforeEach(() => {
  const values = new Map<string, string>()
  const storage: Storage = {
    get length() {
      return values.size
    },
    key: (index) => [...values.keys()][index] ?? null,
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => {
      values.set(key, String(value))
    },
    removeItem: (key) => {
      values.delete(key)
    },
    clear: () => values.clear(),
  }
  vi.stubGlobal('localStorage', storage)
  resetAccountState()
  resetOrderState()
  resetCatalog()
  resetCart()
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})
