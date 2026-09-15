// stores/locale.ts
import { defineStore } from "pinia";

export type SupportedLocale = "id" | "en";

const SUPPORTED: SupportedLocale[] = ["id", "en"];

export const useLocaleStore = defineStore("locale", {
  state: () => ({
    locale: "id" as SupportedLocale,
  }),

  actions: {
    /** Sync state Pinia dari i18n module (source of truth = cookie i18n). */
    init() {
      const nuxtApp = useNuxtApp();
      const i18n = nuxtApp.$i18n as any;
      this.locale = i18n.locale.value as SupportedLocale;
    },

    async setLocale(newLocale: SupportedLocale) {
      if (!this._isValid(newLocale)) return;

      const nuxtApp = useNuxtApp();
      const i18n = nuxtApp.$i18n as any;
      await i18n.setLocale(newLocale); // aman dipanggil di luar setup

      this.locale = newLocale;

      if (import.meta.client) {
        document.documentElement.lang = newLocale;
      }
    },

    _isValid(val: string): val is SupportedLocale {
      return SUPPORTED.includes(val as SupportedLocale);
    },
  },
});
