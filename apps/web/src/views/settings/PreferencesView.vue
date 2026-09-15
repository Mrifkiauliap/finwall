<script setup lang="ts">
import { SUPPORTED_LOCALE_META } from '@/i18n'
import { useLocaleStore, type SupportedLocale } from '@/stores/locale'
import { useThemeStore, type Theme } from '@/stores/theme'
import { Check, Monitor, Moon, Sun } from 'lucide-vue-next'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const themeStore = useThemeStore()
const localeStore = useLocaleStore()
const { t } = useI18n()

const localeOptions = computed(() => SUPPORTED_LOCALE_META)

const themeOptions = computed<{ value: Theme; label: string; icon: unknown }[]>(() => [
  { value: 'light', label: t('settings.preferences.THEME_OPTIONS.LIGHT'), icon: Sun },
  { value: 'dark', label: t('settings.preferences.THEME_OPTIONS.DARK'), icon: Moon },
  { value: 'system', label: t('settings.preferences.THEME_OPTIONS.SYSTEM'), icon: Monitor },
])

function selectLocale(value: SupportedLocale) {
  localeStore.setLocale(value)
}
</script>

<template>
  <div class="space-y-6">
    <!-- Tema -->
    <section class="rounded-xl border bg-card p-6 text-card-foreground shadow-elevation-sm">
      <h2 class="text-base font-semibold">{{ t('settings.preferences.THEME_TITLE') }}</h2>
      <p class="mt-1 text-sm text-muted-foreground">
        {{ t('settings.preferences.THEME_SUBTITLE') }}
      </p>

      <div class="mt-4 grid gap-3 sm:grid-cols-3">
        <button
          v-for="option in themeOptions"
          :key="option.value"
          type="button"
          class="flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium transition-colors"
          :class="
            themeStore.theme === option.value
              ? 'border-primary bg-primary/5 text-primary'
              : 'border-input text-foreground hover:bg-muted'
          "
          :aria-pressed="themeStore.theme === option.value"
          @click="themeStore.setTheme(option.value)"
        >
          <component :is="option.icon" class="size-4 shrink-0" />
          <span class="truncate">{{ option.label }}</span>
          <Check v-if="themeStore.theme === option.value" class="ml-auto size-4 shrink-0" />
        </button>
      </div>
    </section>

    <!-- Bahasa -->
    <section class="rounded-xl border bg-card p-6 text-card-foreground shadow-elevation-sm">
      <h2 class="text-base font-semibold">
        {{ t('settings.preferences.LANGUAGE_TITLE') }}
      </h2>
      <p class="mt-1 text-sm text-muted-foreground">
        {{ t('settings.preferences.LANGUAGE_SUBTITLE') }}
      </p>

      <div class="mt-4 grid gap-3 sm:grid-cols-2">
        <button
          v-for="option in localeOptions"
          :key="option.value"
          type="button"
          class="flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium transition-colors"
          :class="
            localeStore.locale === option.value
              ? 'border-primary bg-primary/5 text-primary'
              : 'border-input text-foreground hover:bg-muted'
          "
          :aria-pressed="localeStore.locale === option.value"
          @click="selectLocale(option.value)"
        >
          <span class="truncate">{{ option.flag }} {{ option.label }}</span>
          <Check v-if="localeStore.locale === option.value" class="ml-auto size-4 shrink-0" />
        </button>
      </div>
    </section>
  </div>
</template>
