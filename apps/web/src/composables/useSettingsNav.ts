import {
  SETTINGS_ICON_NAMES,
  settingsNavConfig,
  type SettingsIconName,
  type SettingsNavItem,
} from '@/config/settings'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'

export { SETTINGS_ICON_NAMES }
export type { SettingsIconName }

export interface ResolvedSettingsItem {
  name: string
  description: string
  path: string
  icon: SettingsIconName
  nameKey: string
}

export interface ResolvedSettingsGroup {
  groupName?: string
  items: ResolvedSettingsItem[]
}

/** Item navigasi halaman pengaturan akun, sudah diterjemahkan. */
export function useSettingsNav() {
  const route = useRoute()
  const { t } = useI18n()

  const groups = computed<ResolvedSettingsGroup[]>(() =>
    settingsNavConfig.map((group) => ({
      groupName: group.groupNameKey ? t(`common.settings.${group.groupNameKey}`) : undefined,
      items: group.items.map((item: SettingsNavItem) => ({
        ...item,
        name: t(`common.settings.PAGES.${item.nameKey}`),
        description: t(`common.settings.PAGES.${item.nameKey}_DESC`),
      })),
    })),
  )

  const allItems = computed(() => groups.value.flatMap((group) => group.items))

  /** Cocokkan juga sub-path (mis. `/settings/profile/edit`). */
  const isActive = (path: string) => route.path === path || route.path.startsWith(`${path}/`)

  /** Item yang cocok dengan rute aktif (untuk judul header). */
  const currentItem = computed(() => allItems.value.find((item) => isActive(item.path)) ?? null)

  const title = computed(() => currentItem.value?.name ?? t('common.settings.TITLE'))

  const subtitle = computed(() => currentItem.value?.description ?? t('common.settings.SUBTITLE'))

  return { groups, allItems, isActive, currentItem, title, subtitle }
}
