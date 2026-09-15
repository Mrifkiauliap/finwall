<script setup lang="ts">
import SettingsNav from "@/components/settings/SettingsNav.vue";
import { useSettingsNav } from "@/composables/useSettingsNav";
import { useTenant } from "@/composables/useTenant";

const { title, subtitle } = useSettingsNav();
const { landingPath } = useTenant();
const { t } = useI18n();

/** Kembali ke konteks sebelumnya (workspace terakhir bila ada). */
function goBack() {
  navigateTo(landingPath());
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === "Escape") {
    e.preventDefault();
    goBack();
  }
}

onMounted(() => document.addEventListener("keydown", onKeydown));
onBeforeUnmount(() => document.removeEventListener("keydown", onKeydown));
</script>

<template>
  <div class="flex min-h-dvh bg-background text-foreground">
    <!-- Navigasi settings (desktop) -->
    <SettingsNav variant="sidebar" @back="goBack" />

    <div class="flex min-w-0 flex-1 flex-col">
      <!-- Tabs (mobile) + tombol kembali -->
      <div class="sticky top-0 z-20 border-b bg-background/95 backdrop-blur">
        <div class="flex items-center gap-2 px-3 pt-3 lg:hidden">
          <button
            type="button"
            class="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            @click="goBack"
          >
            ← {{ t("common.settings.BACK") }}
          </button>
        </div>
        <SettingsNav variant="tabs" />
      </div>

      <main class="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
        <!-- Header halaman (judul mengikuti item aktif) -->
        <div class="mb-6">
          <h1 class="text-xl font-bold tracking-tight sm:text-2xl">
            {{ title }}
          </h1>
          <p class="mt-1 text-sm text-muted-foreground">{{ subtitle }}</p>
        </div>

        <slot />
      </main>
    </div>
  </div>
</template>
