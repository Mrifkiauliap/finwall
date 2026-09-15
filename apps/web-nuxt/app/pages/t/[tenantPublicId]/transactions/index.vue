<script setup lang="ts">
import { Receipt } from "lucide-vue-next";

definePageMeta({
  middleware: ["tenant"],
});

const { t } = useI18n();
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold tracking-tight">
          {{ t("transactions.TITLE") }}
        </h1>
        <p class="text-sm text-muted-foreground">
          {{ t("transactions.SUBTITLE") }}
        </p>
      </div>
    </div>

    <div
      class="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed bg-card/50 p-12 text-center"
    >
      <Receipt class="size-8 text-muted-foreground" />
      <p class="text-sm font-medium">{{ t("transactions.EMPTY_TITLE") }}</p>
      <p class="max-w-sm text-sm text-muted-foreground">
        {{ t("transactions.EMPTY_DESCRIPTION") }}
      </p>
    </div>
  </div>
</template>
