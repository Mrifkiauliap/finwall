import { useTenant } from '@/composables/useTenant'
import { queryKeys } from '@/lib/query'
import { createAccount } from '@/services/accounts'
import type { Account, AccountType, CreateAccountRequest } from '@finwall/shared'
import { createAccountRequestSchema } from '@finwall/shared'
import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import { watch } from 'vue'

export interface AccountFormOptions {
  /** Dipanggil setelah simpan berhasil (mis. menutup dialog + notifikasi). */
  onSuccess?: (account: Account) => void
}

const DEFAULT_CURRENCY = 'IDR'

/**
 * Form buat/ubah akun.
 *
 * Skema validasi diambil dari `@finwall/shared` — kontrak yang SAMA dengan yang
 * dipakai backend, sehingga pesan error (APPLICATION code) konsisten dan tidak
 * ada aturan yang berbeda antara klien & server.
 *
 * `account` opsional: bila diberikan, form berjalan dalam mode edit.
 */
export function useAccountForm(options: AccountFormOptions = {}) {
  const { tenantPublicId } = useTenant()
  const queryClient = useQueryClient()

  const { defineField, handleSubmit, errors, resetForm, values, setValues } = useForm({
    validationSchema: toTypedSchema(createAccountRequestSchema),
    initialValues: {
      name: '',
      type: 'cash' as AccountType,
      currency: DEFAULT_CURRENCY,
      initialBalance: 0,
    },
  })

  const [name, nameProps] = defineField('name')
  const [type, typeProps] = defineField('type')
  const [currency, currencyProps] = defineField('currency')
  const [initialBalance, initialBalanceProps] = defineField('initialBalance')

  const mutation = useMutation({
    mutationFn: (payload: CreateAccountRequest) =>
      createAccount(tenantPublicId.value as string, payload),
    onSuccess: (created: Account) => {
      // Segarkan daftar dari server (sumber kebenaran saldo & ringkasan).
      void queryClient.invalidateQueries({
        queryKey: queryKeys.accounts(tenantPublicId.value ?? 'none'),
      })
      options.onSuccess?.(created)
    },
  })

  /**
   * Isi form dari akun yang sudah ada (mode edit).
   *
   * Dipanggil saat dialog dibuka, supaya form menampilkan data lama alih-alih
   * kosong.
   */
  function loadAccount(account: Account) {
    setValues({
      name: account.name,
      type: account.type,
      currency: account.currency,
      initialBalance: account.initialBalance,
    })
  }

  /** Apakah form sedang mengubah akun yang sudah ada. */
  const isSubmitting = mutation.isPending

  const submit = handleSubmit(async (form) => {
    try {
      await mutation.mutateAsync({
        name: form.name,
        type: form.type,
        currency: form.currency,
        initialBalance: form.initialBalance,
      })
      resetForm()
    } catch {
      // Error ditangani pemanggil lewat `isError`/`error` (mis. notifikasi).
    }
  })

  // Reset saldo awal saat mengganti jenis akun ke aset agar tidak ada sisa
  // nilai negatif dari pengisian sebelumnya.
  watch(
    () => values.type,
    (next, prev) => {
      if (prev === undefined || next === prev) return
      if (next !== 'other' && Number(values.initialBalance ?? 0) < 0) {
        initialBalance.value = 0
      }
    },
  )

  return {
    // state
    isSubmitting,
    isError: mutation.isError,
    error: mutation.error,
    // field
    name,
    nameProps,
    type,
    typeProps,
    currency,
    currencyProps,
    initialBalance,
    initialBalanceProps,
    // meta
    errors,
    submit,
    resetForm,
    loadAccount,
  }
}
