<script setup lang="ts">
import { ArrowLeft, Compass, Home } from "lucide-vue-next";

definePageMeta({
  layout: false,
});

const { t } = useI18n();
</script>

<template>
  <div
    class="relative min-h-screen flex items-center justify-center overflow-hidden bg-background p-4 sm:p-6 lg:p-8"
  >
    <!-- Background glowing ambient elements -->
    <div class="pointer-events-none absolute inset-0" aria-hidden="true">
      <div
        class="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-primary/10 blur-3xl"
      />
      <div
        class="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-primary/5 blur-3xl"
      />
    </div>

    <!-- Error Card Container -->
    <div class="relative z-10 w-full max-w-lg space-y-6 text-center">
      <!-- Floating Icon Badge -->
      <div class="flex justify-center">
        <div
          class="relative inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-card border border-border/60 shadow-xl text-primary"
        >
          <div class="absolute inset-0 rounded-2xl bg-primary/10 blur-md" />
          <Compass class="relative w-10 h-10 animate-pulse text-primary" />
        </div>
      </div>

      <!-- Hero Error Code & Typography -->
      <div class="space-y-2">
        <h1
          class="text-7xl sm:text-8xl font-black tracking-tight bg-gradient-to-b from-foreground via-foreground/90 to-foreground/50 bg-clip-text text-transparent select-none"
        >
          404
        </h1>
        <h2
          class="text-xl sm:text-2xl font-bold tracking-tight text-foreground"
        >
          {{ t("common.error.404") }}
        </h2>
        <p
          class="text-sm sm:text-base text-muted-foreground max-w-md mx-auto leading-relaxed"
        >
          {{ t("common.error.404_DESC") }}
        </p>
      </div>

      <!-- Action Buttons -->
      <div
        class="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4"
      >
        <NuxtLink
          to="/"
          class="w-full sm:w-auto inline-flex items-center justify-center h-11 px-6 rounded-xl bg-primary text-primary-foreground font-medium text-sm shadow-md shadow-primary/20 hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
        >
          <Home class="w-4 h-4 mr-2" />
          <span>{{ t("common.error.BACK_TO_HOME") }}</span>
        </NuxtLink>

        <button
          type="button"
          @click="useRouter().back()"
          class="w-full sm:w-auto inline-flex items-center justify-center h-11 px-6 rounded-xl bg-card border border-input text-foreground font-medium text-sm hover:bg-accent hover:text-accent-foreground hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
        >
          <ArrowLeft class="w-4 h-4 mr-2" />
          <span>{{ t("common.BUTTON.CANCEL") }}</span>
        </button>
      </div>
    </div>
  </div>
</template>
