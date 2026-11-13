import { z } from 'zod'

const ensName = z
  .string()
  .trim()
  .min(1, 'Informe seu nome ENS.')
  .regex(/^(?:[a-z0-9-]+\.)+eth$/i, 'Informe um nome ENS terminado em .eth.')
const secondaryWalletAddress = z
  .string()
  .trim()
  .refine(
    (value) =>
      value === '' ||
      /^0x[a-fA-F0-9]{40}$/.test(value) ||
      /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(value) ||
      /^(?:[a-z0-9-]+\.)+eth$/i.test(value),
    'Informe um ENS ou endereço de carteira válido.',
  )

export const checkoutSchema = z.object({
  displayName: z.string().trim().min(2, 'Informe ao menos 2 caracteres.'),
  profileName: z.string().trim().min(2, 'Informe ao menos 2 caracteres.'),
  username: z
    .string()
    .trim()
    .regex(/^[a-zA-Z0-9._-]{3,24}$/, 'Informe um nome de usuário válido.'),
  email: z.string().trim().email('Informe um e-mail válido.'),
  ensName,
  referralCode: z
    .string()
    .trim()
    .min(1, 'Informe o código de indicação.')
    .regex(/^[A-Za-z0-9-]{1,32}$/, {
      message: 'Use até 32 letras, números ou hífens.',
    }),
  secondaryWalletAddress,
  collectorNote: z.string().max(500, 'Use no máximo 500 caracteres.'),
  network: z.enum(['Ethereum', 'Polygon', 'Solana']),
  walletId: z.string().min(1, 'Selecione uma carteira cadastrada.'),
  walletType: z.enum(['MetaMask', 'WalletConnect', 'Coinbase Wallet']),
})

export type CheckoutFormValues = z.infer<typeof checkoutSchema>
