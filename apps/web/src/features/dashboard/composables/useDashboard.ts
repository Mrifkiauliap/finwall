import { useTenant } from '@/composables/useTenant'
import { queryKeys } from '@/lib/query'
import { fetchDashboard } from '@/services/dashboard'
import type { DashboardResponse } from '@finwall/shared'
import { useQuery } from '@tanstack/vue-query'
import { computed } from 'vue'

/** Nilai kosong agar template tetap aman sebelum data tiba. */
const EMPTY: DashboardResponse = {
  totals: { netWorth: 0, assets: 0, debts: 0, accountCount: 0 },
  currentMonth: { month: '', income: 0, expense: 0, net: 0 },
  trend: [],
  topExpenseCategories: [],
  recentTransactions: [],
  topAccounts: [],
}

/**
 * Data dashboard tenant aktif.
 *
 * Cache di-key dengan `tenantPublicId` sehingga berpindah workspace memakai
 * cache terpisah. Seluruh agregasi dihitung server (lihat `DashboardService`) —
 * `useDashboard` hanya mengekspos hasilnya, plus beberapa turunan tampilan.
 */
export function useDashboard() {
  const { tenantPublicId } = useTenant()

  const query = useQuery({
    enabled: computed(() => !!tenantPublicId.value),
    queryKey: computed(() => queryKeys.dashboard(tenantPublicId.value ?? 'none')),
    queryFn: () => fetchDashboard(tenantPublicId.value as string),
  })

  const data = computed<DashboardResponse>(() => query.data.value ?? EMPTY)

  const totals = computed(() => data.value.totals)
  const currentMonth = computed(() => data.value.currentMonth)
  const trend = computed(() => data.value.trend)
  const topExpenseCategories = computed(() => data.value.topExpenseCategories)
  const recentTransactions = computed(() => data.value.recentTransactions)
  const topAccounts = computed(() => data.value.topAccounts)

  /** Apakah tenant sama sekali belum punya transaksi. */
  const isEmpty = computed(
    () =>
      data.value.recentTransactions.length === 0 &&
      data.value.currentMonth.income === 0 &&
      data.value.currentMonth.expense === 0,
  )

  /**
   * Skala grafik tren.
   *
   * Dihitung dari nilai absolut terbesar supaya batang tetap proporsional dan
   * tidak pernah membagi nol saat semua bulan kosong.
   */
  const trendMax = computed(() => {
    const values = trend.value.flatMap((month) => [month.income, month.expense])
    return values.length > 0 ? Math.max(...values, 0) : 0
  })

  return {
    data,
    totals,
    currentMonth,
    trend,
    trendMax,
    topExpenseCategories,
    recentTransactions,
    topAccounts,
    isEmpty,
    // status query
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  }
}
