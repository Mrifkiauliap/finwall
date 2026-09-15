<script setup lang="ts">
import EmailVerificationBanner from '@/components/feedback/EmailVerificationBanner.vue'
import AccountsPanel from '@/components/layout/AccountsPanel.vue'
import AccountsPanelResizer from '@/components/layout/AccountsPanelResizer.vue'
import AppHeader from '@/components/layout/AppHeader.vue'
import BottomNav from '@/components/layout/BottomNav.vue'
import SidebarRail from '@/components/layout/SidebarRail.vue'
import { useSidebar } from '@/composables/useSidebar'
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

const { isPanelOpen, panelWidth, isResizing } = useSidebar()
const route = useRoute()

/**
 * Lebar panel dikirim sebagai CSS variable, BUKAN `width` langsung.
 *
 * Lebar `<aside>` sepenuhnya diatur CSS (0 saat tertutup ↔ `var(--panel-w)`
 * saat terbuka), jadi buka/tutup tetap dianimasikan dan terasa seperti jendela
 * yang bergeser. Yang berubah karena drag hanyalah nilai variabel ini, yang
 * dipakai konten di dalamnya sebagai lebar TETAP — sehingga konten tidak ikut
 * menyusut/me-reflow selama animasi.
 *
 * Tidak perlu syarat `isPanelOpen`: nilai ini tidak pernah memaksa panel
 * terbuka, karena hanya dipakai saat `[data-open='true']`.
 */
const panelStyle = computed(() => ({ '--panel-w': `${panelWidth.value}px` }))

/**
 * Kelas di `<html>` selama drag: memaksa kursor `col-resize` di seluruh halaman
 * supaya tidak berkedip saat kursor bergerak cepat melewati elemen lain.
 */
watch(isResizing, (active) => {
  document.documentElement.classList.toggle('panel-resizing', active)
})

onBeforeUnmount(() => {
  document.documentElement.classList.remove('panel-resizing')
})

/** Elemen yang benar-benar menggulung (bukan window). */
const scrollAreaEl = ref<HTMLElement | null>(null)

watch(
  () => route.fullPath,
  () => {
    scrollAreaEl.value?.scrollTo({ top: 0 })
  },
)
</script>

<template>
  <div class="relative flex h-dvh overflow-hidden bg-background text-foreground">
    <!-- Desktop: rail ikon. Mobile: navigasi lewat header. -->
    <SidebarRail />

    <!--
      `overflow` diatur di CSS (bukan kelas Tailwind) karena butuh `clip` pada
      sumbu X saja — lihat catatan di blok `<style>`.
    -->
    <aside
      class="accounts-aside relative hidden shrink-0 bg-sidebar/40 lg:block"
      :data-open="isPanelOpen ? 'true' : 'false'"
      :data-resizing="isResizing ? 'true' : 'false'"
      :style="panelStyle"
      :aria-hidden="!isPanelOpen"
      :inert="!isPanelOpen"
    >
      <!--
        Konten berlebar TETAP (`--panel-w`), sengaja TIDAK `w-full`.

        Kalau lebarnya mengikuti `<aside>` yang sedang dianimasikan, konten akan
        ikut menyusut/me-reflow setiap frame — teks membungkus ulang, kolom
        "remuk", dan transisi terlihat seperti panel yang dipadatkan. Dengan
        lebar tetap, yang bergerak hanyalah tepi jendela `<aside>`: konten
        tampak tergeser masuk/keluar, bukan terlipat.
      -->
      <div class="panel-content flex h-full flex-col border-r">
        <AccountsPanel />
      </div>

      <AccountsPanelResizer />
    </aside>
    <div class="flex min-h-0 min-w-0 flex-1 flex-col">
      <AppHeader />
      <EmailVerificationBanner />
      <main ref="scrollAreaEl" class="min-h-0 flex-1 overflow-y-auto p-3 pb-20 sm:p-5 lg:pb-6">
        <slot />
      </main>
    </div>

    <!-- Mobile bottom navigation -->
    <BottomNav />
  </div>
</template>

<style scoped>
.accounts-aside {
  /**
   * Lebar panel. Nilainya ditimpa inline dari state (hasil drag); 18rem
   * (= `w-72`) hanya default sebelum/saat panel tertutup.
   */
  --panel-w: 18rem;

  width: 0;
  pointer-events: none;

  /* Hanya `width` yang dianimasikan — itulah "jendela" yang bergeser. */
  transition: width 320ms cubic-bezier(0.16, 1, 0.3, 1);
  will-change: width;

  /*
    `clip` (bukan `hidden`) di sumbu X saja.

    `overflow: hidden` memaksa sumbu Y ikut terpotong dan membuat elemen ini
    menjadi containing block baru untuk anak `absolute`, sehingga pegangan
    resize yang menonjol keluar tepi panel jadi tidak terlihat. Dengan
    `overflow-x: clip` + `overflow-y: visible`, konten tetap terpotong saat
    panel menyempit tetapi pegangan bisa menonjol keluar.
  */
  overflow-x: clip;
  overflow-y: visible;
}

.accounts-aside[data-open='true'] {
  width: var(--panel-w);
  pointer-events: auto;
}

/* Saat drag, transisi dimatikan supaya lebar mengikuti kursor secara langsung
   (1:1) — kalau tetap dianimasikan, panel terasa "tertinggal" dan bergetar. */
.accounts-aside[data-resizing='true'] {
  transition: none;
}

/*
  Konten berlebar TETAP: tidak pernah ikut menyusut saat panel dianimasikan.
  `animation-fill-mode: both` + keyframe transform memberi kesan konten
  "tergeser masuk" dari kiri, bukan muncul mendadak.
*/
.panel-content {
  width: var(--panel-w);
  animation: panel-content-in 320ms cubic-bezier(0.16, 1, 0.3, 1) both;
}

@keyframes panel-content-in {
  from {
    opacity: 0;
    transform: translateX(-12px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .accounts-aside {
    transition: none;
  }

  .panel-content {
    animation: none;
  }
}
</style>
