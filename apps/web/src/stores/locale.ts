import { i18n, isSupported, setDocumentLocale, type SupportedLocale } from '@/i18n'
import { defineStore } from 'pinia'

const LOCALE_STORAGE_KEY = 'finwall:locale'

export type { SupportedLocale }

export const useLocaleStore = defineStore('locale', {
  state: () => ({
    locale: i18n.global.locale.value as SupportedLocale,
  }),

  actions: {
    /** Sinkronkan store dengan locale i18n yang sudah aktif sejak modul dimuat. */
    init() {
      this.locale = i18n.global.locale.value as SupportedLocale
      setDocumentLocale(this.locale)
    },

    setLocale(newLocale: SupportedLocale) {
      if (!isSupported(newLocale)) return

      i18n.global.locale.value = newLocale
      this.locale = newLocale

      try {
        localStorage.setItem(LOCALE_STORAGE_KEY, newLocale)
      } catch {
        // Preferensi tidak tersimpan bila storage diblokir; bukan error fatal.
      }

      setDocumentLocale(newLocale)
    },
  },
})
