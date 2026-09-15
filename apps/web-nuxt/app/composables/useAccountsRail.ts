// app/composables/useAccountsRail.ts
//
// Sumber data untuk rail akun (kolom kedua sidebar).
//
// Taksonomi grup mengikuti model akun finansial: Aset (kas, investasi, ...) dan
// Utang (kartu kredit, pinjaman, ...). Lihat `packages/db/src/schema/accounts.ts`
// untuk enum tipe akun yang tersedia.

export type AccountKind = "asset" | "debt";

export interface AccountRailItem {
  publicId: string;
  name: string;
  kind: AccountKind;
  /** Kunci grup, mis. `cash` / `credit_cards`. */
  groupKey: string;
  balance: number;
  currency?: string;
}

export interface AccountRailGroup {
  key: string;
  kind: AccountKind;
  /** i18n key label grup. */
  labelKey: string;
  accounts: AccountRailItem[];
  total: number;
}

export type AccountsFilter = "all" | AccountKind;

/** Definisi grup akun beserta urutannya (aset dulu, lalu utang). */
const GROUP_DEFS: { key: string; kind: AccountKind; labelKey: string }[] = [
  { key: "cash", kind: "asset", labelKey: "accounts.GROUPS.CASH" },
  {
    key: "investments",
    kind: "asset",
    labelKey: "accounts.GROUPS.INVESTMENTS",
  },
  { key: "crypto", kind: "asset", labelKey: "accounts.GROUPS.CRYPTO" },
  { key: "properties", kind: "asset", labelKey: "accounts.GROUPS.PROPERTIES" },
  { key: "vehicles", kind: "asset", labelKey: "accounts.GROUPS.VEHICLES" },
  {
    key: "other_assets",
    kind: "asset",
    labelKey: "accounts.GROUPS.OTHER_ASSETS",
  },
  {
    key: "credit_cards",
    kind: "debt",
    labelKey: "accounts.GROUPS.CREDIT_CARDS",
  },
  { key: "loans", kind: "debt", labelKey: "accounts.GROUPS.LOANS" },
  {
    key: "other_liabilities",
    kind: "debt",
    labelKey: "accounts.GROUPS.OTHER_LIABILITIES",
  },
];

/**
 * Format nominal finansial. Memakai tabular figures via CSS (`tabular-nums`)
 * di sisi tampilan agar kolom angka tetap rata.
 */
export function formatCurrency(value: number, currency = "IDR"): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

export function useAccountsRail() {
  /**
   * Daftar akun tenant aktif.
   *
   * Untuk sekarang kosong: endpoint tenant-scoped untuk akun belum ada.
   * TODO: isi dari `GET /tenants/{tenantPublicId}/accounts` setelah endpoint
   *       dibuat (pola sama seperti `TenantResourceController`).
   */
  const accounts = useState<AccountRailItem[]>("accounts-rail", () => []);

  const filter = useState<AccountsFilter>("accounts-rail-filter", () => "all");

  const groups = computed<AccountRailGroup[]>(() =>
    GROUP_DEFS.map((def) => {
      const items = accounts.value.filter((a) => a.groupKey === def.key);
      return {
        ...def,
        accounts: items,
        total: items.reduce((sum, a) => sum + a.balance, 0),
      };
    }).filter((g) => filter.value === "all" || g.kind === filter.value),
  );

  const totals = computed(() => {
    const sumByKind = (kind: AccountKind) =>
      accounts.value
        .filter((a) => a.kind === kind)
        .reduce((sum, a) => sum + a.balance, 0);

    const assets = sumByKind("asset");
    const debts = sumByKind("debt");
    return { assets, debts, net: assets - debts };
  });

  const hasAccounts = computed(() => accounts.value.length > 0);

  return {
    accounts,
    filter,
    groups,
    totals,
    hasAccounts,
  };
}
