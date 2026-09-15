<!-- app/components/settings/SettingsSection.vue -->
<!-- Kartu seksi halaman Pengaturan: judul, deskripsi opsional, dan slot aksi. -->
<script setup lang="ts">
import { cn } from "@/lib/utils";

withDefaults(
  defineProps<{
    title: string;
    description?: string;
    /** Judul besar (kartu utama) vs kecil (sub-seksi). */
    heading?: "lg" | "sm";
  }>(),
  { description: undefined, heading: "sm" },
);
</script>

<template>
  <section
    class="rounded-xl border bg-card text-card-foreground shadow-elevation-sm"
  >
    <div
      class="flex flex-wrap items-start justify-between gap-3 border-b px-5 py-4"
    >
      <div class="min-w-0">
        <h2
          :class="
            cn(
              'font-semibold tracking-tight',
              heading === 'lg' ? 'text-base' : 'text-sm',
            )
          "
        >
          {{ title }}
        </h2>
        <p v-if="description" class="mt-0.5 text-sm text-muted-foreground">
          {{ description }}
        </p>
      </div>

      <slot name="action" />
    </div>

    <div class="px-5 py-4">
      <slot />
    </div>
  </section>
</template>
