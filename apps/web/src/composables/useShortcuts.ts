import {
  CHORD_TIMEOUT_MS,
  getShortcutMaster,
  type MasterModifier,
  type ShortcutChord,
} from '@/lib/shortcuts'
import { onBeforeUnmount, onMounted, ref } from 'vue'

/**
 * Pemasangan listener untuk pintasan global "master + key".
 *
 * Setiap aksi didaftarkan sebagai pasangan **master** (modifier) + **key** (satu
 * tombol) dan bisa dipicu dua cara:
 *
 *   1. Kombinasi : master dipegang lalu tombol kedua ditekan (`Ctrl+K`).
 *   2. Berurutan : master ditekan & dilepas, lalu tombol kedua dalam
 *      `CHORD_TIMEOUT_MS` (`Ctrl` … `K`) — pola chord seperti VS Code.
 *
 * Kunci utama agar tidak "bocor" ke pintasan browser:
 * - chord yang terdaftar di-`preventDefault()`, tombol lain dibiarkan lewat,
 * - `Shift` dan gabungan dua modifier ditolak, jadi `Ctrl+Shift+…` tidak
 *   sengaja memakan pintasan lain,
 * - `Meta` (tombol Windows) tidak pernah dijadikan master di Windows/Linux —
 *   lihat catatan di `lib/shortcuts.ts`.
 */

interface ResolvedChord {
  key: string
  /** Master eksplisit; `null` = ikuti master aktif (`getShortcutMaster()`). */
  master: MasterModifier | null
  preventDefault: boolean
  run: () => void
}

export function useShortcuts(chords: ShortcutChord[], enabled?: () => boolean) {
  const isChordPending = ref(false)

  // Master dibaca saat pencocokan (bukan saat setup) supaya mengubah master
  // dari UI langsung berlaku tanpa memasang ulang listener.
  const masterOf = (chord: ResolvedChord): MasterModifier => chord.master ?? getShortcutMaster()

  const resolved: ResolvedChord[] = chords.map((chord) => ({
    key: chord.key.toLowerCase(),
    master: chord.master ?? null,
    preventDefault: chord.preventDefault ?? true,
    run: chord.run,
  }))

  let timer: ReturnType<typeof setTimeout> | undefined

  function clearTimer() {
    if (timer !== undefined) {
      clearTimeout(timer)
      timer = undefined
    }
  }

  function cancelChord() {
    clearTimer()
    isChordPending.value = false
  }

  function startChord() {
    clearTimer()
    isChordPending.value = true
    timer = setTimeout(() => {
      isChordPending.value = false
      timer = undefined
    }, CHORD_TIMEOUT_MS)
  }

  /**
   * Master yang dipegang pada event ini. `null` bila tidak ada, ada lebih dari
   * satu (mis. `Ctrl+Alt` = AltGr), atau `Shift` ikut ditekan.
   */
  function heldMaster(event: KeyboardEvent): MasterModifier | null {
    if (event.shiftKey) return null

    const held: MasterModifier[] = []
    if (event.metaKey) held.push('meta')
    if (event.ctrlKey) held.push('ctrl')
    if (event.altKey) held.push('alt')

    return held.length === 1 ? held[0]! : null
  }

  /** Master yang ditekan sendirian (tanpa tombol lain) — awal sebuah chord. */
  function pressedMasterAlone(event: KeyboardEvent): MasterModifier | null {
    if (event.shiftKey) return null
    if (event.key === 'Control' && event.ctrlKey) return 'ctrl'
    if (event.key === 'Meta' && event.metaKey) return 'meta'
    if (event.key === 'Alt' && event.altKey) return 'alt'
    return null
  }

  function execute(chord: ResolvedChord, event: KeyboardEvent) {
    if (chord.preventDefault) event.preventDefault()
    cancelChord()
    chord.run()
  }

  function onKeydown(event: KeyboardEvent) {
    // Abaikan komposisi IME dan auto-repeat (menahan tombol).
    if (event.isComposing || event.key === 'Dead' || event.repeat) return

    // Pintasan hanya aktif bila kondisi `enabled` terpenuhi (mis. sudah login).
    if (enabled && !enabled()) return

    const key = event.key.toLowerCase()

    if (key === 'escape') {
      cancelChord()
      return
    }

    // 1) Kombinasi langsung: master dipegang + tombol kedua.
    const master = heldMaster(event)
    if (master) {
      const combo = resolved.find((chord) => masterOf(chord) === master && chord.key === key)
      if (combo) {
        execute(combo, event)
        return
      }
    }

    // 2) Master ditekan sendirian -> masuk mode chord (menunggu tombol kedua).
    const alone = pressedMasterAlone(event)
    if (alone) {
      if (resolved.some((chord) => masterOf(chord) === alone)) startChord()
      return
    }

    // 3) Tombol kedua setelah master dilepas.
    if (isChordPending.value) {
      const chord = resolved.find((candidate) => candidate.key === key)
      if (chord) execute(chord, event)
      else cancelChord()
    }
  }

  /** Kehilangan fokus = master dianggap dilepas; jangan biarkan chord menggantung. */
  function onBlur() {
    cancelChord()
  }

  onMounted(() => {
    document.addEventListener('keydown', onKeydown)
    window.addEventListener('blur', onBlur)
  })

  onBeforeUnmount(() => {
    document.removeEventListener('keydown', onKeydown)
    window.removeEventListener('blur', onBlur)
    clearTimer()
  })

  return { isChordPending, chords: resolved }
}
