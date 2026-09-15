<!-- app/components/layout/BottomNav.vue -->
<!-- Navigasi mobile: item utama sebagai tab bar di bawah, sisanya lewat sheet
     "Lainnya". Hanya tampil di bawah breakpoint lg. -->
<script setup lang="ts">
import AccountsPanel from '@/components/layout/AccountsPanel.vue'
import { useSidebar } from '@/composables/useSidebar'
import {
  BarChart3,
  Building2,
  CreditCard,
  LayoutDashboard,
  MoreHorizontal,
  Receipt,
  Users,
  Wallet,
  X,
  type LucideIcon,
} from 'lucide-vue-next'
import { computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink, useRoute } from 'vue-router'

import { useNavigation } from '@/composables/useNavigation'

const { filteredNavigation, isActive } = useNavigation()
const { isMoreOpen, openMore, closeMore } = useSidebar()
const route = useRoute()
const { t } = useI18n()

const icons: Record<string, LucideIcon> = {
  LayoutDashboard,
  Wallet,
  Receipt,
  BarChart3,
  Users,
  Building2,
  CreditCard,
}

/** Maksimal 4 tab; sisanya masuk sheet "Lainnya". */
const MAX_TABS = 4

const allItems = computed(() => filteredNavigation.value.flatMap((g) => g.items))

const primaryItems = computed(() => allItems.value.slice(0, MAX_TABS))
const overflowItems = computed(() => allItems.value.slice(MAX_TABS))
const hasOverflow = computed(() => overflowItems.value.length > 0)

/** Sheet "Lainnya" juga jadi pintu ke halaman akun di mobile. */
const isAccountsRoute = computed(() => route.path.includes('/accounts'))

function toggleMore() {
  if (isMoreOpen.value) closeMore()
  else openMore()
}

// Tutup sheet setiap kali pindah halaman.
watch(
  () => route.fullPath,
  () => closeMore(),
)
</script>

<template>
  <div class="lg:hidden">
    <!-- Sheet "Lainnya": menu sekunder + akun/aset -->
    <Transition name="more-sheet">
      <div v-if="isMoreOpen" class="fixed inset-0 z-40" role="dialog" aria-modal="true">
        <div
          class="more-sheet-overlay absolute inset-0 bg-black/50 backdrop-blur-sm"
          @click="closeMore"
        />

        <div
          class="more-sheet-panel absolute inset-x-0 bottom-0 flex max-h-[85dvh] flex-col overflow-hidden rounded-t-2xl border-t bg-sidebar pb-[env(safe-area-inset-bottom)] shadow-2xl"
        >
          <!-- Header sheet -->
          <div class="flex shrink-0 items-center justify-between border-b px-4 py-3">
            <span
              class="absolute left-1/2 top-2 h-1 w-10 -translate-x-1/2 rounded-full bg-muted-foreground/25"
              aria-hidden="true"
            />
            <p class="text-sm font-semibold">
              {{ t('common.navigation.MORE') }}
            </p>
            <button
              type="button"
              class="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
              :aria-label="t('common.navigation.CLOSE')"
              @click="closeMore"
            >
              <X class="size-4" />
            </button>
          </div>

          <div class="flex min-h-0 flex-1 flex-col overflow-y-auto">
            <!-- Menu yang tidak muat di tab bar -->
            <div v-if="hasOverflow" class="shrink-0 border-b p-2">
              <RouterLink
                v-for="(item, i) in overflowItems"
                :key="item.basePath"
                :to="item.path"
                class="sheet-item flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors"
                :class="
                  isActive(item.basePath)
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                    : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                "
                :style="{ '--item-delay': `${i * 40}ms` }"
                :aria-current="isActive(item.basePath) ? 'page' : undefined"
              >
                <component
                  :is="icons[item.icon ?? '']"
                  v-if="icons[item.icon ?? '']"
                  class="size-[1.15rem] shrink-0"
                />
                {{ item.name }}
              </RouterLink>
            </div>

            <!-- Akun/aset: konten yang sama dengan panel desktop -->
            <AccountsPanel />
          </div>
        </div>
      </div>
    </Transition>

    <!-- Tab bar -->
    <nav
      class="fixed inset-x-0 bottom-0 z-30 border-t bg-background/95 backdrop-blur pb-[env(safe-area-inset-bottom)]"
      :aria-label="t('common.navigation.MENU_MAIN')"
    >
      <div class="flex items-stretch">
        <RouterLink
          v-for="item in primaryItems"
          :key="item.basePath"
          :to="item.path"
          class="tab-item relative flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-colors"
          :class="
            isActive(item.basePath)
              ? 'text-primary'
              : 'text-muted-foreground active:text-foreground'
          "
          :aria-current="isActive(item.basePath) ? 'page' : undefined"
        >
          <!-- Indikator aktif: garis kecil di atas ikon -->
          <span
            class="absolute inset-x-0 top-0 mx-auto h-[2px] w-6 rounded-full bg-primary transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
            :class="isActive(item.basePath) ? 'scale-x-100 opacity-100' : 'scale-x-0 opacity-0'"
            aria-hidden="true"
          />
          <component
            :is="icons[item.icon ?? '']"
            v-if="icons[item.icon ?? '']"
            class="size-[1.25rem] shrink-0 transition-transform duration-200"
            :class="isActive(item.basePath) && 'scale-110'"
          />
          <span class="max-w-full truncate px-1 leading-none">
            {{ item.name }}
          </span>
        </RouterLink>

        <!-- Tab "Lainnya": satu-satunya jalan ke daftar akun di mobile. -->
        <button
          type="button"
          class="relative flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-colors"
          :class="
            isMoreOpen || isAccountsRoute
              ? 'text-primary'
              : 'text-muted-foreground active:text-foreground'
          "
          :aria-expanded="isMoreOpen"
          @click="toggleMore"
        >
          <MoreHorizontal
            class="size-[1.25rem] shrink-0 transition-transform duration-200"
            :class="isMoreOpen && 'scale-110'"
          />
          <span class="max-w-full truncate px-1 leading-none">
            {{ t('common.navigation.MORE') }}
          </span>
        </button>
      </div>
    </nav>
  </div>
</template>

<style scoped>
/* Sheet: overlay fade + panel slide-up */
.more-sheet-enter-active,
.more-sheet-leave-active {
  transition: opacity 220ms ease;
}

.more-sheet-enter-from,
.more-sheet-leave-to {
  opacity: 0;
}

.more-sheet-enter-active .more-sheet-panel,
.more-sheet-leave-active .more-sheet-panel {
  transition: transform 300ms cubic-bezier(0.16, 1, 0.3, 1);
}

.more-sheet-enter-from .more-sheet-panel,
.more-sheet-leave-to .more-sheet-panel {
  transform: translateY(100%);
}

.more-sheet-enter-active .more-sheet-overlay,
.more-sheet-leave-active .more-sheet-overlay {
  transition: opacity 220ms ease;
}

.more-sheet-enter-from .more-sheet-overlay,
.more-sheet-leave-to .more-sheet-overlay {
  opacity: 0;
}

/* Item di dalam sheet muncul bertingkat */
.sheet-item {
  animation: sheet-item-in 320ms cubic-bezier(0.16, 1, 0.3, 1) both;
  animation-delay: var(--item-delay, 0ms);
}

@keyframes sheet-item-in {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .more-sheet-enter-active,
  .more-sheet-leave-active,
  .more-sheet-panel,
  .more-sheet-overlay,
  .sheet-item {
    transition: none;
    animation: none;
  }
}
</style>
