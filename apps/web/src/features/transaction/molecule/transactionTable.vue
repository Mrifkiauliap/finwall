<!-- Tabel transaksi (desktop) dengan tampilan kartu (mobile). -->
<script setup lang="ts">
import { useAccounts } from '@/features/accounts/composables/useAccounts'
import { useTransactions } from '@/features/transaction/composables/useTransactions'
import type { Transaction, TransactionType } from '@/features/transaction/types'
import { formatCurrency, formatDate } from '@/lib/format'
import { ArrowDownLeft, ArrowLeftRight, ArrowUpRight } from 'lucide-vue-next'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { filtered } = useTransactions()
const { accounts } = useAccounts()
const { t, locale } = useI18n()

/** Nama akun dari publicId; fallback "-" bila akun sudah tidak ada. */
const accountName = (publicId: string) =>
  accounts.value.find((a) => a.publicId === publicId)?.name ?? '-'

/** Label kategori: nilai tersimpan hanya kuncinya (mis. `FOOD`). */
const categoryLabel = (key: string) =>
  t(`transactions.CATEGORY.${key.replace(/^transactions\.CATEGORY\./, '')}`)

const TYPE_META: Record<TransactionType, { icon: unknown; tone: string }> = {
  income: { icon: ArrowDownLeft, tone: 'text-income' },
  expense: { icon: ArrowUpRight, tone: 'text-expense' },
  transfer: { icon: ArrowLeftRight, tone: 'text-muted-foreground' },
}

/** Nominal bertanda sesuai jenis transaksi. */
function signedAmount(tx: Transaction): string {
  const value = formatCurrency(tx.amount, tx.currency, locale.value)
  if (tx.type === 'income') return `+${value}`
  if (tx.type === 'expense') return `-${value}`
  return value
}

function amountClass(type: TransactionType): string {
  if (type === 'income') return 'text-income'
  if (type === 'expense') return 'text-expense'
  return 'text-foreground'
}

const rows = computed(() =>
  filtered.value.map((tx) => ({
    tx,
    meta: TYPE_META[tx.type],
    category: categoryLabel(tx.categoryKey),
    date: formatDate(tx.date, locale.value),
    amount: signedAmount(tx),
    account: accountName(tx.accountId),
    toAccount: tx.toAccountId ? accountName(tx.toAccountId) : null,
  })),
)
</script>

<template>
  <!-- Desktop: tabel -->
  <div class="hidden overflow-hidden rounded-xl border bg-card md:block">
    <table class="w-full text-sm">
      <caption class="sr-only">
        {{
          t('transactions.TABLE_CAPTION')
        }}
      </caption>
      <thead class="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
        <tr>
          <th scope="col" class="px-4 py-3 text-left font-medium">
            {{ t('transactions.TABLE.DATE') }}
          </th>
          <th scope="col" class="px-4 py-3 text-left font-medium">
            {{ t('transactions.TABLE.CATEGORY') }}
          </th>
          <th scope="col" class="px-4 py-3 text-left font-medium">
            {{ t('transactions.TABLE.ACCOUNT') }}
          </th>
          <th scope="col" class="px-4 py-3 text-right font-medium">
            {{ t('transactions.TABLE.AMOUNT') }}
          </th>
        </tr>
      </thead>
      <tbody class="divide-y">
        <tr v-for="row in rows" :key="row.tx.id" class="transition-colors hover:bg-muted/40">
          <td class="whitespace-nowrap px-4 py-3 text-muted-foreground">{{ row.date }}</td>
          <td class="px-4 py-3">
            <div class="flex items-center gap-2">
              <component :is="row.meta.icon" class="size-4 shrink-0" :class="row.meta.tone" />
              <span class="truncate">{{ row.category }}</span>
            </div>
          </td>
          <td class="px-4 py-3 text-muted-foreground">
            <span class="truncate">{{ row.account }}</span>
            <span v-if="row.toAccount" class="truncate"> &rarr; {{ row.toAccount }}</span>
          </td>
          <td
            class="whitespace-nowrap px-4 py-3 text-right font-medium tabular-nums"
            :class="amountClass(row.tx.type)"
            data-numeric
          >
            {{ row.amount }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- Mobile: kartu -->
  <ul class="space-y-2 md:hidden">
    <li
      v-for="row in rows"
      :key="row.tx.id"
      class="flex items-center gap-3 rounded-xl border bg-card p-3"
    >
      <div
        class="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted"
        aria-hidden="true"
      >
        <component :is="row.meta.icon" class="size-4" :class="row.meta.tone" />
      </div>

      <div class="min-w-0 flex-1">
        <p class="truncate text-sm font-medium">{{ row.category }}</p>
        <p class="truncate text-xs text-muted-foreground">
          {{ row.date }} &middot; {{ row.account }}
          <span v-if="row.toAccount"> &rarr; {{ row.toAccount }}</span>
        </p>
      </div>

      <span
        class="shrink-0 text-sm font-semibold tabular-nums"
        :class="amountClass(row.tx.type)"
        data-numeric
      >
        {{ row.amount }}
      </span>
    </li>
  </ul>
</template>
