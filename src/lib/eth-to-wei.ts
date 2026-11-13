const weiPerEth = 10n ** 18n

/**
 * Converts a decimal ETH amount to wei without floating-point arithmetic.
 *
 * @param value Non-negative ETH amount with up to 18 decimal places.
 * @returns The exact amount expressed as an integer number of wei.
 * @throws If the amount is not a valid decimal ETH string.
 */
export const ethToWei = (value: string): bigint => {
  if (!/^\d+(?:\.\d{1,18})?$/.test(value)) {
    throw new Error(`Invalid ETH amount: ${value}`)
  }

  const [whole, fraction = ''] = value.split('.')
  const normalizedFraction = `${fraction}000000000000000000`.slice(0, 18)
  return BigInt(whole) * weiPerEth + BigInt(normalizedFraction)
}
