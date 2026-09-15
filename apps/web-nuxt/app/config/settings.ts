// app/config/settings.ts
//
// Konfigurasi navigasi halaman Pengaturan (akun & preferensi) — terpisah dari
// `navigation.ts` yang menangani navigasi tenant, karena halaman settings
// berada DI LUAR konteks tenant.

/**
 * Nama ikon Lucide untuk settings. Dibatasi union agar salah ketik ketahuan
 * saat type-check.
 */
export type SettingsIconName = "User" | "SlidersHorizontal" | "ShieldCheck";

/** Semua nama ikon yang valid untuk settings (untuk validasi map ikon). */
export const SETTINGS_ICON_NAMES: readonly SettingsIconName[] = [
  "User",
  "SlidersHorizontal",
  "ShieldCheck",
] as const;

export interface SettingsNavItem {
  /** i18n key di namespace `common.settings.PAGES`. */
  nameKey: string;
  path: string;
  icon: SettingsIconName;
}

export interface SettingsNavGroup {
  /** i18n key di namespace `common.settings.GROUPS`. */
  groupNameKey?: string;
  items: SettingsNavItem[];
}

/**
 * Grup dengan `items` kosong otomatis tidak dirender (lihat `useSettingsNav`),
 * jadi struktur grup bisa disiapkan tanpa memunculkan seksi kosong.
 */
export const settingsNavGroups: SettingsNavGroup[] = [
  {
    groupNameKey: "GENERAL",
    items: [
      { nameKey: "PROFILE", path: "/settings/profile", icon: "User" },
      {
        nameKey: "PREFERENCES",
        path: "/settings/preferences",
        icon: "SlidersHorizontal",
      },
      { nameKey: "SECURITY", path: "/settings/security", icon: "ShieldCheck" },
    ],
  },
];
