import {
  navigationConfig,
  type NavGroup,
  type NavIconName,
  type NavItem,
} from "@/config/navigation";

export interface ResolvedNavItem extends Omit<NavItem, "nameKey" | "path"> {
  name: string;
  /** Path absolut tenant-scoped, mis. `/t/{tenantPublicId}/dashboard`. */
  path: string;
  /** Path relatif dari konfigurasi, dipakai untuk mencocokkan rute aktif. */
  basePath: string;
}

export interface ResolvedNavGroup extends Omit<
  NavGroup,
  "groupNameKey" | "items"
> {
  groupName?: string;
  items: ResolvedNavItem[];
}

/** Lucide components yang boleh dipakai navigasi, dipetakan dari `NavIconName`. */
export type NavIconMap = Record<NavIconName, unknown>;

export const useNavigation = () => {
  const route = useRoute();
  const { hasRole } = usePermission();
  const { tenantPublicId, tenantPath } = useTenant();
  const { t } = useI18n();

  const isItemVisible = (item: NavItem): boolean => {
    // Jika roles tidak dispesifikasikan, tampilkan ke semua role.
    if (!item.roles || item.roles.length === 0) return true;
    return hasRole(...item.roles);
  };

  const filteredNavigation = computed<ResolvedNavGroup[]>(() => {
    return navigationConfig
      .map((group) => ({
        groupName: group.groupNameKey
          ? t(`common.navigation.${group.groupNameKey}`)
          : undefined,
        items: group.items.filter(isItemVisible).map((item) => ({
          ...item,
          basePath: item.path,
          // Semua item navigasi hidup di dalam konteks tenant dari URL.
          path: tenantPath(item.path),
          name: t(`common.navigation.${item.nameKey}`),
        })),
      }))
      .filter((group) => group.items.length > 0);
  });

  /** Path rute saat ini TANPA prefix `/t/{tenantPublicId}`. */
  const currentPath = computed(() => {
    const id = tenantPublicId.value;
    const prefix = id ? `/t/${id}` : "";
    const stripped =
      prefix && route.path.startsWith(prefix)
        ? route.path.slice(prefix.length)
        : route.path;
    return stripped === "" ? "/" : stripped;
  });

  /**
   * Item paling spesifik yang cocok dengan rute saat ini.
   *
   * "Paling spesifik menang" supaya `/workspace` dan `/workspace/members`
   * tidak menyala bersamaan saat berada di halaman members.
   */
  const activePath = computed<string | null>(() => {
    const current = currentPath.value;
    const matches = filteredNavigation.value
      .flatMap((group) => group.items)
      .map((item) => item.basePath)
      .filter((basePath) =>
        basePath === "/"
          ? current === "/"
          : current === basePath || current.startsWith(`${basePath}/`),
      );

    return matches.sort((a, b) => b.length - a.length)[0] ?? null;
  });

  /** Apakah item ini yang sedang aktif. */
  const isActive = (basePath: string) => activePath.value === basePath;

  return {
    filteredNavigation,
    activePath,
    isActive,
  };
};
