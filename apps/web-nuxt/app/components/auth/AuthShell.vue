<!-- app/components/auth/AuthShell.vue -->
<!-- Kerangka bersama halaman auth & onboarding: split layout (panel brand +
     form). Dipakai signin, signup, create-workspace, dan join supaya keempat
     halaman punya tampilan yang identik. -->
<script setup lang="ts">
import BrandMark from "@/components/common/BrandMark.vue";
import { ShieldCheck } from "lucide-vue-next";

withDefaults(
  defineProps<{
    title: string;
    subtitle?: string;
    /** Ikon kecil di atas judul. */
    icon?: unknown;
  }>(),
  { subtitle: undefined, icon: undefined },
);

const { t } = useI18n();

const points = computed(() => [
  t("auth.BRAND_POINT_1"),
  t("auth.BRAND_POINT_2"),
  t("auth.BRAND_POINT_3"),
]);
</script>

<template>
  <div class="flex min-h-dvh w-full bg-background">
    <!-- Panel brand: hanya desktop.
         JANGAN pakai `h-full` di sini: parent hanya punya `min-height`, sehingga
         `height: 100%` di-resolve ke `auto` dan MENIMPA perilaku stretch milik
         flex item — panel jadi hanya setinggi kontennya. Biarkan default
         `align-items: stretch` yang membuatnya penuh tinggi. -->
    <aside
      class="relative hidden w-[45%] max-w-2xl shrink-0 flex-col justify-between overflow-hidden bg-primary p-10 text-primary-foreground lg:flex xl:p-14"
    >
      <!-- Dekorasi -->
      <div class="pointer-events-none absolute inset-0" aria-hidden="true">
        <div
          class="absolute -top-32 -right-24 size-96 rounded-full bg-primary-foreground/10 blur-3xl"
        />
        <div
          class="absolute -bottom-40 -left-24 size-96 rounded-full bg-black/10 blur-3xl"
        />
      </div>

      <div class="relative z-10">
        <BrandMark size="md" show-name variant="onBrand" />
      </div>

      <div class="relative z-10 space-y-6">
        <h2 class="text-3xl font-bold leading-tight tracking-tight xl:text-4xl">
          {{ t("auth.BRAND_HEADLINE") }}
        </h2>
        <p class="max-w-md text-sm leading-relaxed text-primary-foreground/80">
          {{ t("auth.BRAND_SUBTEXT") }}
        </p>

        <ul class="space-y-3 pt-2">
          <li
            v-for="point in points"
            :key="point"
            class="flex items-start gap-3 text-sm text-primary-foreground/90"
          >
            <ShieldCheck class="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <span>{{ point }}</span>
          </li>
        </ul>
      </div>

      <p class="relative z-10 text-xs text-primary-foreground/60">
        © {{ new Date().getFullYear() }} Finwall
      </p>
    </aside>

    <!-- Area form -->
    <main
      class="relative flex min-h-dvh flex-1 items-center justify-center overflow-x-hidden overflow-y-auto p-4 sm:p-6 lg:p-8 lg:py-12"
    >
      <!-- Dekorasi (terlihat di mobile, saat panel brand disembunyikan) -->
      <div
        class="pointer-events-none absolute inset-0 lg:hidden"
        aria-hidden="true"
      >
        <div
          class="absolute -top-32 -left-32 size-80 rounded-full bg-primary/10 blur-3xl"
        />
        <div
          class="absolute -bottom-32 -right-32 size-80 rounded-full bg-primary/5 blur-3xl"
        />
      </div>

      <div class="relative z-10 w-full max-w-md space-y-6">
        <!-- Header -->
        <div class="space-y-3 text-center">
          <BrandMark class="lg:hidden" size="md" />

          <div class="space-y-1.5">
            <div
              v-if="icon"
              class="mb-2 inline-flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary lg:hidden"
            >
              <component :is="icon" class="size-5" />
            </div>

            <h1 class="text-2xl font-bold tracking-tight text-foreground">
              {{ title }}
            </h1>
            <p v-if="subtitle" class="text-sm text-muted-foreground">
              {{ subtitle }}
            </p>
          </div>
        </div>

        <!-- Card -->
        <div
          class="bg-card text-card-foreground rounded-2xl border shadow-elevation-md p-6 space-y-5 sm:p-8"
        >
          <slot />
        </div>

        <!-- Di bawah card -->
        <slot name="below" />
      </div>
    </main>
  </div>
</template>
