<script setup lang="ts">
import { usePageLoading } from '@/composables/usePageLoading'
import { useTenant } from '@/composables/useTenant'
import { useDashboard } from '@/features/dashboard/composables/useDashboard'
import { useAuthStore } from '@/stores/auth'
import { formatCurrency, formatDateTime, formatMonthLabel } from '@/lib/format'
import type { DashboardTransactionType } from '@finwall/shared'
import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  Loader2,
  Plus,
  RefreshCw,
  ServerCrash,
  TrendingUp,
  Wallet,
} from 'lucide-vue-next'
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'

const { t, locale } = useI18n()
const authStore = useAuthStore()
const { tenantPath } = useTenant()
const { withLoading } = usePageLoading()

const {
  totals,
  currentMonth,
  trend,
  trendMax,
  topExpenseCategories,
  recentTransactions,
  topAccounts,
  isEmpty,
  isLoading,
  isError,
  refetch,
} = useDashboard()

/** Kartu ringkasan utama. */
const summaryCards = computed(() => [
  {
    key: 'netWorth',
    label: t('dashboard.NET_WORTH'),
    value: formatCurrency(totals.value.netWorth, 'IDR', locale.value),
    icon: TrendingUp,
    tone: totals.value.netWorth >= 0 ? 'text-foreground' : 'text-expense',
  },
  {
    key: 'income',
    label: t('dashboard.INCOME_MONTH'),
    value: formatCurrency(currentMonth.value.income, 'IDR', locale.value),
    icon: ArrowDownLeft,
    tone: 'text-income',
  },
  {
    key: 'expense',
    label: t('dashboard.EXPENSE_MONTH'),
    value: formatCurrency(currentMonth.value.expense, 'IDR', locale.value),
    icon: ArrowUpRight,
    tone: 'text-expense',
  },
  {
    key: 'net',
    label: t('dashboard.NET_MONTH'),
    value: formatCurrency(currentMonth.value.net, 'IDR', locale.value),
    icon: Wallet,
    tone: currentMonth.value.net >= 0 ? 'text-income' : 'text-expense',
  },
])

/**
 * Tinggi batang grafik (persen).
 *
 * Nilai 0 tetap diberi tinggi minimum tipis agar batangnya terlihat sebagai
 * "nol", bukan menghilang tanpa jejak.
 */
function barHeight(value: number): string {
  if (trendMax.value <= 0) return '2%'
  const ratio = Math.abs(value) / trendMax.value
  return `${Math.max(ratio * 100, 2)}%`
}

/** Label kategori: transaksi tanpa kategori memakai teks fallback. */
function categoryLabel(name: string | null): string {
  return name && name.length > 0 ? name : t('dashboard.NO_CATEGORY')
}

/** Persentase kategori terhadap total pengeluaran (untuk progress bar). */
function categoryShare(total: number): string {
  const sum = topExpenseCategories.value.reduce((acc, item) => acc + item.total, 0)
  if (sum <= 0) return '0%'
  return `${Math.round((total / sum) * 100)}%`
}

const TYPE_META: Record<DashboardTransactionType, { icon: unknown; tone: string; sign: string }> = {
  income: { icon: ArrowDownLeft, tone: 'text-income', sign: '+' },
  expense: { icon: ArrowUpRight, tone: 'text-expense', sign: '-' },
  transfer_in: { icon: ArrowLeftRight, tone: 'text-muted-foreground', sign: '+' },
  transfer_out: { icon: ArrowLeftRight, tone: 'text-muted-foreground', sign: '-' },
}

const recentRows = computed(() =>
  recentTransactions.value.map((tx) => ({
    ...tx,
    meta: TYPE_META[tx.type],
    amount: `${TYPE_META[tx.type].sign}${formatCurrency(tx.amount, 'IDR', locale.value)}`,
    when: formatDateTime(tx.transactionAt, locale.value),
    category: categoryLabel(tx.categoryName),
  })),
)

