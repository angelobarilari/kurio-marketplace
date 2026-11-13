const weiPerEth = 10n ** 18n

export const weiToEth = (value: bigint): string => {
  const whole = value / weiPerEth
  const fraction = (value % weiPerEth).toString().padStart(18, '0').replace(/0+$/, '')
  return fraction ? `${whole}.${fraction}` : whole.toString()
}
