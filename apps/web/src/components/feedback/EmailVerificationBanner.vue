<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
import { MailWarning, X } from 'lucide-vue-next'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink } from 'vue-router'

const authStore = useAuthStore()
const { t } = useI18n()

/** Ditutup user pada sesi tampilan ini; reset saat halaman dimuat ulang. */
const dismissed = ref(false)
</script>

<template>
  <Transition name="verify-banner">
    <!--
      Warna mengikuti pola `ConfirmDialog` (tint + teks netral), BUKAN
      `text-warning-foreground` sebagai warna teks: token `--warning-foreground`
      dirancang sebagai teks DI ATAS isian `--warning`, sehingga memakainya di
      atas tint 10% menghasilkan kontras sangat rendah (terutama di mode gelap,
      di mana `--warning` justru lebih terang daripada latarnya).
    -->
    <div
      v-if="authStore.needsEmailVerification && !dismissed"
      class="flex items-center gap-3 border-b border-warning/30 bg-warning/10 px-3 py-2.5 sm:px-5"
      role="status"
      aria-live="polite"
    >
      <MailWarning class="size-[1.15rem] shrink-0 text-warning" aria-hidden="true" />

      <div class="min-w-0 flex-1">
        <p class="truncate text-sm font-semibold text-foreground">
          {{ t('common.emailVerification.BANNER_TITLE') }}
        </p>
        <!-- Pesan panjang disembunyikan di layar sangat kecil supaya banner
             tidak mendorong header turun terlalu jauh. -->
        <p class="hidden truncate text-xs text-muted-foreground sm:block">
          {{ t('common.emailVerification.BANNER_MESSAGE') }}
        </p>
      </div>

      <!-- Pasangan `bg-warning` + `text-warning-foreground` memang benar:
           keduanya memang dirancang untuk tombol berisi (light: 0.75/0.28,
           dark: 0.80/0.20 — kontras tinggi di kedua mode). -->
      <RouterLink
        to="/verify-email"
        class="shrink-0 rounded-lg bg-warning px-3 py-1.5 text-xs font-semibold text-warning-foreground shadow-sm transition-colors hover:bg-warning/90"
      >
        {{ t('common.emailVerification.BANNER_ACTION') }}
      </RouterLink>

      <button
        type="button"
        class="shrink-0 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        :aria-label="t('common.emailVerification.BANNER_DISMISS')"
        :title="t('common.emailVerification.BANNER_DISMISSED_LATER')"
        @click="dismissed = true"
      >
        <X class="size-4" aria-hidden="true" />
      </button>
    </div>
  </Transition>
</template>

<style scoped>
.verify-banner-enter-active,
.verify-banner-leave-active {
  transition:
    opacity 180ms ease,
    transform 220ms cubic-bezier(0.16, 1, 0.3, 1);
}

.verify-banner-enter-from,
.verify-banner-leave-to {
  opacity: 0;
  transform: translateY(-100%);
}

@media (prefers-reduced-motion: reduce) {
  .verify-banner-enter-active,
  .verify-banner-leave-active {
    transition-duration: 0.01ms;
  }

  .verify-banner-enter-from,
  .verify-banner-leave-to {
    transform: none;
  }
}
</style>