async function retry() {
  await withLoading(() => refetch())
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div class="min-w-0">
        <h1 class="text-2xl font-bold tracking-tight">{{ t('dashboard.TITLE') }}</h1>
        <p class="truncate text-sm text-muted-foreground">
          {{
            t('dashboard.WELCOME', {
              name: authStore.user?.username || t('accountmenu.USER_FALLBACK'),
            })
          }}
        </p>
      </div>

      <div class="flex shrink-0 items-center gap-2">
        <button
          type="button"
          class="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-input px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-60"
          :disabled="isLoading"
          @click="retry"
        >
          <RefreshCw class="size-4" :class="isLoading && 'animate-spin'" />
          <span class="sr-only sm:not-sr-only">{{ t('workspace.RETRY') }}</span>
        </button>

        <RouterLink
          :to="tenantPath('/transactions')"
          class="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Plus class="size-4" />
          {{ t('dashboard.ADD_TRANSACTION') }}
        </RouterLink>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="flex items-center gap-2 text-sm text-muted-foreground">
      <Loader2 class="size-4 animate-spin" />
      {{ t('common.MESSAGE.PROCESSING') }}
    </div>

    <!-- Gagal memuat -->
    <div
      v-else-if="isError"
      class="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed bg-card/50 p-10 text-center"
    >
      <ServerCrash class="size-8 text-destructive" />
      <p class="text-sm font-medium">{{ t('notification.TITLE.ERROR') }}</p>
      <button
        type="button"
        class="mt-2 inline-flex h-9 items-center rounded-lg border border-input px-4 text-sm font-medium transition-colors hover:bg-muted"
        @click="retry"
      >
        {{ t('workspace.RETRY') }}
      </button>
    </div>

    <template v-else>
      <!-- Kartu ringkasan -->
      <div class="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
        <div
          v-for="card in summaryCards"
          :key="card.key"
          class="rounded-xl border bg-card p-4 text-card-foreground shadow-elevation-sm sm:p-5"
        >
          <div class="flex items-center justify-between gap-2">
            <p class="truncate text-sm font-medium text-muted-foreground">{{ card.label }}</p>
            <component :is="card.icon" class="size-4 shrink-0 text-muted-foreground" />
          </div>
          <p :class="['mt-2 text-xl font-bold tabular-nums sm:text-2xl', card.tone]" data-numeric>
            {{ card.value }}
          </p>
        </div>
      </div>

      <!-- Posisi aset/utang -->
      <div class="grid gap-3 sm:grid-cols-3 sm:gap-4">
        <div class="rounded-xl border bg-card p-4 text-card-foreground">
          <p class="text-sm font-medium text-muted-foreground">{{ t('dashboard.ASSETS') }}</p>
          <p class="mt-1 text-lg font-semibold tabular-nums text-income" data-numeric>
            {{ formatCurrency(totals.assets, 'IDR', locale) }}
          </p>
        </div>
        <div class="rounded-xl border bg-card p-4 text-card-foreground">
          <p class="text-sm font-medium text-muted-foreground">{{ t('dashboard.DEBTS') }}</p>
          <p class="mt-1 text-lg font-semibold tabular-nums text-expense" data-numeric>
            {{ formatCurrency(totals.debts, 'IDR', locale) }}
          </p>
        </div>
        <div class="rounded-xl border bg-card p-4 text-card-foreground">
          <p class="text-sm font-medium text-muted-foreground">
            {{ t('dashboard.ACCOUNT_COUNT') }}
          </p>
          <p class="mt-1 text-lg font-semibold tabular-nums" data-numeric>
            {{ totals.accountCount }}
          </p>
        </div>
      </div>

      <!-- Grafik tren arus kas -->
      <section class="rounded-xl border bg-card p-4 text-card-foreground sm:p-5">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 class="text-base font-semibold">{{ t('dashboard.TREND_TITLE') }}</h2>
            <p class="text-xs text-muted-foreground">{{ t('dashboard.TREND_SUBTITLE') }}</p>
          </div>

          <!-- Legenda -->
          <div class="flex items-center gap-3 text-xs text-muted-foreground">
            <span class="flex items-center gap-1.5">
              <span class="size-2.5 rounded-sm bg-income" aria-hidden="true" />
              {{ t('dashboard.INCOME_MONTH') }}
            </span>
            <span class="flex items-center gap-1.5">
              <span class="size-2.5 rounded-sm bg-expense" aria-hidden="true" />
              {{ t('dashboard.EXPENSE_MONTH') }}
            </span>
          </div>
        </div>

        <p v-if="trendMax === 0" class="py-10 text-center text-sm text-muted-foreground">
          {{ t('dashboard.NO_DATA') }}
        </p>

        <!--
          Grafik batang dibuat dengan CSS (tanpa pustaka chart): cukup untuk
          6 bulan, ikut token warna tema, dan tidak menambah bobot bundel.
        -->
        <div
          v-else
          class="mt-5 flex items-end gap-2 sm:gap-4"
          role="img"
          :aria-label="t('dashboard.TREND_TITLE')"
        >
          <div
            v-for="month in trend"
            :key="month.month"
            class="flex min-w-0 flex-1 flex-col items-center gap-2"
          >
            <div class="flex h-32 w-full items-end justify-center gap-1 sm:h-40 sm:gap-1.5">
              <div
                class="w-2.5 rounded-t bg-income transition-all duration-500 sm:w-3"
                :style="{ height: barHeight(month.income) }"
                :title="`${t('dashboard.INCOME_MONTH')}: ${formatCurrency(month.income, 'IDR', locale)}`"
              />
              <div
                class="w-2.5 rounded-t bg-expense transition-all duration-500 sm:w-3"
                :style="{ height: barHeight(month.expense) }"
                :title="`${t('dashboard.EXPENSE_MONTH')}: ${formatCurrency(month.expense, 'IDR', locale)}`"
              />
            </div>
            <span class="truncate text-[10px] text-muted-foreground sm:text-xs">
              {{ formatMonthLabel(month.month, locale) }}
            </span>
          </div>
        </div>
      </section>

      <!-- Pengeluaran teratas + akun utama -->
      <div class="grid gap-4 lg:grid-cols-2">
        <!-- Kategori pengeluaran terbesar -->
        <section class="rounded-xl border bg-card p-4 text-card-foreground sm:p-5">
          <h2 class="text-base font-semibold">{{ t('dashboard.TOP_EXPENSES_TITLE') }}</h2>

          <p v-if="topExpenseCategories.length === 0" class="py-6 text-sm text-muted-foreground">
            {{ t('dashboard.NO_DATA') }}
          </p>

          <ul v-else class="mt-4 space-y-3">
            <li v-for="item in topExpenseCategories" :key="item.publicId ?? item.name">
              <div class="flex items-center justify-between gap-3 text-sm">
                <span class="min-w-0 truncate font-medium">{{ categoryLabel(item.name) }}</span>
                <span class="shrink-0 tabular-nums text-muted-foreground" data-numeric>
                  {{ formatCurrency(item.total, 'IDR', locale) }}
                </span>
              </div>
              <div class="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  class="h-full rounded-full transition-all duration-500"
                  :style="{
                    width: categoryShare(item.total),
                    backgroundColor: item.color ?? 'var(--expense)',
                  }"
                />
              </div>
            </li>
          </ul>
        </section>

        <!-- Akun dengan saldo terbesar -->
        <section class="rounded-xl border bg-card p-4 text-card-foreground sm:p-5">
          <div class="flex items-center justify-between gap-2">
            <h2 class="text-base font-semibold">{{ t('dashboard.TOP_ACCOUNTS_TITLE') }}</h2>
            <RouterLink
              :to="tenantPath('/accounts')"
              class="shrink-0 text-xs font-medium text-primary hover:underline"
            >
              {{ t('dashboard.VIEW_ALL') }}
            </RouterLink>
          </div>

          <p v-if="topAccounts.length === 0" class="py-6 text-sm text-muted-foreground">
            {{ t('dashboard.NO_DATA') }}
          </p>

          <ul v-else class="mt-4 divide-y">
            <li
              v-for="account in topAccounts"
              :key="account.publicId"
              class="flex items-center gap-3 py-2.5 text-sm"
            >
              <span
                class="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground"
                aria-hidden="true"
              >
                <Wallet class="size-4" />
              </span>
              <span class="min-w-0 flex-1 truncate font-medium">{{ account.name }}</span>
              <span class="shrink-0 tabular-nums" data-numeric>
                {{ formatCurrency(account.balance, account.currency, locale) }}
              </span>
            </li>
          </ul>
        </section>
      </div>

      <!-- Transaksi terbaru -->
      <section class="rounded-xl border bg-card p-4 text-card-foreground sm:p-5">
        <div class="flex items-center justify-between gap-2">
          <h2 class="text-base font-semibold">{{ t('dashboard.RECENT_TITLE') }}</h2>
          <RouterLink
            :to="tenantPath('/transactions')"
            class="shrink-0 text-xs font-medium text-primary hover:underline"
          >
            {{ t('dashboard.VIEW_ALL') }}
          </RouterLink>
        </div>

        <!-- Empty state: user belum punya transaksi sama sekali -->
        <div v-if="isEmpty" class="flex flex-col items-center gap-2 py-8 text-center">
          <Wallet class="size-7 text-muted-foreground" />
          <p class="text-sm font-medium">{{ t('dashboard.EMPTY_TITLE') }}</p>
          <p class="max-w-sm text-sm text-muted-foreground">
            {{ t('dashboard.EMPTY_DESCRIPTION') }}
          </p>
          <RouterLink
            :to="tenantPath('/transactions')"
            class="mt-2 inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Plus class="size-4" />
            {{ t('dashboard.ADD_TRANSACTION') }}
          </RouterLink>
        </div>

        <ul v-else class="mt-4 divide-y">
          <li
            v-for="row in recentRows"
            :key="row.publicId"
            class="flex items-center gap-3 py-3 text-sm"
          >
            <span
              class="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted"
              aria-hidden="true"
            >
              <component :is="row.meta.icon" class="size-4" :class="row.meta.tone" />
            </span>

            <div class="min-w-0 flex-1">
              <p class="truncate font-medium">
                {{ row.description || row.category }}
              </p>
              <p class="truncate text-xs text-muted-foreground">
                {{ row.category }} &middot; {{ row.accountName }} &middot; {{ row.when }}
              </p>
            </div>

            <span class="shrink-0 font-semibold tabular-nums" :class="row.meta.tone" data-numeric>
              {{ row.amount }}
            </span>
          </li>
        </ul>
      </section>
    </template>
  </div>
</template>
