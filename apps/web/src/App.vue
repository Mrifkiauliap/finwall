<script setup lang="ts">
import CommandShell from '@/components/feedback/CommandShell.vue'
import ConfirmDialog from '@/components/feedback/ConfirmDialog.vue'
import NotificationContainer from '@/components/feedback/NotificationContainer.vue'
import PageLoadingOverlay from '@/components/feedback/PageLoadingOverlay.vue'
import { useShortcuts } from '@/composables/useShortcuts'
import { appShortcuts } from '@/config/shortcuts'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import { computed } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import { useAuthStore } from './stores/auth'

const route = useRoute()
const authStore = useAuthStore()

/**
 * Pintasan global (master + key) dipasang SEKALI di root supaya berlaku di
 * semua halaman — termasuk halaman tanpa `DefaultLayout` (auth, onboarding).
 * Daftar aksinya ada di `config/shortcuts.ts`.
 */

/**
 * Layout dipilih per-route lewat `meta.layout`:
 * - `none` / `settings` : komponen route membawa layoutnya sendiri.
 * - default             : dibungkus `DefaultLayout` (sidebar + header).
 *
 * Hanya SATU `<RouterView>` yang dipakai. Versi sebelumnya memakai `v-if`/
 * `v-else` pada dua `<RouterView>`, sehingga berpindah antar-jenis layout
 * me-remount seluruh view dan memotong transisi halaman.
 */
const useDefaultLayout = computed(
  () => route.meta.layout !== 'none' && route.meta.layout !== 'settings',
)

/**
 * Kunci transisi untuk halaman BERDAUN (di bawah `DefaultLayout`): berpindah
 * halaman memicu transisi, tetapi perubahan tenant di URL (nama route sama)
 * tidak me-remount komponen.
 *
 * Hanya dipakai di cabang itu. Route yang komponennya adalah PEMBUNGKUS
 * layout (mis. `SettingsLayout`) sengaja TIDAK diberi kunci — lihat catatan
 * di template.
 */
const pageKey = computed(() => String(route.name ?? route.path))

/**
 * Pintasan global hanya aktif saat pengguna sudah autentikasi.
 * `enabled` dibaca saat setiap `keydown` — tidak perlu memasang ulang listener
 * saat status auth berubah.
 */
useShortcuts(appShortcuts, () => authStore.isAuthenticated)
</script>

<template>
  <div
    class="flex min-h-screen flex-col bg-background text-foreground transition-colors duration-200"
  >
    <RouterView v-slot="{ Component }">
      <DefaultLayout v-if="useDefaultLayout">
        <Transition name="page" mode="out-in">
          <!-- Halaman berdaun: kunci per route agar transisi antar-halaman
               berjalan tanpa me-remount saat tenant di URL berubah. -->
          <component :is="Component" :key="pageKey" />
        </Transition>
      </DefaultLayout>

      <!--
        Cabang ini memuat route yang komponennya adalah PEMBUNGKUS layout
        (`SettingsLayout`) dan halaman auth.

        `:key` sengaja TIDAK dipasang di sini. Sebelumnya dipakai
        `pageKey` (= `route.name`), dan karena tiap tab pengaturan punya nama
        route sendiri (`settings-profile`, `settings-preferences`, …), setiap
        klik tab me-remount seluruh `SettingsLayout` beserta `<RouterView>`
        bersarangnya. Dengan `mode="out-in"` layout baru lahir kosong saat
        menunggu transisi — hasilnya halaman BLANK sampai ada yang memaksa
        render ulang (mis. refresh).

        Transisi tetap berjalan: `<Transition>` mendeteksi pergantian tipe
        komponen, dan perpindahan antar-tab pengaturan dianimasikan oleh
        `<Transition>` di dalam `SettingsLayout` sendiri.
      -->
      <Transition v-else name="page" mode="out-in">
        <component :is="Component" />
      </Transition>
    </RouterView>

    <!-- Global: harus ada di semua halaman, termasuk yang tanpa layout
         (signin, signup, onboarding) supaya notifikasi tetap tampil. -->
    <NotificationContainer />
    <PageLoadingOverlay />
    <ConfirmDialog />
    <CommandShell />
  </div>
</template>
