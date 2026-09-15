import { parseWebEnv, type WebConfig } from '@finwall/config/web'

/**
 * Konfigurasi environment aplikasi web.
 *
 * Sumber kebenaran (skema, default, validasi) ada di `@finwall/config/web`.
 * Vite menyuntikkan seluruh variabel `VITE_*` ke `import.meta.env`, jadi nilai
 * itulah yang diserahkan ke loader milik paket config.
 */
export const config: WebConfig = parseWebEnv(import.meta.env as unknown as Record<string, unknown>)

function stripTrailingSlash(value: string): string {
  return value.endsWith('/') ? value.slice(0, -1) : value
}

/** Basis URL API (tanpa trailing slash). */
export const API_BASE_URL = stripTrailingSlash(config.VITE_API_BASE_URL)

/** Base path aplikasi, dipakai `createWebHistory`. */
export const BASE_URL = config.VITE_BASE_URL

export const IS_DEV = import.meta.env.DEV
export const IS_PROD = import.meta.env.PROD
