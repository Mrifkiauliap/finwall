export type ConfirmVariant = "default" | "danger";

export interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmVariant;
}

interface ConfirmState extends ConfirmOptions {
  isOpen: boolean;
  resolve?: (value: boolean) => void;
}

/**
 * Imperative confirm dialog.
 *
 * Usage:
 *   const { confirm } = useConfirm();
 *   const ok = await confirm({ message: "Yakin mau hapus data ini?", variant: "danger" });
 *   if (!ok) return;
 */
export function useConfirm() {
  const state = useState<ConfirmState>("confirm-dialog", () => ({
    isOpen: false,
    message: "",
  }));

  function confirm(options: ConfirmOptions): Promise<boolean> {
    return new Promise((resolve) => {
      // Resolve any dangling previous confirm as cancelled before opening a new one.
      state.value.resolve?.(false);
      state.value = {
        ...options,
        isOpen: true,
        resolve,
      };
    });
  }

  function handleConfirm() {
    state.value.resolve?.(true);
    state.value.isOpen = false;
  }

  function handleCancel() {
    state.value.resolve?.(false);
    state.value.isOpen = false;
  }

  return { state, confirm, handleConfirm, handleCancel };
}
