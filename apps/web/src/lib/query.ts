import { QueryClient } from '@tanstack/vue-query'

/**
 * Klien TanStack Query tunggal untuk seluruh aplikasi.
 *
 * Default dipilih untuk aplikasi finansial:
 * - `staleTime` cukup panjang karena data keuangan tidak berubah tiap detik,
 *   sehingga berpindah halaman tidak memicu request berulang.
 * - `refetchOnWindowFocus` dimatikan agar tabel tidak "berkedip" saat pengguna
 *   kembali dari tab lain.
 * - `retry: 1` memberi satu percobaan ulang tanpa menahan UI terlalu lama.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 5 * 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
})

/**
 * Factory query key.
 *
 * Semua key tenant-scoped selalu menyertakan `tenantPublicId` supaya cache
 * workspace tidak pernah tercampur saat pengguna berpindah workspace.
 */
export const queryKeys = {
  accounts: (tenantPublicId: string) => ['accounts', tenantPublicId] as const,
  transactions: (tenantPublicId: string) => ['transactions', tenantPublicId] as const,
  dashboard: (tenantPublicId: string) => ['dashboard', tenantPublicId] as const,
}

/** Bersihkan seluruh cache (mis. setelah logout atau ganti workspace). */
export function clearQueryCache(): void {
  queryClient.clear()
}
