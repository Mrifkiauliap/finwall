import { ref } from 'vue'

/**
 * State panel/sheet sidebar (singleton per aplikasi).
 *
 * - `isPanelOpen` : kolom kedua (panel akun) di desktop.
 * - `isMoreOpen`  : sheet "Lainnya" di mobile.
 * - `width`       : lebar panel akun (desktop) yang bisa di-resize.
 *
 * Lebar panel disatukan di sini — bukan composable terpisah — karena ia state
 * dari panel yang sama; memisahkannya hanya menambah file tanpa manfaat.
 */

/** 14rem — lebih sempit dari ini, nama akun & nominal mulai terpotong. */
export const PANEL_MIN_WIDTH = 224

/** 28rem — lebih lebar dari ini, kolom konten jadi terlalu sempit. */
export const PANEL_MAX_WIDTH = 448

/** 18rem — lebar lama (`w-72`), dipakai sebagai nilai awal & saat reset. */
export const PANEL_DEFAULT_WIDTH = 288

/** Perpindahan per tekan tombol panah (px). */
const KEYBOARD_STEP = 16

const STORAGE_KEY = 'finwall:accounts-panel-width'

function clampWidth(value: number): number {
  return Math.min(PANEL_MAX_WIDTH, Math.max(PANEL_MIN_WIDTH, value))
}

function readStoredWidth(): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw !== null) {
      const parsed = Number(raw)
      // Nilai rusak/aneh diabaikan lalu dijepit ke rentang aman.
      if (Number.isFinite(parsed)) return clampWidth(parsed)
    }
  } catch {
    // Storage bisa diblokir (mode privat) — pakai default.
  }
  return PANEL_DEFAULT_WIDTH
}

function persistWidth(value: number): void {
  try {
    localStorage.setItem(STORAGE_KEY, String(value))
  } catch {
    // Preferensi tidak tersimpan bila storage diblokir; bukan error fatal.
  }
}

const isPanelOpen = ref(true)
const isMoreOpen = ref(false)
const width = ref(readStoredWidth())

/** `true` selama drag — dipakai untuk mematikan transisi lebar & kursor global. */
const isResizing = ref(false)

/** Posisi & lebar awal saat drag dimulai (acuan hitung delta). */
let startX = 0
let startWidth = PANEL_DEFAULT_WIDTH

function togglePanel() {
  isPanelOpen.value = !isPanelOpen.value
}

function openMore() {
  isMoreOpen.value = true
}

function closeMore() {
  isMoreOpen.value = false
}

// ---------------------------------------------------------------------------
// Resize panel akun (desktop)
// ---------------------------------------------------------------------------

function setPanelWidth(next: number) {
  width.value = clampWidth(next)
}

/** Kembalikan ke lebar default (klik ganda atau tekan Enter pada handle). */
function resetPanelWidth() {
  setPanelWidth(PANEL_DEFAULT_WIDTH)
  persistWidth(width.value)
}

/** Geser lebar sejumlah `delta` px (dipakai tombol panah kiri/kanan). */
function resizePanelBy(delta: number) {
  setPanelWidth(width.value + delta)
  persistWidth(width.value)
}

function onResizeStart(event: PointerEvent) {
  // Hanya tombol utama; mencegah drag tak sengaja dari klik kanan.
  if (event.button !== 0) return

  isResizing.value = true
  startX = event.clientX
  startWidth = width.value

  // Pointer capture membuat gerakan tetap terkirim ke handle walau kursor
  // keluar dari areanya, sehingga drag tidak "lepas" di tengah jalan.
  ;(event.currentTarget as HTMLElement | null)?.setPointerCapture?.(event.pointerId)

  // Cegah seleksi teks selama drag.
  event.preventDefault()
}

function onResizeMove(event: PointerEvent) {
  if (!isResizing.value) return
  setPanelWidth(startWidth + (event.clientX - startX))
}

function onResizeEnd(event: PointerEvent) {
  if (!isResizing.value) return

  isResizing.value = false
  ;(event.currentTarget as HTMLElement | null)?.releasePointerCapture?.(event.pointerId)

  // Persist HANYA saat drag selesai: menulis localStorage tiap `pointermove`
  // memicu puluhan write tanpa manfaat.
  persistWidth(width.value)
}

function onResizeKeydown(event: KeyboardEvent) {
  const step = event.shiftKey ? KEYBOARD_STEP * 4 : KEYBOARD_STEP

  if (event.key === 'ArrowLeft') {
    event.preventDefault()
    resizePanelBy(-step)
    return
  }

  if (event.key === 'ArrowRight') {
    event.preventDefault()
    resizePanelBy(step)
    return
  }

  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    resetPanelWidth()
  }
}

export function useSidebar() {
  return {
    isPanelOpen,
    togglePanel,
    isMoreOpen,
    openMore,
    closeMore,
    // Resize
    panelWidth: width,
    isResizing,
    setPanelWidth,
    resetPanelWidth,
    resizePanelBy,
    onResizeStart,
    onResizeMove,
    onResizeEnd,
    onResizeKeydown,
  }
}
