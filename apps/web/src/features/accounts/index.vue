<script setup lang="ts">
import { usePageLoading } from '@/composables/usePageLoading'
import { useAccounts } from '@/features/accounts/composables/useAccounts'
import AccountForm from '@/features/accounts/molecule/accountForm.vue'
import type { AccountsFilter } from '@/features/accounts/types'
import { formatCurrency } from '@/lib/format'
import { ChevronRight, Loader2, Plus, ServerCrash, Wallet } from 'lucide-vue-next'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { t, locale } = useI18n()
const { withLoading } = usePageLoading()
const { filter, groups, totals, hasAccounts, isLoading, isError, refetch } = useAccounts()

const isFormOpen = ref(false)
const expanded = ref<Record<string, boolean>>({})

function toggleGroup(type: string) {
  expanded.value[type] = !expanded.value[type]
}

/** Grup pertama terbuka agar isinya langsung terlihat. */
function isExpanded(type: string, index: number) {
  return expanded.value[type] ?? index === 0
}

const filterOptions = computed<{ value: AccountsFilter; label: string }[]>(() => [
  { value: 'all', label: t('accounts.FILTER.ALL') },
  { value: 'active', label: t('accounts.FILTER.ACTIVE') },
  { value: 'inactive', label: t('accounts.FILTER.INACTIVE') },
])

/** Total akun yang sedang tampil (setelah filter). */
const visibleCount = computed(() =>
  groups.value.reduce((sum, group) => sum + group.accounts.length, 0),
)

