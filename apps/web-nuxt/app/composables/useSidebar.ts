/**
 * State panel/sheet sidebar.
 *
 * - `isPanelOpen` : kolom kedua (panel akun) di desktop.
 * - `isMoreOpen`  : sheet "Lainnya" di mobile.
 *
 * Navigasi mobile TIDAK memakai drawer off-canvas: item utama ada di
 * `BottomNav` (fixed bawah) dan sisanya di sheet.
 */
export function useSidebar() {
  const isPanelOpen = useState<boolean>("sidebar-panel-open", () => true);
  const isMoreOpen = useState<boolean>("sidebar-more-open", () => false);

  function togglePanel() {
    isPanelOpen.value = !isPanelOpen.value;
  }

  function openMore() {
    isMoreOpen.value = true;
  }

  function closeMore() {
    isMoreOpen.value = false;
  }

  return { isPanelOpen, togglePanel, isMoreOpen, openMore, closeMore };
}
