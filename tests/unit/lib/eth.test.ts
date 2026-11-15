import assert from 'node:assert/strict'
import { describe, it } from 'vitest'
import { ethToWei } from '@/lib/eth-to-wei'
import { weiToEth } from '@/lib/wei-to-eth'
describe('Exact ETH/BigInt values', () => {
  it('preserves one wei and the complete 18-decimal precision', () => {
    assert.equal(ethToWei('0.000000000000000001'), 1n)
    assert.equal(ethToWei('1.123456789012345678'), 1123456789012345678n)
  })
  it('adds 0.1 and 0.2 without floating point drift', () => {
    assert.equal(weiToEth(ethToWei('0.1') + ethToWei('0.2')), '0.3')
  })
  it('round-trips values beyond Number.MAX_SAFE_INTEGER', () => {
    for (let index = 0n; index < 64n; index++) {
      const wei = 10n ** 35n + index * 1234567890123456789n
      assert.equal(ethToWei(weiToEth(wei)), wei)
    }
  })
  it('formats zero and removes redundant decimal zeros', () => {
    assert.equal(weiToEth(0n), '0')
    assert.equal(weiToEth(1200000000000000000n), '1.2')
    assert.equal(ethToWei('0001.2000'), 1200000000000000000n)
  })
  for (const value of ['-1', 'NaN', 'Infinity', '1e-18', '.1', '1.', ' 1', '0x10', '0.0000000000000000001']) {
    it(`rejects invalid ETH input ${JSON.stringify(value)}`, () => assert.throws(() => ethToWei(value)))
  }
})
