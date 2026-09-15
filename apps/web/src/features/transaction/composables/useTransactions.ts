import { useTenant } from '@/composables/useTenant'
import type {
  Transaction,
  TransactionFilterState,
  TransactionSummary,
} from '@/features/transaction/types'
import { queryKeys } from '@/lib/query'
import { fetchTransactions } from '@/services/transactions'
import { useQuery } from '@tanstack/vue-query'
import { computed, ref } from 'vue'

/**
 * Sumber data transaksi tenant aktif berbasis TanStack Query.
 *
 * Cache di-key dengan `tenantPublicId`; filter pencarian/tanggal adalah
 * preferensi tampilan sehingga disimpan di state lokal bersama.
 */

const filters = ref<TransactionFilterState>({
  search: '',
  type: 'all',
  from: '',
  to: '',
})

export function useTransactions() {
  const { tenantPublicId } = useTenant()

  const query = useQuery({
    enabled: computed(() => !!tenantPublicId.value),
    queryKey: computed(() => queryKeys.transactions(tenantPublicId.value ?? 'none')),
    queryFn: () => fetchTransactions(tenantPublicId.value as string),
  })

  const transactions = computed<Transaction[]>(() => query.data.value ?? [])

  /** Baris terbaru di atas. */
  const sorted = computed(() =>
    [...transactions.value].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0)),
  )

  const filtered = computed(() => {
    const { search, type, from, to } = filters.value
    const needle = search.trim().toLowerCase()

    return sorted.value.filter((tx) => {
      if (type !== 'all' && tx.type !== type) return false
      if (from && tx.date < from) return false
      if (to && tx.date > to) return false
      if (needle && !(tx.note ?? '').toLowerCase().includes(needle)) return false
      return true
    })
  })

  const hasTransactions = computed(() => transactions.value.length > 0)

  const summary = computed<TransactionSummary>(() => {
    const sumType = (type: Transaction['type']) =>
      filtered.value.filter((tx) => tx.type === type).reduce((sum, tx) => sum + tx.amount, 0)

    const income = sumType('income')
    const expense = sumType('expense')

    return { income, expense, net: income - expense }
  })

  function resetFilters() {
    filters.value = { search: '', type: 'all', from: '', to: '' }
  }

  return {
    transactions,
    filters,
    filtered,
    sorted,
    hasTransactions,
    summary,
    resetFilters,
    // status query
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  }
}
