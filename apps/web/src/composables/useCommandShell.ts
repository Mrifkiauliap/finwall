import { ref } from 'vue'

/**
 * State Command Shell (singleton per aplikasi).
 *
 * Dibuka lewat pintasan `master + K` (lihat `config/shortcuts.ts`) atau tombol
 * cari di `AppHeader`. Karena singleton, `CommandShell.vue` cukup dipasang
 * sekali di `App.vue` dan bagian lain aplikasi cukup memanggil `open()`.
 */

const isOpen = ref(false)
const query = ref('')

/** Buka palet; selalu mulai dari query kosong agar hasil tidak "basi". */
function open() {
  query.value = ''
  isOpen.value = true
}

function close() {
  isOpen.value = false
  query.value = ''
}

function toggle() {
  if (isOpen.value) close()
  else open()
}

export function useCommandShell() {
  return { isOpen, query, open, close, toggle }
}
