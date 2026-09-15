// app/composables/useTenantTabs.ts
// Tab pengaturan di dalam konteks tenant (workspace/members/billing),
// dibangun relatif terhadap `tenantPublicId` dari URL.
export function useTenantTabs() {
  const { tenantPath } = useTenant();
  const { t } = useI18n();
  const route = useRoute();

  const tabs = computed(() => [
    {
      to: tenantPath("/workspace"),
      label: t("common.navigation.WORKSPACE_SETTINGS"),
    },
    {
      to: tenantPath("/workspace/members"),
      label: t("common.navigation.MEMBERS"),
    },
    { to: tenantPath("/billing"), label: t("common.navigation.BILLING") },
  ]);

  const isActive = (path: string) => route.path === path;

  return { tabs, isActive };
}
