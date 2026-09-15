<script setup lang="ts">
import SettingsNav from '@/components/settings/SettingsNav.vue'
import { useSettingsNav } from '@/composables/useSettingsNav'
import { useTenant } from '@/composables/useTenant'
import { navigate } from '@/lib/navigation'
import { ArrowLeft } from 'lucide-vue-next'
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterView, useRoute } from 'vue-router'

const { t } = useI18n()
const { landingPath } = useTenant()
const { title, subtitle } = useSettingsNav()
const route = useRoute()

/** Elemen yang benar-benar menggulung di layout ini (bukan window). */
const scrollAreaEl = ref<HTMLElement | null>(null)

function goBack() {
  navigate(landingPath())
}

watch(
  () => route.fullPath,
  () => {
    scrollAreaEl.value?.scrollTo({ top: 0 })
  },
)

function onKeydown(e: KeyboardEvent) {
  if (e.key !== 'Escape') return
  // Jangan bajak ESC saat fokus ada di dalam dialog/overlay.
  if (document.querySelector('[role="dialog"],[role="alertdialog"]')) return
  e.preventDefault()
  goBack()
}

onMounted(() => document.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => document.removeEventListener('keydown', onKeydown))
</script>

<template>
  <div class="h-dvh overflow-hidden bg-background text-foreground lg:flex">
    <SettingsNav variant="sidebar" @back="goBack" />

    <div class="flex min-h-0 min-w-0 flex-1 flex-col">
      <header class="border-b bg-background/95 backdrop-blur">
        <div class="flex items-center gap-3 px-4 py-3 sm:px-6">
          <!-- Hanya mobile: di desktop, tombol Back sudah ada di sidebar. -->
          <button
            type="button"
            class="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:hidden"
            @click="goBack"
          >
            <ArrowLeft class="size-4" aria-hidden="true" />
            <span class="sr-only sm:not-sr-only">{{ t('common.settings.BACK') }}</span>
          </button>

          <div class="min-w-0 flex-1">
            <h1 class="truncate text-base font-semibold tracking-tight">
              {{ title }}
            </h1>
            <p class="truncate text-xs text-muted-foreground">{{ subtitle }}</p>
          </div>
        </div>

        <!-- Navigasi mobile: baris ringkas yang membuka bottom sheet. -->
        <SettingsNav variant="picker" @back="goBack" />
      </header>

      <main ref="scrollAreaEl" class="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6 sm:py-8">
        <div class="mx-auto w-full max-w-3xl">
          <RouterView v-slot="{ Component }">
            <Transition name="page" mode="out-in">
              <component :is="Component" />
            </Transition>
          </RouterView>
        </div>
      </main>
    </div>
  </div>
</template>
