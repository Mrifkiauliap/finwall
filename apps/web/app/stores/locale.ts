import { defineStore } from "pinia";

export type SupportedLocale = "id" | "en";

const STORAGE_KEY = "finwall:locale";
const DEFAULT_LOCALE: SupportedLocale = "id";

export const useLocaleStore = defineStore("locale", {
  state: () => ({
    locale: DEFAULT_LOCALE as SupportedLocale,
  }),

  actions: {
    /** Baca locale tersimpan dari localStorage dan sync ke i18n. */
    init() {
      if (import.meta.server) return;

      const saved = localStorage.getItem(STORAGE_KEY) as SupportedLocale | null;
      if (saved && this._isValid(saved)) {
        this.locale = saved;
      }

      this._syncI18n();
    },

    setLocale(locale: SupportedLocale) {
      this.locale = locale;
      localStorage.setItem(STORAGE_KEY, locale);
      this._syncI18n();
    },

    _isValid(val: string): val is SupportedLocale {
      return ["id", "en"].includes(val);
    },

    _syncI18n() {
      if (import.meta.server) return;
      try {
        // useI18n hanya tersedia di dalam setup; gunakan nuxtApp sebagai fallback
        const nuxtApp = useNuxtApp();
        const i18n = nuxtApp.$i18n as any;
        if (i18n?.setLocale) {
          i18n.setLocale(this.locale);
        }
      } catch {
        // i18n belum siap; akan di-sync saat init() dipanggil ulang
      }
    },
  },
});
