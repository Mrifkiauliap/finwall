import { i18n } from '@/i18n'
import type { ApiErrorList } from '@finwall/shared'

/**
 * Terjemahkan error backend menjadi pesan siap tampil.
 *
 * Backend menormalkan `ZodError` menjadi `{ errors: [{ path, code }] }` di dalam
 * body BadRequestException; `code` adalah application code (mis.
 * `PASSWORD_MIN_LENGTH`) yang dipetakan ke i18n `validation.*` di sini.
 *
 * Komposabel ini memakai `i18n.global` (bukan `useI18n()`) supaya tetap bisa
 * dipanggil dari luar `setup()` — mis. di dalam store Pinia.
 */
export function useApiError() {
  const t = i18n.global.t

  function translateCode(code: string): string {
    const key = `validation.${code}`
    const translated = t(key)
    // `t()` mengembalikan key itu sendiri bila tidak ada terjemahannya.
    return translated === key ? code : translated
  }

  function resolve(err: unknown): string {
    const anyErr = err as {
      response?: { data?: { errors?: ApiErrorList; message?: string } }
      message?: string
    }

    const errors = anyErr?.response?.data?.errors
    if (Array.isArray(errors) && errors.length > 0) {
      return errors.map((e) => translateCode(e.code)).join(', ')
    }

    return anyErr?.response?.data?.message || anyErr?.message || t('notification.TITLE.ERROR')
  }

  return { resolve, translateCode }
}
