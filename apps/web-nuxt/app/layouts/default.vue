<script setup lang="ts">
import ConfirmDialog from "@/components/feedback/ConfirmDialog.vue";
import AccountsPanel from "@/components/layout/AccountsPanel.vue";
import AppHeader from "@/components/layout/AppHeader.vue";
import BottomNav from "@/components/layout/BottomNav.vue";
import SidebarRail from "@/components/layout/SidebarRail.vue";
import { useSidebar } from "@/composables/useSidebar";

const { isPanelOpen } = useSidebar();
</script>

<template>
  <div class="flex min-h-dvh bg-background text-foreground">
    <!-- Desktop: rail ikon + panel akun.
         Mobile: tidak ada sidebar — navigasi lewat `BottomNav`. -->
    <SidebarRail />

    <!-- Lebar dianimasikan lewat CSS scoped (bukan kelas arbitrary Tailwind)
         supaya transition-property pasti ter-generate. `data-open` dipakai
         sebagai state untuk CSS, jadi transisinya benar-benar berjalan.
         Wrapper dalam berlebar tetap agar konten tidak "remuk" saat dianimasikan. -->
    <aside
      class="accounts-aside hidden shrink-0 overflow-hidden bg-sidebar/40 lg:block"
      :data-open="isPanelOpen ? 'true' : 'false'"
      :aria-hidden="!isPanelOpen"
      :inert="!isPanelOpen"
    >
      <div class="flex h-dvh w-72 flex-col border-r">
        <AccountsPanel />
      </div>
    </aside>

    <!-- Konten utama -->
    <div class="flex min-w-0 flex-1 flex-col">
      <AppHeader />

      <!-- `pb-20` memberi ruang tab bar mobile agar konten terakhir tidak
           tertutup. Di desktop padding kembali normal. -->
      <main class="flex-1 p-3 pb-20 sm:p-5 lg:pb-6">
        <slot />
      </main>
    </div>

    <!-- Navigasi tab bar (mobile) + sheet akun -->
    <BottomNav />

    <!-- NotificationContainer global ada di app.vue (semua layout). -->
    <ConfirmDialog />
  </div>
</template>

<style scoped>
/* 18rem = w-72 */
.accounts-aside {
  width: 0;
  opacity: 0;
  pointer-events: none;
  transition:
    width 320ms cubic-bezier(0.16, 1, 0.3, 1),
    opacity 240ms ease;
  will-change: width, opacity;
}

.accounts-aside[data-open="true"] {
  width: 18rem;
  opacity: 1;
  pointer-events: auto;
}

/* Transisi isi panel:
   SHOW (data-open=true): bergerak dari kanan ke kiri (translateX(20px) -> translateX(0)).
   HIDE (data-open=false): bergerak dari kiri ke kanan (translateX(0) -> translateX(20px)). */
.accounts-aside > div {
  transition:
    transform 320ms cubic-bezier(0.16, 1, 0.3, 1),
    opacity 240ms ease;
  will-change: transform, opacity;
}

.accounts-aside[data-open="false"] > div {
  transform: translateX(20px);
  opacity: 0;
}

.accounts-aside[data-open="true"] > div {
  transform: translateX(0);
  opacity: 1;
}

@media (prefers-reduced-motion: reduce) {
  .accounts-aside,
  .accounts-aside > div {
    transition: none;
  }
}
</style>
