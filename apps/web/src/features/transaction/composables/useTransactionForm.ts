import { useTenant } from '@/composables/useTenant'
import { useAccounts } from '@/features/accounts/composables/useAccounts'
import {
  TRANSACTION_CATEGORY_KEYS,
  transactionFormSchema,
} from '@/features/transaction/schemas/transaction.schema'
import type { TransactionType } from '@/features/transaction/types'
import { queryKeys } from '@/lib/query'
import { createTransaction } from '@/services/transactions'
import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import { computed, watch } from 'vue'

export interface TransactionFormOptions {
  onSuccess?: () => void
}

/** Tanggal hari ini dalam format `YYYY-MM-DD` (waktu lokal). */
function today(): string {
  const now = new Date()
  const offset = now.getTimezoneOffset() * 60_000
  return new Date(now.getTime() - offset).toISOString().slice(0, 10)
}

/**
 * Form catat transaksi.
 *
 * Akses akun diambil dari `useAccounts()` sehingga pilihan akun selalu sinkron
 * dengan halaman Akun. Penyimpanan memakai mutation + invalidasi cache
 * transaksi.
 */
export function useTransactionForm(options: TransactionFormOptions = {}) {
  const { tenantPublicId } = useTenant()
  const queryClient = useQueryClient()
  const { accounts, hasAccounts } = useAccounts()

  const { defineField, handleSubmit, errors, resetForm, values, setFieldValue } = useForm({
    validationSchema: toTypedSchema(transactionFormSchema),
    initialValues: {
      type: 'expense' as TransactionType,
      amount: 0,
      currency: 'IDR',
      categoryKey: TRANSACTION_CATEGORY_KEYS[0],
      accountId: '',
      toAccountId: '',
      date: today(),
      note: '',
    },
  })

  const [type, typeProps] = defineField('type')
  const [amount, amountProps] = defineField('amount')
  const [currency, currencyProps] = defineField('currency')
  const [categoryKey, categoryProps] = defineField('categoryKey')
  const [accountId, accountProps] = defineField('accountId')
  const [toAccountId, toAccountProps] = defineField('toAccountId')
  const [date, dateProps] = defineField('date')
  const [note, noteProps] = defineField('note')

  const mutation = useMutation({
    mutationFn: (payload: Parameters<typeof createTransaction>[1]) =>
      createTransaction(tenantPublicId.value as string, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.transactions(tenantPublicId.value ?? 'none'),
      })
      options.onSuccess?.()
    },
  })

  const isTransfer = computed(() => values.type === 'transfer')

  /** Akun tujuan tidak boleh sama dengan akun asal. */
  const destinationAccounts = computed(() =>
    accounts.value.filter((a) => a.publicId !== values.accountId),
  )

  const canSubmit = computed(() => hasAccounts.value)

  const categoryOptions = computed(() => TRANSACTION_CATEGORY_KEYS)

  // Bersihkan akun tujuan ketika bukan lagi transfer.
  watch(isTransfer, (transfer) => {
    if (!transfer) setFieldValue('toAccountId', '')
  })

  const submit = handleSubmit(async (form) => {
    try {
      await mutation.mutateAsync({
        ...form,
        toAccountId: form.type === 'transfer' ? form.toAccountId : undefined,
      })
      resetForm({
        values: { ...form, amount: 0, note: '', toAccountId: '', date: today() },
      })
    } catch {
      // Error ditangani pemanggil lewat `error`/`isError`.
    }
  })

  return {
    // state
    isSubmitting: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
    isTransfer,
    canSubmit,
    destinationAccounts,
    categoryOptions,
    // field
    type,
    typeProps,
    amount,
    amountProps,
    currency,
    currencyProps,
    categoryKey,
    categoryProps,
    accountId,
    accountProps,
    toAccountId,
    toAccountProps,
    date,
    dateProps,
    note,
    noteProps,
    // meta
    errors,
    submit,
    resetForm,
  }
}
