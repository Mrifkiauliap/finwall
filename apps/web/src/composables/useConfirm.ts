import { ref } from 'vue'

export type ConfirmVariant = 'default' | 'danger'

export interface ConfirmOptions {
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: ConfirmVariant
}

interface ConfirmState extends ConfirmOptions {
  isOpen: boolean
  resolve?: (value: boolean) => void
}

/** State dialog konfirmasi global (singleton). */
const state = ref<ConfirmState>({ isOpen: false, message: '' })

/**
 * Imperative confirm dialog.
 *
 * Usage:
 *   const { confirm } = useConfirm();
 *   const ok = await confirm({ message: "Yakin mau hapus?", variant: "danger" });
 *   if (!ok) return;
 */
function confirm(options: ConfirmOptions): Promise<boolean> {
  return new Promise((resolve) => {
    // Selesaikan dialog sebelumnya sebagai "batal" sebelum membuka yang baru.
    state.value.resolve?.(false)
    state.value = { ...options, isOpen: true, resolve }
  })
}

function handleConfirm() {
  state.value.resolve?.(true)
  state.value.isOpen = false
}

function handleCancel() {
  state.value.resolve?.(false)
  state.value.isOpen = false
}

export function useConfirm() {
  return { state, confirm, handleConfirm, handleCancel }
}
