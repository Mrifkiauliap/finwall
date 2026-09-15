import { useCommandShell } from '@/composables/useCommandShell'
import { useNotification } from '@/composables/useNotification'
import { useSidebar } from '@/composables/useSidebar'
import { i18n } from '@/i18n'
import {
  cycleShortcutMaster,
  masterLabel,
  type MasterModifier,
  type ShortcutChord,
} from '@/lib/shortcuts'
import router from '@/router'
import { useThemeStore } from '@/stores/theme'

/**
 * Daftar pintasan global aplikasi (master + key).
 *
 * Ditulis sebagai data — bukan kode tersebar di komponen — supaya:
 * - konflik key gampang dilihat (satu daftar, satu master),
 * - daftar yang sama bisa dipakai untuk menampilkan petunjuk di UI,
 * - handler global dipasang sekali di `App.vue` lewat `useShortcuts`.
 *
 * Master default: `Ctrl` (Windows/Linux) / `⌘` (macOS). Kombinasi `Win + huruf`
 * tidak dipakai di Windows karena ditangkap sistem operasi — lihat
 * `lib/shortcuts.ts`.
 */

/** Bangun path tenant-scoped memakai tenant dari URL saat ini. */
export function tenantPath(path: string): string {
  const raw = router.currentRoute.value.params.tenantPublicId
  const publicId = Array.isArray(raw) ? raw[0] : raw
  if (typeof publicId === 'string' && publicId.length > 0) return `/t/${publicId}${path}`
  return path
}

function go(path: string) {
  void router.push(path)
}

/**
 * Ganti master pintasan ke pilihan berikutnya yang tersedia di platform ini.
 *
 * `Win` (Meta) hanya muncul di macOS; di Windows/Linux sistem operasi yang
 * menangkap `Win + huruf` sehingga halaman tidak pernah menerimanya.
 */
export function cycleMaster(): MasterModifier {
  const next = cycleShortcutMaster()
  useNotification().notify({
    type: 'info',
    message: i18n.global.t('common.command.MASTER_CHANGED', { master: masterLabel(next) }),
  })
  return next
}

/**
 * Aksi cepat lewat keyboard. `key` sengaja hanya satu tombol per aksi agar
 * gampang diingat dan tidak bertabrakan dengan pintasan browser bawaan.
 */
export const appShortcuts: ShortcutChord[] = [
  {
    // Master + K: buka/tutup Command Shell. Aksi bawaan browser (fokus kolom
    // pencarian) ditahan supaya palet aplikasi yang muncul.
    key: 'k',
    run: () => useCommandShell().toggle(),
  },
  {
    key: 'b',
    run: () => useSidebar().togglePanel(),
  },
  {
    key: 'd',
    run: () => go(tenantPath('/dashboard')),
  },
  {
    key: 's',
    run: () => go('/settings/profile'),
  },
  {
    key: 'i',
    run: () => useThemeStore().toggle(),
  },
  {
    key: 'o',
    run: () => cycleMaster(),
  },
]
