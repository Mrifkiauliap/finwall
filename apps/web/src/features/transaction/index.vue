<script setup lang="ts">
import { useTransactions } from '@/features/transaction/composables/useTransactions'
import TransactionFilter from '@/features/transaction/molecule/transactionFilter.vue'
import TransactionForm from '@/features/transaction/molecule/transactionForm.vue'
import TransactionTable from '@/features/transaction/molecule/transactionTable.vue'
import { formatCurrency } from '@/lib/format'
import { Loader2, Plus, Receipt } from 'lucide-vue-next'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { t, locale } = useI18n()
const { hasTransactions, filtered, summary, isLoading } = useTransactions()

const isFormOpen = ref(false)
</script>

<template>
  <div class="space-y-6">
    <!-- Header + aksi -->
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div class="min-w-0">
        <h1 class="text-2xl font-bold tracking-tight">{{ t('transactions.TITLE') }}</h1>
        <p class="text-sm text-muted-foreground">{{ t('transactions.SUBTITLE') }}</p>
      </div>

      <button
        type="button"
        class="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        @click="isFormOpen = true"
      >
        <Plus class="size-4" />
        {{ t('transactions.CREATE') }}
      </button>
    </div>

    <!-- Ringkasan hasil filter -->
    <div v-if="hasTransactions" class="grid gap-4 sm:grid-cols-3">
      <div class="rounded-xl border bg-card p-5 text-card-foreground shadow-elevation-sm">
        <p class="text-sm font-medium text-muted-foreground">
          {{ t('transactions.FILTER.INCOME') }}
        </p>
        <p class="mt-2 text-xl font-bold tabular-nums text-income" data-numeric>
          {{ formatCurrency(summary.income, 'IDR', locale) }}
        </p>
      </div>
      <div class="rounded-xl border bg-card p-5 text-card-foreground shadow-elevation-sm">
        <p class="text-sm font-medium text-muted-foreground">
          {{ t('transactions.FILTER.EXPENSE') }}
        </p>
        <p class="mt-2 text-xl font-bold tabular-nums text-expense" data-numeric>
          {{ formatCurrency(summary.expense, 'IDR', locale) }}
        </p>
      </div>
      <div class="rounded-xl border bg-card p-5 text-card-foreground shadow-elevation-sm">
        <p class="text-sm font-medium text-muted-foreground">
          {{ t('dashboard.NET_MONTH') }}
        </p>
        <p class="mt-2 text-xl font-bold tabular-nums" data-numeric>
          {{ formatCurrency(summary.net, 'IDR', locale) }}
        </p>
      </div>
    </div>

    <!-- Filter -->
    <TransactionFilter v-if="hasTransactions" />

    <!-- Loading -->
    <div v-if="isLoading" class="flex items-center gap-2 text-sm text-muted-foreground">
      <Loader2 class="size-4 animate-spin" />
      {{ t('common.MESSAGE.PROCESSING') }}
    </div>

    <!-- Kosong -->
    <div
      v-else-if="!hasTransactions"
      class="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed bg-card/50 p-10 text-center"
    >
      <Receipt class="size-8 text-muted-foreground" />
      <p class="text-sm font-medium">{{ t('transactions.EMPTY_TITLE') }}</p>
      <p class="max-w-sm text-sm text-muted-foreground">
        {{ t('transactions.EMPTY_DESCRIPTION') }}
      </p>
      <button
        type="button"
        class="mt-2 inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        @click="isFormOpen = true"
      >
        <Plus class="size-4" />
        {{ t('transactions.CREATE') }}
      </button>
    </div>

    <!-- Hasil filter kosong -->
    <div
      v-else-if="filtered.length === 0"
      class="rounded-xl border border-dashed bg-card/50 p-10 text-center text-sm text-muted-foreground"
    >
      {{ t('transactions.NO_RESULT') }}
    </div>

    <!-- Tabel -->
    <TransactionTable v-else />

    <TransactionForm :open="isFormOpen" @close="isFormOpen = false" />
  </div>
</template>
