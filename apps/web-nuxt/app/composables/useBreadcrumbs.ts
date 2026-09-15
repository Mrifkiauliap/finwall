// app/composables/useBreadcrumbs.ts
//
// Breadcrumb otomatis dari `route.path`.
//
// Hierarki mengikuti segmen URL dengan dua pengecualian:
// - segmen literal `t` dan `tenantPublicId` dilewati (itu konteks workspace,
//   yang sudah diwakili oleh workspace switcher di header);
// - segmen tanpa label terdaftar dilewati (mis. id dinamis).

export interface BreadcrumbItem {
  /** Label yang sudah diterjemahkan. */
  label: string;
  /** Path kumulatif; `null` untuk item terakhir (halaman aktif). */
  to: string | null;
}

/** Peta segmen URL -> i18n key. Menambah halaman baru = tambah baris di sini. */
const SEGMENT_LABEL_KEYS: Record<string, string> = {
  dashboard: "common.navigation.DASHBOARD",
  accounts: "common.navigation.ACCOUNTS",
  transactions: "common.navigation.TRANSACTIONS",
  reports: "common.navigation.REPORTS",
  workspace: "common.navigation.WORKSPACE_SETTINGS",
  members: "common.navigation.MEMBERS",
  billing: "common.navigation.BILLING",
  settings: "common.settings.TITLE",
  profile: "common.settings.TABS.PROFILE",
  preferences: "common.settings.TABS.PREFERENCES",
  security: "common.settings.TABS.SECURITY",
  help: "common.navigation.HELP",
};

export function useBreadcrumbs() {
  const route = useRoute();
  const { tenantPublicId } = useTenant();
  const { t } = useI18n();

  const items = computed<BreadcrumbItem[]>(() => {
    const segments = route.path.split("/").filter(Boolean);
    const crumbs: BreadcrumbItem[] = [];
    let cumulative = "";

    for (const segment of segments) {
      cumulative += `/${segment}`;

      // Konteks workspace diwakili workspace switcher, bukan breadcrumb.
      if (segment === "t" || segment === tenantPublicId.value) continue;

      const labelKey = SEGMENT_LABEL_KEYS[segment];
      if (!labelKey) continue;

      crumbs.push({ label: t(labelKey), to: cumulative });
    }

    // Item terakhir = halaman aktif, jadi tidak perlu bisa diklik.
    const last = crumbs[crumbs.length - 1];
    if (last) last.to = null;

    return crumbs;
  });

  return { items };
}
