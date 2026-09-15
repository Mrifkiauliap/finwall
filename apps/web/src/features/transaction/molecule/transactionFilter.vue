<!-- Filter daftar transaksi: pencarian, jenis, dan rentang tanggal. -->
<script setup lang="ts">
import { useTransactions } from '@/features/transaction/composables/useTransactions'
import type { TransactionType } from '@/features/transaction/types'
import { Search, X } from 'lucide-vue-next'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { filters, resetFilters } = useTransactions()
const { t } = useI18n()

const typeOptions = computed<{ value: TransactionType | 'all'; label: string }[]>(() => [
  { value: 'all', label: t('transactions.FILTER.ALL') },
  { value: 'income', label: t('transactions.FILTER.INCOME') },
  { value: 'expense', label: t('transactions.FILTER.EXPENSE') },
  { value: 'transfer', label: t('transactions.FILTER.TRANSFER') },
])

const hasActiveFilters = computed(
  () =>
    filters.value.search !== '' ||
    filters.value.type !== 'all' ||
    filters.value.from !== '' ||
    filters.value.to !== '',
)
</script>

<template>
  <div class="space-y-3">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
      <!-- Pencarian -->
      <div class="relative flex-1">
        <Search
          class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <input
          v-model="filters.search"
          type="search"
          :placeholder="t('transactions.SEARCH_PLACEHOLDER')"
          :aria-label="t('transactions.SEARCH_PLACEHOLDER')"
          class="h-10 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      <!-- Jenis: bisa di-scroll horizontal di layar sempit -->
      <div
        class="flex w-full overflow-x-auto rounded-lg bg-muted p-0.5 text-xs font-medium sm:w-auto sm:shrink-0"
        role="tablist"
      >
        <button
          v-for="option in typeOptions"
          :key="option.value"
          type="button"
          role="tab"
          :aria-selected="filters.type === option.value"
          class="flex-1 whitespace-nowrap rounded-md px-3 py-2 transition-colors sm:flex-none"
          :class="
            filters.type === option.value
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          "
          @click="filters.type = option.value"
        >
          {{ option.label }}
        </button>
      </div>
    </div>

    <!-- Rentang tanggal -->
    <div class="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div class="flex flex-1 flex-col gap-1.5">
        <label for="tx-from" class="text-xs font-medium text-muted-foreground">
          {{ t('transactions.FILTER.FROM') }}
        </label>
        <input
          id="tx-from"
          v-model="filters.from"
          type="date"
          class="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      <div class="flex flex-1 flex-col gap-1.5">
        <label for="tx-to" class="text-xs font-medium text-muted-foreground">
          {{ t('transactions.FILTER.TO') }}
        </label>
        <input
          id="tx-to"
          v-model="filters.to"
          type="date"
          class="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      <button
        v-if="hasActiveFilters"
        type="button"
        class="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg border border-input px-4 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        @click="resetFilters"
      >
        <X class="size-4" />
        {{ t('transactions.FILTER.RESET') }}
      </button>
    </div>
  </div>
</template>
