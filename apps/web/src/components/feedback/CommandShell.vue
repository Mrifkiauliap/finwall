<!--
  Command Shell — palet perintah global.

  Dibuka lewat pintasan `master + K` (lihat `config/shortcuts.ts`) atau tombol
  cari di `AppHeader`. Komponen ini hanya "kulit" dari state singleton
  `useCommandShell`, sehingga bisa dipasang sekali di `App.vue`.

  Interaksi: ketik untuk memfilter, `↑`/`↓` untuk berpindah, `Enter` untuk
  menjalankan, `Esc` untuk menutup.
-->
<script setup lang="ts">
import { useCommandShell } from '@/composables/useCommandShell'
import { useNavigation } from '@/composables/useNavigation'
import { useSidebar } from '@/composables/useSidebar'
import { cycleMaster } from '@/config/shortcuts'
import { formatChord, useShortcutMaster } from '@/lib/shortcuts'
import { useAuthStore } from '@/stores/auth'
import { useThemeStore } from '@/stores/theme'
import {
  BarChart3,
  Building2,
  CircleHelp,
  CreditCard,
  Keyboard,
  LayoutDashboard,
  LogOut,
  Moon,
  PanelLeft,
  Receipt,
  Search,
  Settings,
  Users,
  Wallet,
  type LucideIcon,
} from 'lucide-vue-next'
import { computed, nextTick, onBeforeUnmount, ref, watch, type Component } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

const { isOpen, query, close } = useCommandShell()
const { filteredNavigation } = useNavigation()
const { togglePanel } = useSidebar()
const { label: masterLabel } = useShortcutMaster()
const themeStore = useThemeStore()
const authStore = useAuthStore()
const { t } = useI18n()
const router = useRouter()

/** Peta nama ikon navigasi -> komponen Lucide (mirror `SidebarRail`). */
const navIcons: Record<string, LucideIcon> = {
  LayoutDashboard,
  Wallet,
  Receipt,
  BarChart3,
  Users,
  Building2,
  CreditCard,
}

interface CommandEntry {
  id: string
  group: 'navigation' | 'actions'
  label: string
  /** Kata kunci tambahan (alias bahasa lain) agar hasil pencarian lebih luas. */
  keywords: string
  icon: Component
  /** Label pintasan yang ditampilkan sebagai badge, mis. `Ctrl K`. */
  shortcut?: string
  run: () => void
}

const commands = computed<CommandEntry[]>(() => {
  const navigation = filteredNavigation.value.flatMap((group) =>
    group.items.map<CommandEntry>((item) => ({
      id: `nav:${item.basePath}`,
      group: 'navigation',
      label: item.name,
      keywords: `${item.basePath} ${item.icon ?? ''}`,
      icon: navIcons[item.icon ?? ''] ?? Search,
      run: () => void router.push(item.path),
    })),
  )

  const actions: CommandEntry[] = [
    {
      id: 'action:toggle-theme',
      group: 'actions',
      label: t('common.command.ACTION.TOGGLE_THEME'),
      keywords: t('common.command.ACTION.TOGGLE_THEME_KEYWORDS'),
      icon: Moon,
      shortcut: formatChord('i'),
      run: () => themeStore.toggle(),
    },
    {
      id: 'action:toggle-panel',
      group: 'actions',
      label: t('common.command.ACTION.TOGGLE_PANEL'),
      keywords: t('common.command.ACTION.TOGGLE_PANEL_KEYWORDS'),
      icon: PanelLeft,
      shortcut: formatChord('b'),
      run: () => togglePanel(),
    },
    {
      id: 'action:cycle-master',
      group: 'actions',
      // `.value` WAJIB: melewatkan `ComputedRef` ke i18n bikin interpolasi
      // mencoba men-serialisasi objek reaktif (error "cyclic object value").
      label: t('common.command.ACTION.CHANGE_MASTER', { master: masterLabel.value }),
      keywords: t('common.command.ACTION.CHANGE_MASTER_KEYWORDS'),
      icon: Keyboard,
      shortcut: formatChord('o'),
      run: () => cycleMaster(),
    },
    {
      id: 'action:settings',
      group: 'actions',
      label: t('common.command.ACTION.SETTINGS'),
      keywords: t('common.command.ACTION.SETTINGS_KEYWORDS'),
      icon: Settings,
      shortcut: formatChord('s'),
      run: () => void router.push('/settings/profile'),
    },
    {
      id: 'action:help',
      group: 'actions',
      label: t('common.command.ACTION.HELP'),
      keywords: t('common.command.ACTION.HELP_KEYWORDS'),
      icon: CircleHelp,
      run: () => void router.push('/help'),
    },
    {
      id: 'action:sign-out',
      group: 'actions',
      label: t('common.navigation.LOGOUT'),
      keywords: t('common.command.ACTION.SIGN_OUT_KEYWORDS'),
      icon: LogOut,
      run: () => void authStore.logout(),
    },
  ]

  return [...navigation, ...actions]
})

