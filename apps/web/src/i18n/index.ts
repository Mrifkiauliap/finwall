import enAuth from '@/i18n/locales/en/auth'
import enCommon from '@/i18n/locales/en/common'
import enPage from '@/i18n/locales/en/page'
import enValidation from '@/i18n/locales/en/validation'
import idAuth from '@/i18n/locales/id/auth'
import idCommon from '@/i18n/locales/id/common'
import idPage from '@/i18n/locales/id/page'
import idValidation from '@/i18n/locales/id/validation'
import { createI18n } from 'vue-i18n'

export type SupportedLocale = 'id' | 'en'

const SUPPORTED_LOCALES: SupportedLocale[] = ['id', 'en']

/** Flag + nama bahasa, dipakai pemilih bahasa di Pengaturan. */
export const SUPPORTED_LOCALE_META: {
  value: SupportedLocale
  label: string
  flag: string
}[] = [
  { value: 'id', label: 'Bahasa Indonesia', flag: '🇮🇩' },
  { value: 'en', label: 'English', flag: '🇺🇸' },
]

const STORAGE_KEY = 'finwall:locale'

/**
 * Locale file digabung di ROOT (bukan di bawah nama namespace-nya) agar kunci
 * seperti `common.TITLE` dan `auth.SIGNIN_TITLE` dapat ditulis langsung.
 *
 * Setiap file sudah membawa kunci root-nya sendiri (`common`, `auth`, ...),
 * sehingga tidak boleh ada kunci top-level yang sama di dua file — jika ada,
 * penggabungan akan saling menimpa.
 */
export const messages = {
  id: {
    ...idCommon,
    ...idAuth,
    ...idValidation,
    ...idPage,
  },
  en: {
    ...enCommon,
    ...enAuth,
    ...enValidation,
    ...enPage,
  },
}

export function isSupported(value: string): value is SupportedLocale {
  return SUPPORTED_LOCALES.includes(value as SupportedLocale)
}

/**
 * Locale awal: pilihan tersimpan -> bahasa browser -> `id`.
 *
 * Membaca `localStorage` LANGSUNG, bukan lewat store Pinia: modul ini dievaluasi
 * saat impor — sebelum `app.use(pinia)` — sehingga memanggil store di sini akan
 * melempar error "no active Pinia".
 */
function detectLocale(): SupportedLocale {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved && isSupported(saved)) return saved
  } catch {
    // Storage bisa diblokir (mode privat) — lanjut ke deteksi browser.
  }

  if (typeof navigator !== 'undefined') {
    const browserLocale = navigator.language?.slice(0, 2).toLowerCase()
    if (browserLocale && isSupported(browserLocale)) return browserLocale
  }

  return 'id'
}

export const i18n = createI18n({
  legacy: false,
  globalInjection: true,
  locale: detectLocale(),
  fallbackLocale: 'id',
  messages,
})

/** Terapkan locale ke atribut `lang` dokumen. */
export function setDocumentLocale(locale: SupportedLocale): void {
  document.documentElement.lang = locale
}

export { STORAGE_KEY as LOCALE_STORAGE_KEY, SUPPORTED_LOCALES }
