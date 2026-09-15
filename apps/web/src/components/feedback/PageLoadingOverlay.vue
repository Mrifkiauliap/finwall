<!-- Overlay loading global dengan dua mode:
     - `bootLoading` (inisialisasi data: fetchMe / resolve tenant) -> splash
       bermerek, sama seperti halaman root.
     - `uiLoading` (aksi manual: switch workspace, muat ulang daftar tenant) ->
       kartu spinner dengan progress bar. -->
<script setup lang="ts">
import SplashLoading from '@/components/feedback/SplashLoading.vue'
import { usePageLoading } from '@/composables/usePageLoading'
import { Loader2 } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'

const { bootLoading, uiLoading, loadingMessage } = usePageLoading()
const { t } = useI18n()
</script>

<template>
  <Transition name="page-loader-fade">
    <div v-if="bootLoading" class="fixed inset-0 z-[99999]">
      <SplashLoading class="size-full" :description="loadingMessage || t('loading.DESCRIPTION')" />
    </div>
  </Transition>

  <Transition name="page-loader-fade">
    <div
      v-if="uiLoading"
      class="fixed inset-0 z-[99999] flex select-none flex-col items-center justify-center bg-background/80 backdrop-blur-md transition-all duration-300"
    >
      <div class="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div class="h-72 w-72 animate-pulse rounded-full bg-primary/15 blur-3xl" />
      </div>

      <div
        class="relative mx-4 flex w-full max-w-sm flex-col items-center gap-5 rounded-2xl border border-border/80 bg-card/90 p-8 text-center shadow-2xl backdrop-blur-xl"
      >
        <div class="relative flex items-center justify-center">
          <div class="absolute inset-0 rounded-2xl bg-primary/20 blur-md" />
          <div
            class="relative flex size-16 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary"
          >
            <Loader2 class="size-8 animate-spin text-primary" />
          </div>
        </div>

        <div class="space-y-1.5">
          <h3 class="text-base font-semibold tracking-tight text-foreground">
            {{ loadingMessage || t('common.MESSAGE.PROCESSING') }}
          </h3>
          <p class="text-xs leading-relaxed text-muted-foreground">
            {{ t('workspace.PLEASE_WAIT') }}
          </p>
        </div>

        <div class="relative mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted/60">
          <div class="animate-indeterminate h-full rounded-full bg-primary" />
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