/** Normalisasi teks untuk pencocokan: huruf kecil tanpa diakritik. */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

const filtered = computed<CommandEntry[]>(() => {
  const needle = normalize(query.value.trim())
  if (!needle) return commands.value

  const terms = needle.split(/\s+/)
  return commands.value.filter((command) => {
    const haystack = normalize(`${command.label} ${command.keywords}`)
    return terms.every((term) => haystack.includes(term))
  })
})

/** Hasil dikelompokkan agar daftar panjang tetap terbaca. */
const groups = computed(() => {
  const labels: Record<CommandEntry['group'], string> = {
    navigation: t('common.command.GROUP.NAVIGATION'),
    actions: t('common.command.GROUP.ACTIONS'),
  }

  return (['navigation', 'actions'] as const)
    .map((group) => ({
      key: group,
      label: labels[group],
      items: filtered.value.filter((command) => command.group === group),
    }))
    .filter((group) => group.items.length > 0)
})

const activeIndex = ref(0)

/** Indeks absolut item aktif, mengikuti urutan `filtered`. */
const activeId = computed(() => filtered.value[activeIndex.value]?.id ?? null)

// Reset sorotan setiap hasil berubah supaya Enter selalu menjalankan item atas,
// dan indeks tidak pernah "basi" ketika daftar perintah ikut berubah (tenant /
// role berganti) tanpa perubahan query.
watch([query, filtered], () => {
  activeIndex.value = 0
})

function move(delta: number) {
  const total = filtered.value.length
  if (total === 0) return
  activeIndex.value = (activeIndex.value + delta + total) % total
  scrollActiveIntoView()
}

/** Posisi item di `filtered` berdasarkan `id` (dipakai untuk hover). */
function indexOf(id: string): number {
  return filtered.value.findIndex((command) => command.id === id)
}

function onHover(id: string) {
  const index = indexOf(id)
  if (index >= 0) activeIndex.value = index
}

function select(command: CommandEntry) {
  close()
  command.run()
}

function runActive() {
  const command = filtered.value[activeIndex.value]
  if (command) select(command)
}

const listEl = ref<HTMLElement | null>(null)
const inputEl = ref<HTMLInputElement | null>(null)

function scrollActiveIntoView() {
  void nextTick(() => {
    listEl.value
      ?.querySelector<HTMLElement>('[data-active="true"]')
      ?.scrollIntoView({ block: 'nearest' })
  })
}

/**
 * `Esc` dijaga di level dokumen: fokus bisa berada di luar input (mis. setelah
 * klik daftar) tetapi palet tetap harus bisa ditutup.
 */
function onDocumentKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') close()
}

/**
 * Saat terbuka: pasang listener `Esc`, kunci scroll halaman, fokuskan input
 * (setelah flush render). Saat tertutup: bersihkan semuanya.
 */
watch(isOpen, async (open) => {
  document.documentElement.classList.toggle('overflow-hidden', open)

  if (open) {
    document.addEventListener('keydown', onDocumentKeydown)
    await nextTick()
    inputEl.value?.focus()
    scrollActiveIntoView()
    return
  }

  document.removeEventListener('keydown', onDocumentKeydown)
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', onDocumentKeydown)
  document.documentElement.classList.remove('overflow-hidden')
})
</script>

