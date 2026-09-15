import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'

export interface BreadcrumbItem {
  label: string
  path?: string
}

/**
 * Breadcrumb dibangun dari `meta.breadcrumb` pada definisi route
 * (array i18n key), sehingga tiap halaman cukup mendeklarasikan labelnya.
 *
 * Contoh: `meta: { breadcrumb: ['common.navigation.MENU_TEAM', 'members.TITLE'] }`
 */
export const useBreadcrumbs = () => {
  const route = useRoute()
  const { t } = useI18n()

  const items = computed<BreadcrumbItem[]>(() => {
    const keys = (route.meta.breadcrumb as string[] | undefined) ?? []
    return keys.map((key) => ({ label: t(key) }))
  })

  return { items }
}
