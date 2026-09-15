<!-- Konten akun/aset untuk panel sidebar (desktop) & sheet "Lainnya" (mobile).

     Memakai `useAccounts()` yang sama dengan halaman Akun, sehingga panel dan
     halaman tidak pernah menampilkan angka yang berbeda. Presentasi kolom
     diatur pemanggil. -->
<script setup lang="ts">
import { useTenant } from '@/composables/useTenant'
import { useAccounts } from '@/features/accounts/composables/useAccounts'
import type { AccountsFilter } from '@/features/accounts/types'
import { formatCurrency } from '@/lib/format'
import { ChevronRight, Loader2, Plus, Wallet } from 'lucide-vue-next'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink } from 'vue-router'

const { t, locale } = useI18n()

const { groups, totals, hasAccounts, filter, isLoading } = useAccounts()
const { tenantPath } = useTenant()

// Path halaman akun di konteks tenant aktif.
const accountsPath = computed(() => tenantPath('/accounts'))

const filters = computed<{ value: AccountsFilter; label: string }[]>(() => [
  { value: 'all', label: t('accounts.FILTER.ALL') },
  { value: 'active', label: t('accounts.FILTER.ACTIVE') },
  { value: 'inactive', label: t('accounts.FILTER.INACTIVE') },
])

// Grup yang sedang terbuka (collapsible).
const expanded = ref<Record<string, boolean>>({})

function toggleGroup(type: string) {
  expanded.value[type] = !expanded.value[type]
}

/** Grup pertama terbuka agar isinya langsung terlihat. */
function isExpanded(type: string, index: number) {
  return expanded.value[type] ?? index === 0
}
</script>

<template>
  <div class="flex min-h-0 flex-1 flex-col">
    <!-- Filter -->
    <div class="p-3">
      <div class="flex rounded-lg bg-muted p-0.5 text-xs font-medium" role="tablist">
        <button
          v-for="f in filters"
          :key="f.value"
          type="button"
          role="tab"
          :aria-selected="filter === f.value"
          class="flex-1 rounded-md px-2 py-1.5 transition-colors"
          :class="
            filter === f.value
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          "
          @click="filter = f.value"
        >
          {{ f.label }}
        </button>
      </div>
    </div>

    <!-- Aksi utama -->
    <RouterLink
      :to="accountsPath"
      class="mx-3 mb-2 flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
    >
      <Plus class="size-4 shrink-0" />
      {{ t('accounts.NEW_ACCOUNT') }}
    </RouterLink>

    <!-- Loading -->
    <div v-if="isLoading" class="flex items-center gap-2 px-5 py-3 text-sm text-muted-foreground">
      <Loader2 class="size-4 animate-spin" />
      {{ t('common.MESSAGE.PROCESSING') }}
    </div>

    <Transition v-else name="tab-fade" mode="out-in">
      <!-- Empty state -->
      <div
        v-if="!hasAccounts"
        key="empty"
        class="flex flex-1 flex-col items-center justify-center gap-2 px-6 py-8 text-center"
      >
        <Wallet class="size-7 text-muted-foreground" />
        <p class="text-sm font-medium">{{ t('accounts.EMPTY_TITLE') }}</p>
        <p class="text-xs text-muted-foreground">{{ t('accounts.EMPTY_DESCRIPTION') }}</p>
      </div>

      <!-- Daftar grup akun -->
      <div v-else key="list" class="flex min-h-0 flex-1 flex-col gap-0.5 px-3 pb-3">
        <div class="min-h-0 flex-1 overflow-y-auto">
          <div v-for="(group, index) in groups" :key="group.type">
            <button
              type="button"
              class="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm transition-colors hover:bg-sidebar-accent"
              :aria-expanded="isExpanded(group.type, index)"
              @click="toggleGroup(group.type)"
            >
              <ChevronRight
                class="size-3.5 shrink-0 text-muted-foreground transition-transform duration-200"
                :class="isExpanded(group.type, index) && 'rotate-90'"
              />
              <span class="flex-1 truncate text-left">{{ t(group.labelKey) }}</span>
              <span
                class="tabular-nums text-xs"
                :class="group.nature === 'debt' ? 'text-expense' : 'text-foreground'"
                data-numeric
              >
                {{ formatCurrency(group.total, 'IDR', locale) }}
              </span>
            </button>

            <!-- Expand/collapse: grid-template-rows agar transisi tinggi mulus -->
            <Transition name="acc-group">
              <div v-if="isExpanded(group.type, index)" class="acc-group-container">
                <div class="acc-group-inner ml-5 flex flex-col">
                  <RouterLink
                    v-for="(account, i) in group.accounts"
                    :key="account.publicId"
                    :to="accountsPath"
                    class="account-row flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    :style="{ '--row-delay': `${i * 30}ms` }"
                  >
                    <span class="flex-1 truncate">{{ account.name }}</span>
                    <span class="tabular-nums text-xs" data-numeric>
                      {{ formatCurrency(account.balance, account.currency, locale) }}
                    </span>
                  </RouterLink>
                </div>
              </div>
            </Transition>
          </div>
        </div>

        <!-- Ringkasan -->
        <div class="mt-2 shrink-0 space-y-1 border-t pt-3 text-xs">
          <div class="flex items-center justify-between text-muted-foreground">
            <span>{{ t('accounts.TOTAL_ASSETS') }}</span>
            <span class="tabular-nums text-foreground" data-numeric>
              {{ formatCurrency(totals.assets, 'IDR', locale) }}
            </span>
          </div>
          <div class="flex items-center justify-between text-muted-foreground">
            <span>{{ t('accounts.TOTAL_DEBTS') }}</span>
            <span class="tabular-nums text-expense" data-numeric>
              {{ formatCurrency(totals.debts, 'IDR', locale) }}
            </span>
          </div>
          <div class="flex items-center justify-between font-medium">
            <span>{{ t('accounts.NET_WORTH') }}</span>
            <span class="tabular-nums" data-numeric>
              {{ formatCurrency(totals.net, 'IDR', locale) }}
            </span>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
/* Transisi switch filter / empty state */
.tab-fade-enter-active,
.tab-fade-leave-active {
  transition:
    opacity 180ms ease,
    transform 180ms ease;
}

.tab-fade-enter-from {
  opacity: 0;
  transform: translateY(4px);
}

.tab-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

/* Expand/collapse grup akun: grid-template-rows memberi transisi tinggi yang
   presisi, bukan `max-height` sembarang. */
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

/* Baris akun muncul bertingkat mengikuti `--row-delay`. */
.account-row {
  animation: account-row-in 260ms cubic-bezier(0.16, 1, 0.3, 1) both;
  animation-delay: var(--row-delay, 0ms);
}

@keyframes account-row-in {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .tab-fade-enter-active,
  .tab-fade-leave-active,
  .acc-group-enter-active,
  .acc-group-leave-active {
    transition: none;
  }

  .account-row {
    animation: none;
  }
}
</style>
