import { describe, expect, it } from 'vitest'
import { parseCouponCodeSearch, parseNetworkSearch } from '@/router-search'

describe('Coupon URL state', () => {
  it('normalizes a valid code without losing hyphens or digits', () => {
    expect(parseCouponCodeSearch('kurio-10')).toBe('KURIO-10')
  })
  it('accepts the maximum length', () => {
    expect(parseCouponCodeSearch('a'.repeat(32))).toBe('A'.repeat(32))
  })
  it.each([undefined, null, 10, [], {}, '', 'a'.repeat(33), ' code ', 'a/b', '<script>'])(
    'ignores invalid coupon parameter %j',
    (value) => {
      expect(parseCouponCodeSearch(value)).toBeUndefined()
    },
  )
})

describe('Network URL state', () => {
  it.each(['Ethereum', 'Polygon', 'Solana'])('preserves supported network %s', (value) => {
    expect(parseNetworkSearch(value)).toBe(value)
  })
  it.each([undefined, null, 1, [], 'ethereum', 'Unknown', ''])('ignores unsupported network %j', (value) => {
    expect(parseNetworkSearch(value)).toBeUndefined()
  })
})
