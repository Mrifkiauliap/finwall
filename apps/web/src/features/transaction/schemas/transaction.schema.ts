import { z } from 'zod'

/**
 * Skema form transaksi.
 *
 * Memakai APPLICATION error code (bukan pesan) supaya frontend menerjemahkan
 * lewat namespace `validation.*` — pola yang sama dengan `@finwall/shared`.
 *
 * Aturan silang: `toAccountId` wajib & tidak boleh sama dengan `accountId`
 * hanya ketika `type === 'transfer'`.
 */

export const TRANSACTION_TYPES = ['income', 'expense', 'transfer'] as const

/** Kategori minimal yang dipakai UI; dapat diperluas dari master data. */
export const TRANSACTION_CATEGORY_KEYS = [
  'FOOD',
  'TRANSPORT',
  'SHOPPING',
  'BILLS',
  'SALARY',
  'INVESTMENT',
  'TRANSFER',
  'OTHER',
] as const

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

export const transactionFormSchema = z
  .object({
    type: z.enum(TRANSACTION_TYPES, { error: 'TRANSACTION_TYPE_INVALID' }),
    amount: z
      .number({ error: 'AMOUNT_INVALID' })
      .positive({ error: 'AMOUNT_POSITIVE' })
      .finite({ error: 'AMOUNT_INVALID' }),
    // Tanpa `.default()`: `@vee-validate/zod` memanggil `_def.defaultValue()`
    // (bentuk Zod 3) dan gagal pada Zod 4. Nilai awal diisi via `initialValues`.
    currency: z.string().trim().length(3, { error: 'CURRENCY_INVALID' }),
    categoryKey: z.enum(TRANSACTION_CATEGORY_KEYS, { error: 'CATEGORY_REQUIRED' }),
    accountId: z.string().min(1, { error: 'ACCOUNT_REQUIRED' }),
    toAccountId: z.string().optional(),
    date: z.string().regex(ISO_DATE, { error: 'DATE_INVALID' }).min(1, { error: 'DATE_REQUIRED' }),
    note: z.string().trim().max(280, { error: 'NOTE_TOO_LONG' }).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.type !== 'transfer') return

    if (!value.toAccountId) {
      ctx.addIssue({
        path: ['toAccountId'],
        code: 'custom',
        message: 'TO_ACCOUNT_REQUIRED',
      })
      return
    }

    if (value.toAccountId === value.accountId) {
      ctx.addIssue({
        path: ['toAccountId'],
        code: 'custom',
        message: 'TO_ACCOUNT_SAME',
      })
    }
  })

export type TransactionFormSchemaValues = z.infer<typeof transactionFormSchema>
