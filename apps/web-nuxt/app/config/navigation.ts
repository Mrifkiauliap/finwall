// app/config/navigation.ts
import type { TenantRole } from "@finwall/shared";

/**
 * Nama ikon Lucide yang dipakai navigasi. Dibatasi union agar salah ketik di
 * `navigationConfig` langsung ketahuan saat type-check (sebelumnya `string`
 * bebas sehingga ikon bisa diam-diam tidak tampil).
 */
export type NavIconName =
  | "LayoutDashboard"
  | "Wallet"
  | "Receipt"
  | "BarChart3"
  | "Users"
  | "Building2"
  | "CreditCard";

export interface NavItem {
  /** i18n key di namespace `common.navigation` untuk label item. */
  nameKey: string;
  /**
   * Path RELATIF terhadap tenant aktif. Jangan tulis prefix `/t/{id}` di sini —
   * `useNavigation` yang menambahkannya lewat `tenantPath()`.
   */
  path: string;
  icon?: NavIconName;
  /** Kosong = semua role bisa akses. */
  roles?: TenantRole[];
}

export interface NavGroup {
  /** i18n key di namespace `common.navigation` untuk judul grup. */
  groupNameKey?: string;
  items: NavItem[];
}

/**
 * Path harus cocok dengan struktur `app/pages/t/[tenantPublicId]/**`:
 *   /dashboard, /accounts, /transactions, /reports,
 *   /workspace, /workspace/members, /billing
 */
export const navigationConfig: NavGroup[] = [
  {
    groupNameKey: "MENU_MAIN",
    items: [
      { nameKey: "DASHBOARD", path: "/dashboard", icon: "LayoutDashboard" },
      { nameKey: "ACCOUNTS", path: "/accounts", icon: "Wallet" },
      { nameKey: "TRANSACTIONS", path: "/transactions", icon: "Receipt" },
      { nameKey: "REPORTS", path: "/reports", icon: "BarChart3" },
    ],
  },
  {
    groupNameKey: "MENU_TEAM",
    items: [
      {
        nameKey: "MEMBERS",
        path: "/workspace/members",
        icon: "Users",
        roles: ["owner", "admin"],
      },
      {
        nameKey: "WORKSPACE_SETTINGS",
        path: "/workspace",
        icon: "Building2",
        roles: ["owner", "admin"],
      },
      {
        nameKey: "BILLING",
        path: "/billing",
        icon: "CreditCard",
        roles: ["owner"],
      },
    ],
  },
];
