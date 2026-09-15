import { useTenant } from '@/composables/useTenant'
import {
  ACCOUNT_TYPE_DEFS,
  type AccountGroup,
  type AccountsFilter,
} from '@/features/accounts/types'
import { queryKeys } from '@/lib/query'
import { fetchAccounts } from '@/services/accounts'
import { useQuery } from '@tanstack/vue-query'
import { computed, ref } from 'vue'

/**
 * Sumber data akun tenant aktif berbasis TanStack Query.
 *
 * Cache di-key dengan `tenantPublicId` sehingga berpindah workspace memakai
 * cache terpisah dan tidak pernah tercampur. Saldo & ringkasan sudah dihitung
 * server (lihat `AccountService`), jadi UI tidak menghitung ulang.
 *
 * Filter disimpan sebagai state lokal modul karena murni preferensi tampilan.
 */

/** Filter bersifat preferensi tampilan -> state lokal bersama. */
const filter = ref<AccountsFilter>('all')

export function useAccounts() {
  const { tenantPublicId } = useTenant()

  const query = useQuery({
    // `enabled` menjaga query tidak jalan sebelum tenant di URL diketahui.
    enabled: computed(() => !!tenantPublicId.value),
    queryKey: computed(() => queryKeys.accounts(tenantPublicId.value ?? 'none')),
    queryFn: () => fetchAccounts(tenantPublicId.value as string),
  })

  /** Akun dari cache query (kosong bila belum tersedia). */
  const accounts = computed(() => query.data.value?.accounts ?? [])

  /** Ringkasan dari server; fallback nol agar template tetap aman. */
  const summary = computed(
    () =>
      query.data.value?.summary ?? {
        totalBalance: 0,
        byType: [],
      },
  )

  const visibleAccounts = computed(() =>
    accounts.value.filter((account) => {
      if (filter.value === 'active') return account.isActive
      if (filter.value === 'inactive') return !account.isActive
      return true
    }),
  )

  /** Akun aktif yang dikelompokkan per jenis (hanya grup berisi). */
  const groups = computed<AccountGroup[]>(() =>
    ACCOUNT_TYPE_DEFS.map((def) => {
      const items = visibleAccounts.value.filter((account) => account.type === def.type)
      return {
        type: def.type,
        labelKey: def.labelKey,
        nature: def.nature,
        icon: def.icon,
        accounts: items,
        total: items.reduce((sum, account) => sum + account.balance, 0),
      }
    }).filter((group) => group.accounts.length > 0),
  )

  /**
   * Total aset, utang, dan kekayaan bersih.
   *
   * Klasifikasi aset/utang adalah keputusan tampilan (lihat `ACCOUNT_TYPE_DEFS`),
   * dihitung dari saldo yang sudah dikirim server.
   */
  const totals = computed(() => {
    const sumByNature = (nature: 'asset' | 'debt') => {
      const types = ACCOUNT_TYPE_DEFS.filter((def) => def.nature === nature).map((def) => def.type)
      return accounts.value
        .filter((account) => types.includes(account.type))
        .reduce((sum, account) => sum + account.balance, 0)
    }

    const assets = sumByNature('asset')
    const debts = sumByNature('debt')

    return { assets, debts, net: assets - debts }
  })

  const hasAccounts = computed(() => accounts.value.length > 0)

  return {
    accounts,
    filter,
    groups,
    totals,
    summary,
    hasAccounts,
    // status query
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  }
}
