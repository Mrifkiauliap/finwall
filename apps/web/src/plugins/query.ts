import { queryClient } from '@/lib/query'
import { VueQueryPlugin } from '@tanstack/vue-query'
import type { App } from 'vue'

/**
 * Pasang TanStack Query ke aplikasi.
 *
 * Dipisah dari `main.ts` supaya urutan plugin (Pinia -> Query -> i18n -> Router)
 * terlihat jelas dan mudah diuji.
 */
export function installQuery(app: App): void {
  app.use(VueQueryPlugin, { queryClient })
}

/** Bersihkan cache query — panggil saat logout agar data tenant tidak tertinggal. */
export function resetQueryCache(): void {
  queryClient.clear()
}
