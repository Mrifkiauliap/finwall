<!--
  Navigasi halaman Pengaturan Akun.

  Dua presentasi dari satu sumber data (`settingsNavConfig`):

  - `sidebar` (desktop): kolom kiri, nama + deskripsi, tombol Back, tombol keluar.
  - `picker`  (mobile):  satu baris ringkas "halaman aktif" yang membuka bottom
    sheet berisi daftar lengkap bergrup.

  Kenapa bukan strip tab horizontal di mobile: dengan 9 halaman, strip harus
  digeser jauh, TIDAK ada penanda masih ada item di kanan, pengelompokan
  (Umum / Notifikasi / Lainnya) hilang, dan tombol keluar tidak punya tempat.
  Sheet menampilkan semuanya sekaligus tanpa menggeser apa pun.

  Halaman yang belum jadi memakai `PlaceholderView`, jadi menambah item di
  config tidak pernah menghasilkan tautan mati.
-->
<script setup lang="ts">
import { useSettingsNav, type SettingsIconName } from '@/composables/useSettingsNav'
import { useAuthStore } from '@/stores/auth'
import {
  Bell,
  BookOpen,
  Check,
  ChevronDown,
  ChevronLeft,
  FileText,
  LogOut,
  Mail,
  MessageCircle,
  ShieldCheck,
  SlidersHorizontal,
  Sun,
  User,
  X,
  type LucideIcon,
} from 'lucide-vue-next'
import { onBeforeUnmount, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink, useRoute } from 'vue-router'

const props = withDefaults(defineProps<{ variant?: 'sidebar' | 'picker' }>(), {
  variant: 'sidebar',
})

const { groups, isActive, currentItem } = useSettingsNav()
const { t } = useI18n()
const authStore = useAuthStore()
const route = useRoute()

const emit = defineEmits<{ back: [] }>()

/**
 * Peta nama ikon -> komponen Lucide.
 *
 * `Record<SettingsIconName, …>` sengaja LENGKAP: menambah nama di
 * `SETTINGS_ICON_NAMES` tanpa menambah petanya akan gagal type-check, sehingga
 * ikon tidak pernah diam-diam gagal ter-render (versi sebelumnya kehilangan
 * `Sun` karena itu).
 */
const icons: Record<SettingsIconName, LucideIcon> = {
  User,
  SlidersHorizontal,
  Sun,
  ShieldCheck,
  Mail,
  Bell,
  MessageCircle,
  BookOpen,
  FileText,
}

// ---------------------------------------------------------------------------
// Bottom sheet (mobile)
// ---------------------------------------------------------------------------

const sheetOpen = ref(false)

function openSheet() {
  sheetOpen.value = true
}

function closeSheet() {
  sheetOpen.value = false
}

/** Tutup sheet setiap kali pindah halaman. */
watch(() => route.fullPath, closeSheet)

/**
 * `Esc` menutup sheet lebih dulu.
 *
 * Dipasang di fase CAPTURE dan tidak menghentikan propagasi: `SettingsLayout`
 * punya handler `Esc` sendiri untuk kembali ke aplikasi, tetapi ia sudah
 * melewati kasus ini karena mendeteksi adanya `[role="dialog"]`. Jadi cukup
 * menutup sheet di sini, dan `Esc` berikutnya (setelah sheet tertutup) yang
 * akan keluar dari pengaturan.
 */
function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && sheetOpen.value) closeSheet()
}

watch(sheetOpen, (open) => {
  if (open) document.addEventListener('keydown', onKeydown, true)
  else document.removeEventListener('keydown', onKeydown, true)
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKeydown, true)
})
</script>

