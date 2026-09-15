<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
import { useThemeStore } from '@/stores/theme'
import { ChevronDown, CircleHelp, LogOut, Moon, Settings, Sun } from 'lucide-vue-next'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink } from 'vue-router'

const authStore = useAuthStore()
const themeStore = useThemeStore()
const { t } = useI18n()

const isOpen = ref(false)
const rootEl = ref<HTMLElement | null>(null)

function toggleMenu() {
  isOpen.value = !isOpen.value
}

function close() {
  isOpen.value = false
}

function onClickOutside(e: MouseEvent) {
  if (rootEl.value && !rootEl.value.contains(e.target as Node)) close()
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') close()
}

onMounted(() => {
  document.addEventListener('click', onClickOutside)
  document.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', onClickOutside)
  document.removeEventListener('keydown', onKeydown)
})

const isLoggingOut = ref(false)
async function handleLogout() {
  isLoggingOut.value = true
  try {
    await authStore.logout()
  } finally {
    isLoggingOut.value = false
    close()
  }
}

const initial = computed(() =>
  (authStore.user?.username ?? authStore.user?.email ?? '?').charAt(0).toUpperCase(),
)
</script>

<template>
  <div ref="rootEl" class="relative">
    <button
      type="button"
      class="flex items-center gap-2 rounded-lg p-1.5 pr-2 transition-colors hover:bg-muted"
      aria-haspopup="true"
      :aria-expanded="isOpen"
      @click="toggleMenu"
    >
      <img
        v-if="authStore.user?.avatarUrl"
        :src="authStore.user.avatarUrl"
        alt=""
        class="size-8 rounded-full object-cover"
      />
      <div
        v-else
        class="flex size-8 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-primary"
      >
        {{ initial }}
      </div>
      <ChevronDown class="hidden size-4 text-muted-foreground sm:block" />
    </button>

    <Transition name="menu-fade">
      <div
        v-if="isOpen"
        class="absolute right-0 z-50 mt-2 w-72 rounded-xl border bg-popover p-1.5 text-popover-foreground shadow-lg"
        role="menu"
      >
        <div class="flex items-center gap-3 px-3 py-2.5">
          <img
            v-if="authStore.user?.avatarUrl"
            :src="authStore.user.avatarUrl"
            alt=""
            class="size-10 shrink-0 rounded-full object-cover"
          />
          <div
            v-else
            class="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-base font-bold text-primary"
          >
            {{ initial }}
          </div>
          <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-semibold leading-tight">
              {{ authStore.user?.username || t('accountmenu.USER_FALLBACK') }}
            </p>
            <p class="mt-0.5 truncate text-xs text-muted-foreground">
              {{ authStore.user?.email }}
            </p>
          </div>
        </div>

        <div class="my-1 border-t" />

        <button
          type="button"
          class="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          role="menuitem"
          @click="themeStore.toggle()"
        >
          <span class="flex items-center gap-3">
            <Sun v-if="themeStore.isDark" class="size-4 text-muted-foreground" />
            <Moon v-else class="size-4 text-muted-foreground" />

            {{ themeStore.isDark ? t('accountmenu.THEME_DARK') : t('accountmenu.THEME_LIGHT') }}
          </span>

          <span
            class="relative hidden h-5 w-9 shrink-0 rounded-full transition-colors sm:block"
            :class="themeStore.isDark ? 'bg-primary' : 'bg-muted-foreground/30'"
          >
            <span
              class="absolute left-0.5 top-0.5 size-4 rounded-full bg-white shadow transition-transform"
              :class="themeStore.isDark ? 'translate-x-4' : 'translate-x-0'"
            />
          </span>
        </button>

        <RouterLink
          to="/settings/profile"
          class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          role="menuitem"
          @click="close"
        >
          <Settings class="size-4 text-muted-foreground" />
          {{ t('accountmenu.SETTINGS') }}
        </RouterLink>

        <RouterLink
          to="/help"
          class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          role="menuitem"
          @click="close"
        >
          <CircleHelp class="size-4 text-muted-foreground" />
          {{ t('accountmenu.HELP') }}
        </RouterLink>

        <div class="my-1 border-t" />

        <button
          type="button"
          class="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
          :disabled="isLoggingOut"
          role="menuitem"
          @click="handleLogout"
        >
          <LogOut class="size-4" :class="{ 'animate-spin': isLoggingOut }" />
          {{ isLoggingOut ? t('common.navigation.LOGGING_OUT') : t('common.navigation.LOGOUT') }}
        </button>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.menu-fade-enter-active,
.menu-fade-leave-active {
  transition:
    opacity 0.1s ease,
    transform 0.1s ease;
}
.menu-fade-enter-from,
.menu-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
