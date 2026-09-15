<script setup lang="ts">
import SettingsSection from "@/components/settings/SettingsSection.vue";
import { useLocaleStore, type SupportedLocale } from "@/stores/locale";
import { useThemeStore, type Theme } from "@/stores/theme";
import { Check, Laptop, Moon, Sun } from "lucide-vue-next";

definePageMeta({ layout: "settings", middleware: ["auth"] });

const themeStore = useThemeStore();
const localeStore = useLocaleStore();
const { t } = useI18n();

const themeOptions: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Terang", icon: Sun },
  { value: "dark", label: "Gelap", icon: Moon },
  { value: "system", label: "Sistem", icon: Laptop },
];

const languageOptions: {
  value: SupportedLocale;
  flag: string;
  label: string;
  hint: string;
}[] = [
  { value: "id", flag: "🇮🇩", label: "Bahasa Indonesia", hint: "ID" },
  { value: "en", flag: "🇺🇸", label: "English", hint: "EN" },
];
</script>

<template>
  <div class="space-y-5">
    <SettingsSection
      heading="lg"
      :title="t('settings.preferences.THEME_TITLE')"
      :description="t('settings.preferences.THEME_SUBTITLE')"
    >
      <div class="grid grid-cols-3 gap-2.5 sm:max-w-md">
        <button
          v-for="option in themeOptions"
          :key="option.value"
          type="button"
          class="group relative flex flex-col items-center gap-2 rounded-xl border p-3 text-xs font-medium transition-all duration-200"
          :class="
            themeStore.theme === option.value
              ? 'border-primary bg-primary/5 text-foreground shadow-sm'
              : 'border-input text-muted-foreground hover:border-primary/40 hover:bg-muted'
          "
          :aria-pressed="themeStore.theme === option.value"
          @click="themeStore.setTheme(option.value)"
        >
          <Check
            v-if="themeStore.theme === option.value"
            class="absolute right-2 top-2 size-3.5 text-primary"
          />
          <component
            :is="option.icon"
            class="size-5 transition-transform duration-200 group-hover:scale-110"
          />
          {{ option.label }}
        </button>
      </div>
    </SettingsSection>

    <SettingsSection
      :title="t('settings.preferences.LANGUAGE_TITLE')"
      :description="t('settings.preferences.LANGUAGE_SUBTITLE')"
    >
      <div class="flex flex-col gap-2 sm:max-w-md">
        <button
          v-for="option in languageOptions"
          :key="option.value"
          type="button"
          class="flex items-center gap-3 rounded-xl border p-3 text-sm font-medium transition-all duration-200"
          :class="
            localeStore.locale === option.value
              ? 'border-primary bg-primary/5 text-foreground shadow-sm'
              : 'border-input text-muted-foreground hover:border-primary/40 hover:bg-muted'
          "
          :aria-pressed="localeStore.locale === option.value"
          @click="localeStore.setLocale(option.value)"
        >
          <span class="text-lg leading-none" aria-hidden="true">
            {{ option.flag }}
          </span>
          <span class="flex-1 truncate text-left">{{ option.label }}</span>
          <Check
            v-if="localeStore.locale === option.value"
            class="size-4 shrink-0 text-primary"
          />
        </button>
      </div>
    </SettingsSection>
  </div>
</template>