<template>
  <!-- ===================== Sidebar (desktop) ===================== -->
  <aside
    v-if="props.variant === 'sidebar'"
    class="hidden w-64 shrink-0 flex-col border-r bg-sidebar/40 lg:flex"
  >
    <!-- Back + hint ESC. Tidak ikut menggulung agar selalu terjangkau. -->
    <div class="flex shrink-0 items-center justify-between gap-2 px-3 py-3">
      <button
        type="button"
        class="group flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        @click="emit('back')"
      >
        <ChevronLeft
          class="size-4 transition-transform duration-200 group-hover:-translate-x-0.5"
          aria-hidden="true"
        />
        {{ t('common.settings.BACK') }}
      </button>

      <kbd
        class="hidden rounded border bg-background px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground xl:inline-block"
      >
        ESC
      </kbd>
    </div>

    <!-- Daftar grup. `min-h-0` + `overflow-y-auto` membuatnya menggulung
         sendiri ketika 9 item tidak muat, tanpa menggeser tombol Back/keluar. -->
    <nav
      class="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-3 pb-3"
      :aria-label="t('common.settings.TITLE')"
    >
      <div
        v-for="(group, gIdx) in groups"
        :key="group.groupName ?? gIdx"
        class="flex flex-col gap-1"
      >
        <h2
          v-if="group.groupName"
          class="px-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70"
        >
          {{ group.groupName }}
        </h2>

        <RouterLink
          v-for="item in group.items"
          :key="item.path"
          :to="item.path"
          class="group relative flex items-start gap-3 rounded-xl px-2.5 py-2 transition-colors duration-200"
          :class="
            isActive(item.path)
              ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-sm'
              : 'text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground'
          "
          :aria-current="isActive(item.path) ? 'page' : undefined"
        >
          <!-- Indikator aktif di kiri -->
          <span
            class="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full bg-primary transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
            :class="isActive(item.path) ? 'scale-y-100 opacity-100' : 'scale-y-0 opacity-0'"
            aria-hidden="true"
          />

          <!-- Ikon dalam kotak lembut: memberi bobot visual pada item aktif
               tanpa perlu mengubah warna latar seluruh baris. -->
          <span
            class="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg transition-colors duration-200"
            :class="
              isActive(item.path)
                ? 'bg-primary/10 text-primary'
                : 'bg-muted/70 text-muted-foreground group-hover:text-foreground'
            "
          >
            <component :is="icons[item.icon]" class="size-4" aria-hidden="true" />
          </span>

          <!-- Dua baris: nama + deskripsi. Deskripsi yang membedakan tiap
               halaman bagi pengguna baru. -->
          <span class="min-w-0 flex-1">
            <span class="block truncate text-sm font-medium leading-tight">
              {{ item.name }}
            </span>
            <span class="mt-0.5 block truncate text-xs leading-tight text-muted-foreground/80">
              {{ item.description }}
            </span>
          </span>
        </RouterLink>
      </div>
    </nav>

    <!-- Keluar: dipisah dari daftar navigasi (bukan halaman pengaturan, dan
         tindakannya berbeda) serta diberi warna `destructive` agar tidak
         terklik tak sengaja karena mirip item lain. -->
    <div class="shrink-0 border-t p-3">
      <button
        type="button"
        class="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        @click="authStore.logout()"
      >
        <span
          class="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted/70"
          aria-hidden="true"
        >
          <LogOut class="size-4" />
        </span>
        {{ t('common.settings.LOGOUT') }}
      </button>
    </div>
  </aside>

  <!-- ===================== Picker (mobile) ===================== -->
  <div v-else class="lg:hidden">
    <!--
      Baris ringkas yang menggantikan strip tab: menunjukkan halaman AKTIF
      (ikon + nama + deskripsi) dan membuka daftar lengkap. Satu baris selalu
      muat di lebar apa pun, jadi tidak ada yang perlu digeser.
    -->
    <button
      type="button"
      class="flex w-full items-center gap-3 border-b px-4 py-2.5 text-left transition-colors active:bg-muted"
      aria-haspopup="dialog"
      :aria-expanded="sheetOpen"
      @click="openSheet"
    >
      <span
        class="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"
      >
        <component :is="icons[currentItem?.icon ?? 'User']" class="size-4" aria-hidden="true" />
      </span>

      <span class="min-w-0 flex-1">
        <span
          class="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70"
        >
          {{ t('common.settings.TITLE') }}
        </span>
        <span class="block truncate text-sm font-medium leading-tight text-foreground">
          {{ currentItem?.name ?? t('common.settings.TITLE') }}
        </span>
      </span>

      <ChevronDown class="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
    </button>

    <!--
      Sheet di-`Teleport` ke `<body>` supaya tidak terpotong oleh `overflow`
      layout pengaturan (root-nya `overflow-hidden`).
    -->
    <Teleport to="body">
      <Transition name="settings-sheet">
        <div
          v-if="sheetOpen"
          class="fixed inset-0 z-50 lg:hidden"
          role="dialog"
          aria-modal="true"
          :aria-label="t('common.settings.TITLE')"
        >
          <div
            class="settings-sheet-overlay absolute inset-0 bg-black/50 backdrop-blur-sm"
            @click="closeSheet"
          />

          <div
            class="settings-sheet-panel absolute inset-x-0 bottom-0 flex max-h-[85vh] flex-col overflow-hidden rounded-t-2xl border-t bg-background shadow-2xl"
          >
            <!-- Judul + tutup. `pt-5` memberi ruang untuk pegangan visual di
                 atas judul (posisinya `absolute` terhadap panel). -->
            <div class="relative flex shrink-0 items-center gap-2 border-b px-4 pb-3 pt-5">
              <span
                class="absolute left-1/2 top-2 h-1 w-10 -translate-x-1/2 rounded-full bg-border"
                aria-hidden="true"
              />
              <h2 class="flex-1 text-sm font-semibold">
                {{ t('common.settings.TITLE') }}
              </h2>
              <button
                type="button"
                class="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                :aria-label="t('common.navigation.CLOSE')"
                @click="closeSheet"
              >
                <X class="size-4" aria-hidden="true" />
              </button>
            </div>

            <!-- Daftar lengkap, bergrup — inilah yang hilang dari versi strip. -->
            <nav
              class="min-h-0 flex-1 overflow-y-auto px-3 py-3"
              :aria-label="t('common.settings.TITLE')"
            >
              <div
                v-for="(group, gIdx) in groups"
                :key="group.groupName ?? gIdx"
                class="mb-4 last:mb-0"
              >
                <h3
                  v-if="group.groupName"
                  class="px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70"
                >
                  {{ group.groupName }}
                </h3>

                <RouterLink
                  v-for="item in group.items"
                  :key="item.path"
                  :to="item.path"
                  class="flex items-center gap-3 rounded-xl px-2.5 py-2.5 transition-colors"
                  :class="
                    isActive(item.path)
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground hover:bg-muted'
                  "
                  :aria-current="isActive(item.path) ? 'page' : undefined"
                  @click="closeSheet"
                >
                  <span
                    class="flex size-8 shrink-0 items-center justify-center rounded-lg"
                    :class="
                      isActive(item.path)
                        ? 'bg-primary/10 text-primary'
                        : 'bg-muted/70 text-muted-foreground'
                    "
                  >
                    <component :is="icons[item.icon]" class="size-4" aria-hidden="true" />
                  </span>

                  <span class="min-w-0 flex-1">
                    <span class="block truncate text-sm font-medium leading-tight">
                      {{ item.name }}
                    </span>
                    <span
                      class="mt-0.5 block truncate text-xs leading-tight text-muted-foreground/80"
                    >
                      {{ item.description }}
                    </span>
                  </span>

                  <Check
                    v-if="isActive(item.path)"
                    class="size-4 shrink-0 text-primary"
                    aria-hidden="true"
                  />
                </RouterLink>
              </div>
            </nav>

            <!-- Keluar. `pb` menambah ruang untuk home indicator iOS. -->
            <div class="shrink-0 border-t p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
              <button
                type="button"
                class="flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
                @click="authStore.logout()"
              >
                <span
                  class="flex size-8 shrink-0 items-center justify-center rounded-lg bg-destructive/10"
                >
                  <LogOut class="size-4" aria-hidden="true" />
                </span>
                {{ t('common.settings.LOGOUT') }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.settings-sheet-enter-active,
.settings-sheet-leave-active {
  transition: opacity 200ms ease;
}

.settings-sheet-enter-from,
.settings-sheet-leave-to {
  opacity: 0;
}

.settings-sheet-enter-active .settings-sheet-panel,
.settings-sheet-leave-active .settings-sheet-panel {
  transition: transform 280ms cubic-bezier(0.16, 1, 0.3, 1);
}

.settings-sheet-enter-from .settings-sheet-panel,
.settings-sheet-leave-to .settings-sheet-panel {
  transform: translateY(100%);
}

@media (prefers-reduced-motion: reduce) {
  .settings-sheet-enter-active,
  .settings-sheet-leave-active,
  .settings-sheet-enter-active .settings-sheet-panel,
  .settings-sheet-leave-active .settings-sheet-panel {
    transition-duration: 0.01ms;
  }

  .settings-sheet-enter-from .settings-sheet-panel,
  .settings-sheet-leave-to .settings-sheet-panel {
    transform: none;
  }
}
</style>
