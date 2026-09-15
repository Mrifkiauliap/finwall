import { z } from 'zod'

/**
 * Skema form akun untuk halaman Akun.
 *
 * Memakai APPLICATION error code (bukan pesan) agar frontend menerjemahkan
 * lewat namespace `validation.*` — pola yang sama dengan skema di
 * `@finwall/shared`.
 */

export const ACCOUNT_KINDS = ['asset', 'debt'] as const

export const ACCOUNT_GROUP_KEYS = [
  'cash',
  'investments',
  'crypto',
  'properties',
  'vehicles',
  'other_assets',
  'credit_cards',
  'loans',
  'other_liabilities',
] as const

export const accountFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { error: 'ACCOUNT_NAME_REQUIRED' })
    .max(100, { error: 'ACCOUNT_NAME_TOO_LONG' }),
  kind: z.enum(ACCOUNT_KINDS, { error: 'ACCOUNT_KIND_INVALID' }),
  groupKey: z.enum(ACCOUNT_GROUP_KEYS, { error: 'ACCOUNT_GROUP_INVALID' }),
  balance: z
    .number({ error: 'ACCOUNT_BALANCE_INVALID' })
    .finite({ error: 'ACCOUNT_BALANCE_INVALID' }),
  // Tanpa `.default()`: `@vee-validate/zod` memanggil `_def.defaultValue()`
  // (bentuk Zod 3) dan gagal pada Zod 4. Nilai awal diberikan lewat
  // `initialValues` di `useAccountForm`, bukan lewat schema.
  currency: z.string().trim().length(3, { error: 'CURRENCY_INVALID' }),
})

export type AccountFormValues = z.infer<typeof accountFormSchema>
