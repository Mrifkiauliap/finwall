import { computed, ref } from 'vue'

/**
 * Inti sistem pintasan "master + key": tipe, deteksi platform, label, dan
 * master yang sedang aktif (tersimpan di localStorage).
 *
 * Mengapa `Meta` (tombol Windows) tidak dipakai di Windows/Linux:
 * kombinasi `Win + <huruf>` ditangkap **sistem operasi** dan diteruskan ke
 * aplikasi OS (Win+I = Settings, Win+S = Search), sehingga halaman web tidak
 * pernah menerima `keydown`-nya. Karena `preventDefault()` tidak mungkin
 * dijalankan, pintasan ini TIDAK disediakan di luar macOS — `Ctrl`/`Alt` yang
 * dipakai sebagai master.
 */

export type MasterModifier = 'ctrl' | 'meta' | 'alt'

export interface ShortcutChord {
  /** Tombol kedua: satu karakter huruf kecil, mis. `'k'`. */
  key: string
  /** Modifier master. Default: master aktif (`getShortcutMaster()`). */
  master?: MasterModifier
  /**
   * Cegah aksi bawaan browser. Default `true`: setiap chord yang TERDAFTAR
   * memang dipesan aplikasi, sedangkan tombol di luar daftar dibiarkan lewat.
   */
  preventDefault?: boolean
  run: () => void
}

/** Jeda maksimal antara master dan tombol kedua saat mode chord. */
export const CHORD_TIMEOUT_MS = 1800

const USER_AGENT = typeof navigator === 'undefined' ? '' : navigator.userAgent

/** Deteksi platform untuk memilih master default + label UI. */
export const IS_APPLE = /mac|iphone|ipad|ipod/i.test(USER_AGENT)

export const DEFAULT_MASTER: MasterModifier = IS_APPLE ? 'meta' : 'ctrl'

/** Master yang masuk akal ditawarkan di platform ini. */
export const AVAILABLE_MASTERS: readonly MasterModifier[] = IS_APPLE
  ? (['meta', 'ctrl', 'alt'] as const)
  : (['ctrl', 'alt'] as const)

const MASTER_LABELS: Record<MasterModifier, string> = IS_APPLE
  ? { meta: '⌘', ctrl: '⌃', alt: '⌥' }
  : { meta: 'Win', ctrl: 'Ctrl', alt: 'Alt' }

/** Label master untuk UI, mis. `Ctrl` atau `⌘`. */
export function masterLabel(master: MasterModifier): string {
  return MASTER_LABELS[master]
}

export function isMasterAvailable(master: MasterModifier): boolean {
  return AVAILABLE_MASTERS.includes(master)
}

const STORAGE_KEY = 'finwall:shortcut-master'

function readStoredMaster(): MasterModifier {
  try {
    const saved = localStorage.getItem(STORAGE_KEY) as MasterModifier | null
    // Master yang tersimpan di perangkat lain (mis. `meta` dari macOS) tidak
    // dipakai bila platform ini tidak mendukungnya.
    if (saved && isMasterAvailable(saved)) return saved
  } catch {
    // Storage bisa diblokir — pakai default platform.
  }
  return DEFAULT_MASTER
}

const master = ref<MasterModifier>(readStoredMaster())

/** Master yang sedang aktif. */
export function getShortcutMaster(): MasterModifier {
  return master.value
}

export function setShortcutMaster(next: MasterModifier): void {
  if (!isMasterAvailable(next)) return
  master.value = next
  try {
    localStorage.setItem(STORAGE_KEY, next)
  } catch {
    // Preferensi tidak tersimpan bila storage diblokir; bukan error fatal.
  }
}

/** Pindah ke master berikutnya yang tersedia; mengembalikan master baru. */
export function cycleShortcutMaster(): MasterModifier {
  const index = AVAILABLE_MASTERS.indexOf(master.value)
  const next = AVAILABLE_MASTERS[(index + 1) % AVAILABLE_MASTERS.length] ?? DEFAULT_MASTER
  setShortcutMaster(next)
  return next
}

/** Label siap-tampil untuk sebuah chord, mis. `formatChord('k')` -> `Ctrl K`. */
export function formatChord(key: string, modifier: MasterModifier = master.value): string {
  return `${masterLabel(modifier)} ${key.toUpperCase()}`
}

/** Dipakai komponen untuk membaca/mengubah master dari UI. */
export function useShortcutMaster() {
  return {
    master,
    label: computed(() => masterLabel(master.value)),
    available: AVAILABLE_MASTERS,
    set: setShortcutMaster,
    cycle: cycleShortcutMaster,
    format: formatChord,
  }
}
