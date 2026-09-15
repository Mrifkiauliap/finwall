import type { Router } from 'vue-router'

/**
 * Jembatan navigasi agar store/service dapat memindahkan halaman tanpa
 * mengimpor `router` secara langsung.
 *
 * Mengimpor `@/router` dari store akan membentuk siklus
 * (`router -> store -> router`), jadi router didaftarkan sekali dari
 * `main.ts` lewat `setRouter()`.
 */
let router: Router | null = null

export function setRouter(instance: Router): void {
  router = instance
}

/** Navigasi SPA; no-op bila router belum siap. */
export function navigate(path: string): void {
  void router?.push(path)
}

/** Navigasi SPA dengan query. */
export function navigateWithRedirect(path: string, redirect: string): void {
  void router?.push({ path, query: { redirect } })
}
