<!-- app/components/layout/AccountsPanel.vue -->
<!-- Konten akun/aset. Presentation (kolom desktop) diatur pemanggil. -->
<script setup lang="ts">
import {
  formatCurrency,
  type AccountsFilter,
} from "@/composables/useAccountsRail";
import { ChevronRight, Plus, Wallet } from "lucide-vue-next";

const { groups, totals, hasAccounts, filter } = useAccountsRail();
const { tenantPath } = useTenant();
const { t } = useI18n();

// Path halaman akun di konteks tenant aktif (dipakai untuk link, bukan navigasi).
const accountsPath = computed(() => tenantPath("/accounts"));

const filters = computed<{ value: AccountsFilter; labelKey: string }[]>(() => [
  { value: "all", labelKey: "accounts.FILTER.ALL" },
  { value: "asset", labelKey: "accounts.FILTER.ASSETS" },
  { value: "debt", labelKey: "accounts.FILTER.DEBTS" },
]);

// Grup yang sedang terbuka (collapsible).
const expanded = ref<Record<string, boolean>>({});

function toggleGroup(key: string) {
  expanded.value[key] = !expanded.value[key];
}

function isExpanded(key: string, index: number) {
  return expanded.value[key] ?? index === 0;
}
</script>

<template>
  <div class="flex min-h-0 flex-1 flex-col">
    <!-- Filter -->
    <div class="p-3">
      <div
        class="flex rounded-lg bg-muted p-0.5 text-xs font-medium"
        role="tablist"
      >
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
          {{ t(f.labelKey) }}
        </button>
      </div>
    </div>

    <!-- Aksi utama -->
    <NuxtLink
      :to="accountsPath"
      class="mx-3 mb-2 flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
    >
      <Plus class="size-4" />
      {{ t("accounts.NEW_ACCOUNT") }}
    </NuxtLink>

    <!-- Content area: Empty state or Groups list -->
    <Transition name="tab-fade" mode="out-in">
      <!-- Empty state -->
      <div
        v-if="!hasAccounts"
        key="empty"
        class="flex flex-1 flex-col items-center justify-center gap-2 px-6 py-8 text-center"
      >
        <Wallet class="size-7 text-muted-foreground" />
        <p class="text-sm font-medium">{{ t("accounts.EMPTY_TITLE") }}</p>
        <p class="text-xs text-muted-foreground">
          {{ t("accounts.EMPTY_DESCRIPTION") }}
        </p>
      </div>

      <!-- Daftar grup akun -->
      <div
        v-else
        key="list"
        class="flex min-h-0 flex-1 flex-col gap-0.5 px-3 pb-3"
      >
        <div class="min-h-0 flex-1 overflow-y-auto">
          <div v-for="(group, index) in groups" :key="group.key">
            <button
              type="button"
              class="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm transition-colors hover:bg-sidebar-accent"
              :aria-expanded="isExpanded(group.key, index)"
              @click="toggleGroup(group.key)"
            >
              <ChevronRight
                class="size-3.5 shrink-0 text-muted-foreground transition-transform duration-200"
                :class="isExpanded(group.key, index) && 'rotate-90'"
              />
              <span class="flex-1 truncate text-left">{{
                t(group.labelKey)
              }}</span>
              <span
                class="tabular-nums text-xs"
                :class="
                  group.kind === 'debt' ? 'text-expense' : 'text-foreground'
                "
              >
                {{ formatCurrency(group.total) }}
              </span>
            </button>

            <!-- Expand/collapse: CSS grid-template-rows agar transisi tinggi mulus -->
            <Transition name="acc-group">
              <div
                v-if="isExpanded(group.key, index)"
                class="acc-group-container"
              >
                <div class="acc-group-inner ml-5 flex flex-col">
                  <NuxtLink
                    v-for="(account, i) in group.accounts"
                    :key="account.publicId"
                    :to="accountsPath"
                    class="account-row flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    :style="{ '--row-delay': `${i * 30}ms` }"
                  >
                    <span class="flex-1 truncate">{{ account.name }}</span>
                    <span class="tabular-nums text-xs">
                      {{ formatCurrency(account.balance, account.currency) }}
                    </span>
                  </NuxtLink>
                </div>
              </div>
            </Transition>
          </div>
        </div>

        <!-- Ringkasan -->
        <div class="mt-2 shrink-0 space-y-1 border-t pt-3 text-xs">
          <div class="flex items-center justify-between text-muted-foreground">
            <span>{{ t("accounts.TOTAL_ASSETS") }}</span>
            <span class="tabular-nums text-foreground">
              {{ formatCurrency(totals.assets) }}
            </span>
          </div>
          <div class="flex items-center justify-between text-muted-foreground">
            <span>{{ t("accounts.TOTAL_DEBTS") }}</span>
            <span class="tabular-nums text-expense">
              {{ formatCurrency(totals.debts) }}
            </span>
          </div>
          <div class="flex items-center justify-between font-medium">
            <span>{{ t("accounts.NET_WORTH") }}</span>
            <span class="tabular-nums">{{ formatCurrency(totals.net) }}</span>
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

/* Expand/collapse grup akun: CSS grid-template-rows transisi presisi (bukan max-height arbitrary) */
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

/* Baris akun muncul bertingkat */
.account-row {
  animation: acc-row-in 280ms cubic-bezier(0.16, 1, 0.3, 1) both;
  animation-delay: var(--row-delay, 0ms);
}

@keyframes acc-row-in {
  from {
    opacity: 0;
    transform: translateX(-6px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .acc-group-enter-active,
  .acc-group-leave-active,
  .tab-fade-enter-active,
  .tab-fade-leave-active,
  .account-row {
    transition: none;
    animation: none;
  }
}
</style>
