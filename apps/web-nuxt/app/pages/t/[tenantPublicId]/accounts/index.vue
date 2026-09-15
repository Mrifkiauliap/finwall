<script setup lang="ts">
import type { AccountsFilter } from "@/composables/useAccountsRail";
import { formatCurrency } from "@/composables/useAccountsRail";
import { Plus, Wallet } from "lucide-vue-next";

definePageMeta({
  middleware: ["tenant"],
});

const { groups, totals, hasAccounts, filter } = useAccountsRail();
const { t } = useI18n();

const filters = computed<{ value: AccountsFilter; labelKey: string }[]>(() => [
  { value: "all", labelKey: "accounts.FILTER.ALL" },
  { value: "asset", labelKey: "accounts.FILTER.ASSETS" },
  { value: "debt", labelKey: "accounts.FILTER.DEBTS" },
]);

// Grup yang punya akun saja (halaman ini fokus ke data, bukan katalog grup).
const visibleGroups = computed(() =>
  groups.value.filter((g) => g.accounts.length),
);
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold tracking-tight">
          {{ t("accounts.TITLE") }}
        </h1>
        <p class="text-sm text-muted-foreground">
          {{ t("accounts.SUBTITLE") }}
        </p>
      </div>

      <button
        type="button"
        class="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        <Plus class="size-4" />
        {{ t("accounts.NEW_ACCOUNT") }}
      </button>
    </div>

    <!-- Ringkasan -->
    <div class="grid gap-4 sm:grid-cols-3">
      <div class="rounded-xl border bg-card p-5 shadow-elevation-sm">
        <p class="text-sm font-medium text-muted-foreground">
          {{ t("accounts.TOTAL_ASSETS") }}
        </p>
        <p class="mt-2 text-2xl font-bold tabular-nums">
          {{ formatCurrency(totals.assets) }}
        </p>
      </div>
      <div class="rounded-xl border bg-card p-5 shadow-elevation-sm">
        <p class="text-sm font-medium text-muted-foreground">
          {{ t("accounts.TOTAL_DEBTS") }}
        </p>
        <p class="mt-2 text-2xl font-bold tabular-nums text-expense">
          {{ formatCurrency(totals.debts) }}
        </p>
      </div>
      <div class="rounded-xl border bg-card p-5 shadow-elevation-sm">
        <p class="text-sm font-medium text-muted-foreground">
          {{ t("accounts.NET_WORTH") }}
        </p>
        <p
          class="mt-2 text-2xl font-bold tabular-nums"
          :class="totals.net < 0 ? 'text-expense' : 'text-income'"
        >
          {{ formatCurrency(totals.net) }}
        </p>
      </div>
    </div>

    <!-- Filter Aset/Utang — state dibagi dengan panel sidebar -->
    <div class="inline-flex rounded-lg bg-muted p-0.5 text-sm font-medium">
      <button
        v-for="f in filters"
        :key="f.value"
        type="button"
        class="rounded-md px-3 py-1.5 transition-colors"
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

    <!-- Daftar grup -->
    <div v-if="hasAccounts" class="space-y-4">
      <div
        v-for="group in visibleGroups"
        :key="group.key"
        class="rounded-xl border bg-card shadow-elevation-sm"
      >
        <div class="flex items-center justify-between border-b px-5 py-3">
          <p class="text-sm font-semibold">{{ t(group.labelKey) }}</p>
          <p
            class="tabular-nums text-sm font-medium"
            :class="group.kind === 'debt' ? 'text-expense' : 'text-foreground'"
          >
            {{ formatCurrency(group.total) }}
          </p>
        </div>

        <ul class="divide-y">
          <li
            v-for="account in group.accounts"
            :key="account.publicId"
            class="flex items-center justify-between px-5 py-3"
          >
            <span class="truncate text-sm">{{ account.name }}</span>
            <span class="tabular-nums text-sm font-medium">
              {{ formatCurrency(account.balance, account.currency) }}
            </span>
          </li>
        </ul>
      </div>
    </div>

    <!-- Empty state -->
    <div
      v-else
      class="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed bg-card/50 p-12 text-center"
    >
      <Wallet class="size-8 text-muted-foreground" />
      <p class="text-sm font-medium">{{ t("accounts.EMPTY_TITLE") }}</p>
      <p class="max-w-sm text-sm text-muted-foreground">
        {{ t("accounts.EMPTY_DESCRIPTION") }}
      </p>
    </div>
  </div>
</template>
