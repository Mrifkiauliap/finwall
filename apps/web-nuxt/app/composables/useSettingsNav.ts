// app/composables/useSettingsNav.ts
import {
  SETTINGS_ICON_NAMES,
  settingsNavGroups,
  type SettingsIconName,
  type SettingsNavGroup,
  type SettingsNavItem,
} from "@/config/settings";

export { SETTINGS_ICON_NAMES };

export interface ResolvedSettingsItem extends SettingsNavItem {
  name: string;
  nameKey: SettingsNavItem["nameKey"];
}

export interface ResolvedSettingsGroup extends Omit<
  SettingsNavGroup,
  "groupNameKey" | "items"
> {
  groupName?: string;
  items: ResolvedSettingsItem[];
}

export function useSettingsNav() {
  const route = useRoute();
  const { t } = useI18n();

  const groups = computed<ResolvedSettingsGroup[]>(() =>
    settingsNavGroups
      .map((group) => ({
        groupName: group.groupNameKey
          ? t(`common.settings.GROUPS.${group.groupNameKey}`)
          : undefined,
        items: group.items.map((item) => ({
          ...item,
          name: t(`common.settings.PAGES.${item.nameKey}`),
        })),
      }))
      .filter((group) => group.items.length > 0),
  );

  const allItems = computed(() => groups.value.flatMap((g) => g.items));

  const isActive = (path: string) => route.path === path;

  /** Item yang cocok dengan rute aktif (untuk judul header). */
  const currentItem = computed(
    () => allItems.value.find((item) => item.path === route.path) ?? null,
  );

  const title = computed(
    () => currentItem.value?.name ?? t("common.settings.TITLE"),
  );

  const subtitle = computed(() => {
    const item = currentItem.value;
    if (!item) return t("common.settings.SUBTITLE");

    const key = `common.settings.PAGES.${item.nameKey}_DESC`;
    const translated = t(key);
    // `t()` mengembalikan key itu sendiri bila tidak ada terjemahan.
    return translated === key ? t("common.settings.SUBTITLE") : translated;
  });

  return { groups, allItems, isActive, currentItem, title, subtitle };
}

export type { SettingsIconName };
