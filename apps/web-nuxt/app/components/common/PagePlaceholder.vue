<!-- app/components/common/PagePlaceholder.vue -->
<script setup lang="ts">
import { Construction } from "lucide-vue-next";

withDefaults(
  defineProps<{
    title: string;
    subtitle?: string;
    description?: string;
  }>(),
  {
    subtitle: undefined,
    description: undefined,
  },
);
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold tracking-tight">{{ title }}</h1>
      <p v-if="subtitle" class="text-sm text-muted-foreground">
        {{ subtitle }}
      </p>
    </div>

    <div
      class="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed bg-card/50 p-12 text-center"
    >
      <Construction class="size-8 text-muted-foreground" />
      <p class="text-sm font-medium">{{ description }}</p>
    </div>
  </div>
</template>
