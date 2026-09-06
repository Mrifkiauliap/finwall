// app/composables/useNavigation.ts
import {
  navigationConfig,
  type NavGroup,
  type NavItem,
} from "@/config/navigation";

export const useNavigation = () => {
  const { hasRole } = usePermission();

  const isItemVisible = (item: NavItem): boolean => {
    // Jika tidak dispesifikasikan roles-nya, tampilkan ke semua role
    if (!item.roles || item.roles.length === 0) return true;
    return hasRole(...item.roles);
  };

  const filteredNavigation = computed<NavGroup[]>(() => {
    return navigationConfig
      .map((group) => ({
        ...group,
        items: group.items.filter(isItemVisible),
      }))
      .filter((group) => group.items.length > 0); // Sembunyikan group jika semua item di dalamnya tidak punya izin
  });

  return {
    filteredNavigation,
  };
};
