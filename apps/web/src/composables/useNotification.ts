import { ref } from 'vue'

export type NotificationType = 'info' | 'success' | 'warning' | 'danger'

export interface Notification {
  id: string
  type: NotificationType
  title?: string
  message: string
  duration?: number
  dismissible?: boolean
}

const MAX_NOTIFICATION = 5
const FLASH_KEY = 'finwall:flash-notification'

/** Daftar notifikasi global (singleton). */
const notifications = ref<Notification[]>([])

function notify(notification: Omit<Notification, 'id'>) {
  const id =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `n-${Date.now()}-${Math.random().toString(16).slice(2)}`

  notifications.value.unshift({
    id,
    duration: 5000,
    dismissible: true,
    ...notification,
  })

  if (notifications.value.length > MAX_NOTIFICATION) {
    notifications.value.pop()
  }
}

/** Simpan notif sebelum full navigation, agar terbaca lagi setelah reload. */
function notifyAfterReload(notification: Omit<Notification, 'id'>) {
  try {
    sessionStorage.setItem(FLASH_KEY, JSON.stringify(notification))
  } catch {
    // Storage bisa diblokir (mode privat) — notifikasi bersifat opsional.
  }
}

/** Ambil flash notification yang disimpan sebelum reload (sekali saja). */
function consumeFlashNotification() {
  let raw: string | null = null
  try {
    raw = sessionStorage.getItem(FLASH_KEY)
    if (!raw) return
    sessionStorage.removeItem(FLASH_KEY)
  } catch {
    return
  }

  try {
    notify(JSON.parse(raw) as Omit<Notification, 'id'>)
  } catch {
    // Abaikan payload rusak.
  }
}

function dismiss(id: string) {
  notifications.value = notifications.value.filter((item) => item.id !== id)
}

function clear() {
  notifications.value = []
}

export function useNotification() {
  return {
    notifications,
    notifyAfterReload,
    consumeFlashNotification,
    notify,
    dismiss,
    clear,
  }
}
