import { z } from 'zod'

const emailSchema = z.string().trim().email('Informe um e-mail válido.')
const passwordSchema = z
  .string()
  .min(8, 'Use ao menos 8 caracteres.')
  .regex(/[A-Z]/, 'Inclua ao menos uma letra maiúscula.')
  .regex(/[a-z]/, 'Inclua ao menos uma letra minúscula.')
  .regex(/\d/, 'Inclua ao menos um número.')

export const passwordRecoverySchema = z.object({ email: emailSchema })

const usernameSchema = z
  .string()
  .trim()
  .regex(/^[a-zA-Z0-9._-]{3,24}$/, 'Use entre 3 e 24 letras, números, ponto, hífen ou sublinhado.')

export const createAuthFormSchema = (mode: 'login' | 'register') =>
  z
    .object({
      username: mode === 'register' ? usernameSchema : z.string(),
      email: emailSchema,
      password: mode === 'register' ? passwordSchema : z.string().min(1, 'Informe sua senha.'),
      confirmation: z.string(),
    })
    .superRefine((values, context) => {
      if (mode === 'register' && values.password !== values.confirmation) {
        context.addIssue({ code: 'custom', path: ['confirmation'], message: 'As senhas não coincidem.' })
      }
    })

export const profileSchema = z.object({
  displayName: z.string().trim().min(2, 'Informe ao menos 2 caracteres.'),
  username: usernameSchema,
  email: emailSchema,
  ensName: z
    .string()
    .trim()
    .refine((value) => value === '' || /^(?:[a-z0-9-]+\.)+eth$/i.test(value), {
      message: 'Informe um nome ENS terminado em .eth.',
    }),
  walletAlias: z.string().trim().min(2, 'Informe ao menos 2 caracteres.'),
})

export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, 'Informe a senha atual.'),
    newPassword: passwordSchema,
    passwordConfirmation: z.string().min(1, 'Confirme a nova senha.'),
  })
  .refine((values) => values.newPassword === values.passwordConfirmation, {
    message: 'As senhas não coincidem.',
    path: ['passwordConfirmation'],
  })

export type ProfileFormValues = z.infer<typeof profileSchema>
export type PasswordChangeFormValues = z.infer<typeof passwordChangeSchema>

export const walletSchema = z
  .object({
    displayName: z.string().trim().min(2, 'Informe um nome para a carteira.'),
    alias: z.string().trim().min(2, 'Informe um apelido.'),
    network: z.enum(['Ethereum', 'Polygon', 'Solana'], { message: 'Selecione uma rede.' }),
    address: z.string().trim().min(1, 'Informe o endereço da carteira.'),
    provider: z.enum(['MetaMask', 'WalletConnect', 'Coinbase Wallet'], {
      message: 'Selecione um provedor.',
    }),
    ensName: z
      .string()
      .trim()
      .refine((value) => value === '' || /^(?:[a-z0-9-]+\.)+eth$/i.test(value), {
        message: 'Informe um nome ENS terminado em .eth.',
      }),
    priority: z.enum(['primary', 'secondary']),
  })
  .superRefine((values, context) => {
    const validAddress =
      values.network === 'Solana'
        ? /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(values.address)
        : /^0x[a-fA-F0-9]{40}$/.test(values.address)
    if (!validAddress) {
      context.addIssue({
        code: 'custom',
        path: ['address'],
        message: `Informe um endereço válido para ${values.network}.`,
      })
    }
  })

export type WalletFormValues = z.infer<typeof walletSchema>

export type AuthFormValues = {
  username: string
  email: string
  password: string
  confirmation: string
}
