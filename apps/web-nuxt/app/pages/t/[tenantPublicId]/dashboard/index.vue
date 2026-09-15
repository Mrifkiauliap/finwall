<script setup lang="ts">
import { useAuthStore } from "@/stores/auth";
import {
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  Wallet,
} from "lucide-vue-next";

definePageMeta({
  middleware: ["tenant"],
});

const authStore = useAuthStore();
const { tenantPath } = useTenant();
const { t } = useI18n();

// Placeholder ringkasan — nanti diisi dari endpoint laporan.
const summary = computed(() => [
  {
    key: "balance",
    label: t("dashboard.TOTAL_BALANCE"),
    value: "Rp 0",
    icon: Wallet,
    tone: "text-foreground",
  },
  {
    key: "income",
    label: t("dashboard.INCOME_MONTH"),
    value: "Rp 0",
    icon: ArrowDownLeft,
    tone: "text-income",
  },
  {
    key: "expense",
    label: t("dashboard.EXPENSE_MONTH"),
    value: "Rp 0",
    icon: ArrowUpRight,
    tone: "text-expense",
  },
  {
    key: "net",
    label: t("dashboard.NET_MONTH"),
    value: "Rp 0",
    icon: TrendingUp,
    tone: "text-primary",
  },
]);
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold tracking-tight">
        {{ t("dashboard.TITLE") }}
      </h1>
      <p class="text-sm text-muted-foreground">
        {{
          t("dashboard.WELCOME", {
            name: authStore.user?.username || "Pengguna",
          })
        }}
      </p>
    </div>

    <!-- Ringkasan -->
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div
        v-for="item in summary"
        :key="item.key"
        class="rounded-xl border bg-card p-5 text-card-foreground shadow-elevation-sm"
      >
        <div class="flex items-center justify-between">
          <p class="text-sm font-medium text-muted-foreground">
            {{ item.label }}
          </p>
          <component :is="item.icon" class="size-4 text-muted-foreground" />
        </div>
        <p :class="['mt-2 text-2xl font-bold tabular-nums', item.tone]">
          {{ item.value }}
        </p>
      </div>
    </div>

    <!-- Workspace aktif -->
    <div
      class="rounded-xl border bg-card p-5 text-card-foreground shadow-elevation-sm"
    >
      <p class="text-sm font-medium text-muted-foreground">
        {{ t("dashboard.ACTIVE_WORKSPACE") }}
      </p>
      <p class="mt-1 text-lg font-semibold">
        {{ authStore.currentTenant?.name || "-" }}
      </p>
      <p class="text-xs text-muted-foreground capitalize">
        {{ t("dashboard.YOUR_ROLE") }}:
        {{ authStore.currentTenant?.role || "-" }}
      </p>
    </div>

    <!-- Empty state transaksi -->
    <div
      class="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed bg-card/50 p-10 text-center"
    >
      <Wallet class="size-8 text-muted-foreground" />
      <p class="text-sm font-medium">{{ t("dashboard.EMPTY_TITLE") }}</p>
      <p class="max-w-sm text-sm text-muted-foreground">
        {{ t("dashboard.EMPTY_DESCRIPTION") }}
      </p>
      <NuxtLink
        :to="tenantPath('/transactions')"
        class="mt-2 inline-flex h-9 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        {{ t("dashboard.ADD_TRANSACTION") }}
      </NuxtLink>
    </div>
  </div>
</template>