/** Coba lagi sambil menampilkan overlay agar jeda jaringan tidak membingungkan. */
async function retry() {
  await withLoading(() => refetch())
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header + aksi -->
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div class="min-w-0">
        <h1 class="text-2xl font-bold tracking-tight">{{ t('accounts.TITLE') }}</h1>
        <p class="text-sm text-muted-foreground">{{ t('accounts.SUBTITLE') }}</p>
      </div>

      <button
        type="button"
        class="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        @click="isFormOpen = true"
      >
        <Plus class="size-4" />
        {{ t('accounts.NEW_ACCOUNT') }}
      </button>
    </div>

    <!-- Ringkasan -->
    <div class="grid gap-3 sm:grid-cols-3 sm:gap-4">
      <div class="rounded-xl border bg-card p-4 text-card-foreground shadow-elevation-sm sm:p-5">
        <p class="truncate text-sm font-medium text-muted-foreground">
          {{ t('accounts.TOTAL_ASSETS') }}
        </p>
        <p class="mt-2 text-xl font-bold tabular-nums text-income sm:text-2xl" data-numeric>
          {{ formatCurrency(totals.assets, 'IDR', locale) }}
        </p>
      </div>
      <div class="rounded-xl border bg-card p-4 text-card-foreground shadow-elevation-sm sm:p-5">
        <p class="truncate text-sm font-medium text-muted-foreground">
          {{ t('accounts.TOTAL_DEBTS') }}
        </p>
        <p class="mt-2 text-xl font-bold tabular-nums text-expense sm:text-2xl" data-numeric>
          {{ formatCurrency(totals.debts, 'IDR', locale) }}
        </p>
      </div>
      <div class="rounded-xl border bg-card p-4 text-card-foreground shadow-elevation-sm sm:p-5">
        <p class="truncate text-sm font-medium text-muted-foreground">
          {{ t('accounts.NET_WORTH') }}
        </p>
        <p class="mt-2 text-xl font-bold tabular-nums sm:text-2xl" data-numeric>
          {{ formatCurrency(totals.net, 'IDR', locale) }}
        </p>
      </div>
    </div>

    <!-- Filter -->
    <div
      v-if="hasAccounts"
      class="flex w-full overflow-x-auto rounded-lg bg-muted p-0.5 text-xs font-medium sm:w-auto sm:max-w-xs"
      role="tablist"
    >
      <button
        v-for="option in filterOptions"
        :key="option.value"
        type="button"
        role="tab"
        :aria-selected="filter === option.value"
        class="flex-1 whitespace-nowrap rounded-md px-3 py-2 transition-colors"
        :class="
          filter === option.value
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        "
        @click="filter = option.value"
      >
        {{ option.label }}
      </button>
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

    <!-- Kosong -->
    <div
      v-else-if="!hasAccounts"
      class="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed bg-card/50 p-10 text-center"
    >
      <Wallet class="size-8 text-muted-foreground" />
      <p class="text-sm font-medium">{{ t('accounts.EMPTY_TITLE') }}</p>
      <p class="max-w-sm text-sm text-muted-foreground">
        {{ t('accounts.EMPTY_DESCRIPTION') }}
      </p>
      <button
        type="button"
        class="mt-2 inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        @click="isFormOpen = true"
      >
        <Plus class="size-4" />
        {{ t('accounts.NEW_ACCOUNT') }}
      </button>
    </div>

    <!-- Tidak ada hasil setelah filter -->
    <div
      v-else-if="visibleCount === 0"
      class="rounded-xl border border-dashed bg-card/50 p-10 text-center text-sm text-muted-foreground"
    >
      {{ t('transactions.NO_RESULT') }}
    </div>

    <!-- Daftar grup -->
    <div v-else class="space-y-3">
      <div
        v-for="(group, index) in groups"
        :key="group.type"
        class="overflow-hidden rounded-xl border bg-card text-card-foreground"
      >
        <button
          type="button"
          class="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50"
          :aria-expanded="isExpanded(group.type, index)"
          @click="toggleGroup(group.type)"
        >
          <ChevronRight
            class="size-4 shrink-0 text-muted-foreground transition-transform duration-200"
            :class="isExpanded(group.type, index) && 'rotate-90'"
          />
          <span class="min-w-0 flex-1 truncate font-medium">{{ t(group.labelKey) }}</span>
          <span class="shrink-0 text-xs text-muted-foreground">
            {{ t('accounts.TOTAL_ACCOUNTS', { count: group.accounts.length }) }}
          </span>
          <span
            class="shrink-0 text-sm font-semibold tabular-nums"
            :class="group.nature === 'debt' ? 'text-expense' : 'text-foreground'"
            data-numeric
          >
            {{ formatCurrency(group.total, 'IDR', locale) }}
          </span>
        </button>

        <!-- Expand/collapse: grid-template-rows agar transisi tinggi mulus -->
        <Transition name="acc-group">
          <div v-if="isExpanded(group.type, index)" class="acc-group-container">
            <div class="acc-group-inner divide-y border-t">
              <!-- Baris akun. Belum ada halaman detail, jadi ini bukan tautan. -->
              <div
                v-for="account in group.accounts"
                :key="account.publicId"
                class="flex items-center gap-3 px-4 py-3 text-sm"
              >
                <span class="min-w-0 flex-1 truncate">{{ account.name }}</span>
                <span
                  v-if="!account.isActive"
                  class="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
                >
                  {{ t('accounts.FILTER.INACTIVE') }}
                </span>
                <span class="shrink-0 tabular-nums" data-numeric>
                  {{ formatCurrency(account.balance, account.currency, locale) }}
                </span>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </div>

    <AccountForm :open="isFormOpen" @close="isFormOpen = false" />
  </div>
</template>

<style scoped>
/* Expand/collapse presisi via grid-template-rows (bukan max-height). */
.acc-group-enter-active,
.acc-group-leave-active {
  display: grid;
  transition:
    grid-template-rows 280ms cubic-bezier(0.16, 1, 0.3, 1),
    opacity 200ms ease;
  overflow: hidden;
}

.acc-group-enter-from,
.acc-group-leave-to {
  grid-template-rows: 0fr;
  opacity: 0;
}

.acc-group-enter-to,
.acc-group-leave-from {
  grid-template-rows: 1fr;
  opacity: 1;
}

.acc-group-inner {
  min-height: 0;
  overflow: hidden;
}

@media (prefers-reduced-motion: reduce) {
  .acc-group-enter-active,
  .acc-group-leave-active {
    transition: none;
  }
}
</style>
