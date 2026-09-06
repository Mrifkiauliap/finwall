// app/config/navigation.ts
import type { TenantRole } from "@finwall/shared";

export interface NavItem {
  name: string;
  path: string;
  icon?: string; // Nama icon Lucide, misal: 'LayoutDashboard', 'Receipt', 'Users'
  roles?: TenantRole[]; // Jika undefined/kosong, berarti SEMUA role bisa akses
  badge?: string | number;
}

export interface NavGroup {
  groupName?: string;
  items: NavItem[];
}

export const navigationConfig: NavGroup[] = [
  {
    groupName: "Menu Utama",
    items: [
      {
        name: "Dashboard",
        path: "/dashboard",
        icon: "LayoutDashboard",
      },
      {
        name: "Transaksi",
        path: "/transactions",
        icon: "Receipt",
      },
      {
        name: "Laporan & Analitik",
        path: "/reports",
        icon: "BarChart3",
      },
    ],
  },
  {
    groupName: "Pengaturan & Tim",
    items: [
      {
        name: "Anggota Tim",
        path: "/settings/members",
        icon: "Users",
        roles: ["owner", "admin"], // Hanya Owner & Admin
      },
      {
        name: "Pengaturan Workspace",
        path: "/settings/workspace",
        icon: "Building2",
        roles: ["owner", "admin"],
      },
      {
        name: "Billing & Langganan",
        path: "/settings/billing",
        icon: "CreditCard",
        roles: ["owner"], // Khusus Owner
      },
    ],
  },
];