<template>
  <Teleport to="body">
    <Transition name="command-shell">
      <div
        v-if="isOpen"
        class="fixed inset-0 z-[120] flex items-start justify-center bg-black/50 p-4 backdrop-blur-sm sm:pt-[10vh]"
        role="presentation"
        @click.self="close"
      >
        <div
          class="flex w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-border/80 bg-popover text-popover-foreground shadow-2xl"
          role="dialog"
          aria-modal="true"
          :aria-label="t('common.command.TITLE')"
        >
          <!-- Kolom pencarian -->
          <div class="flex items-center gap-3 border-b border-border/70 px-4 py-3">
            <Search class="size-[1.15rem] shrink-0 text-muted-foreground" />

            <input
              ref="inputEl"
              v-model="query"
              type="text"
              role="combobox"
              aria-controls="command-shell-list"
              aria-autocomplete="list"
              :aria-expanded="filtered.length > 0"
              :placeholder="t('common.command.PLACEHOLDER')"
              class="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
              autocomplete="off"
              spellcheck="false"
              @keydown.down.prevent="move(1)"
              @keydown.up.prevent="move(-1)"
              @keydown.enter.prevent="runActive"
              @keydown.tab.prevent="move(1)"
            />

            <kbd
              class="hidden shrink-0 rounded-md border border-border/70 bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground sm:block"
            >
              Esc
            </kbd>
          </div>

          <!-- Hasil -->
          <div
            id="command-shell-list"
            ref="listEl"
            class="max-h-[60vh] overflow-y-auto p-1.5"
            role="listbox"
          >
            <template v-if="filtered.length > 0">
              <div v-for="group in groups" :key="group.key">
                <p
                  class="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  {{ group.label }}
                </p>

                <button
                  v-for="command in group.items"
                  :key="command.id"
                  type="button"
                  role="option"
                  :aria-selected="command.id === activeId"
                  :data-active="command.id === activeId ? 'true' : 'false'"
                  class="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors"
                  :class="
                    command.id === activeId
                      ? 'bg-accent text-accent-foreground'
                      : 'text-popover-foreground hover:bg-muted'
                  "
                  @mouseenter="onHover(command.id)"
                  @click="select(command)"
                >
                  <component :is="command.icon" class="size-[1.15rem] shrink-0 opacity-80" />
                  <span class="min-w-0 flex-1 truncate">{{ command.label }}</span>

                  <kbd
                    v-if="command.shortcut"
                    class="shrink-0 rounded-md border border-border/70 bg-background/60 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground"
                  >
                    {{ command.shortcut }}
                  </kbd>
                </button>
              </div>
            </template>

            <div v-else class="px-3 py-10 text-center">
              <p class="text-sm font-medium text-foreground">{{ t('common.command.EMPTY') }}</p>
              <p class="mt-1 text-xs text-muted-foreground">
                {{ t('common.command.EMPTY_HINT') }}
              </p>
            </div>
          </div>

          <!-- Petunjuk -->
          <div
            class="flex items-center gap-4 border-t border-border/70 px-4 py-2.5 text-[10px] text-muted-foreground"
          >
            <span class="flex items-center gap-1">
              <kbd class="rounded border border-border/70 bg-muted px-1 py-0.5">↑</kbd>
              <kbd class="rounded border border-border/70 bg-muted px-1 py-0.5">↓</kbd>
              {{ t('common.command.HINT.NAVIGATE') }}
            </span>
            <span class="flex items-center gap-1">
              <kbd class="rounded border border-border/70 bg-muted px-1.5 py-0.5">Enter</kbd>
              {{ t('common.command.HINT.SELECT') }}
            </span>
            <span class="ml-auto hidden items-center gap-1 sm:flex">
              <kbd class="rounded border border-border/70 bg-muted px-1.5 py-0.5">
                {{ masterLabel }}
              </kbd>
              {{ t('common.command.HINT.MASTER') }}
            </span>
            <span class="flex items-center gap-1">
              <kbd class="rounded border border-border/70 bg-muted px-1.5 py-0.5">Esc</kbd>
              {{ t('common.command.HINT.CLOSE') }}
            </span>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.command-shell-enter-active,
.command-shell-leave-active {
  transition: opacity 0.15s ease;
}

.command-shell-enter-from,
.command-shell-leave-to {
  opacity: 0;
}

.command-shell-enter-active > div,
.command-shell-leave-active > div {
  transition:
    transform 0.2s cubic-bezier(0.16, 1, 0.3, 1),
    opacity 0.15s ease;
}

.command-shell-enter-from > div,
.command-shell-leave-to > div {
  opacity: 0;
  transform: scale(0.97) translateY(-8px);
}

@media (prefers-reduced-motion: reduce) {
  .command-shell-enter-active,
  .command-shell-leave-active,
  .command-shell-enter-active > div,
  .command-shell-leave-active > div {
    transition-duration: 0.01ms;
  }
}
</style>
