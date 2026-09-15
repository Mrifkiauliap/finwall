<!-- app/components/feedback/PageLoadingOverlay.vue -->
<!-- Overlay loading global dengan dua mode:
     - `bootLoading` (inisialisasi data: fetchMe / resolve tenant) -> splash
       bermerek, sama seperti halaman root.
     - `uiLoading` (aksi manual: switch workspace, muat ulang daftar tenant) ->
       kartu spinner dengan progress bar. -->
<script setup lang="ts">
import SplashLoading from "@/components/feedback/SplashLoading.vue";
import { usePageLoading } from "@/composables/usePageLoading";
import { Loader2 } from "lucide-vue-next";

const { bootLoading, uiLoading, loadingMessage } = usePageLoading();
const { t } = useI18n();
</script>

<template>
  <Transition name="page-loader-fade">
    <!-- Dibungkus container `fixed` supaya kelas posisi tidak bertabrakan
         dengan `relative` bawaan SplashLoading (tanpa cn/tailwind-merge,
         urutan menang bisa tak terduga). -->
    <div v-if="bootLoading" class="fixed inset-0 z-[99999]">
      <SplashLoading
        class="size-full"
        :description="loadingMessage || $t('loading.DESCRIPTION')"
      />
    </div>
  </Transition>

  <Transition name="page-loader-fade">
    <div
      v-if="uiLoading"
      class="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-background/80 backdrop-blur-md transition-all duration-300 select-none"
    >
      <!-- Glowing Background Element -->
      <div
        class="pointer-events-none absolute inset-0 flex items-center justify-center"
      >
        <div
          class="h-72 w-72 rounded-full bg-primary/15 blur-3xl animate-pulse"
        />
      </div>

      <!-- Card Container -->
      <div
        class="relative flex flex-col items-center gap-5 p-8 rounded-2xl bg-card/90 border border-border/80 shadow-2xl backdrop-blur-xl text-center max-w-sm w-full mx-4"
      >
        <!-- Icon Spinner Badge -->
        <div class="relative flex items-center justify-center">
          <div class="absolute inset-0 rounded-2xl bg-primary/20 blur-md" />
          <div
            class="relative flex items-center justify-center size-16 rounded-2xl bg-primary/10 border border-primary/20 text-primary"
          >
            <Loader2 class="size-8 animate-spin text-primary" />
          </div>
        </div>

        <!-- Text Description -->
        <div class="space-y-1.5">
          <h3 class="text-base font-semibold tracking-tight text-foreground">
            {{ loadingMessage || t("common.MESSAGE.PROCESSING") }}
          </h3>
          <p class="text-xs text-muted-foreground leading-relaxed">
            {{ t("workspace.PLEASE_WAIT") }}
          </p>
        </div>

        <!-- Progress bar pulse -->
        <div
          class="w-full bg-muted/60 h-1.5 rounded-full overflow-hidden relative mt-1"
        >
          <div class="h-full bg-primary rounded-full animate-indeterminate" />
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.page-loader-fade-enter-active,
.page-loader-fade-leave-active {
  transition:
    opacity 0.3s ease,
    transform 0.3s ease;
}

.page-loader-fade-enter-from,
.page-loader-fade-leave-to {
  opacity: 0;
  transform: scale(0.98);
}

@keyframes indeterminate {
  0% {
    width: 0%;
    margin-left: 0%;
  }
  50% {
    width: 70%;
    margin-left: 15%;
  }
  100% {
    width: 0%;
    margin-left: 100%;
  }
}

.animate-indeterminate {
  animation: indeterminate 1.5s infinite ease-in-out;
}
</style>
