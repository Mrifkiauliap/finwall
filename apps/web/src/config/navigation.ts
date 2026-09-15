import type { TenantRole } from '@finwall/shared'

/**
 * Nama ikon Lucide yang dipakai navigasi. Dibatasi union agar salah ketik di
 * `navigationConfig` langsung ketahuan saat type-check.
 */
export type NavIconName =
  'LayoutDashboard' | 'Wallet' | 'Receipt' | 'BarChart3' | 'Users' | 'Building2' | 'CreditCard'

export interface NavItem {
  /** i18n key di namespace `common.navigation` untuk label item. */
  nameKey: string
  /**
   * Path RELATIF terhadap tenant aktif. Jangan tulis prefix `/t/{id}` di sini —
   * `useNavigation` yang menambahkannya lewat `tenantPath()`.
   */
  path: string
  icon?: NavIconName
  /** Kosong = semua role bisa akses. */
  roles?: TenantRole[]
}

export interface NavGroup {
  /** i18n key di namespace `common.navigation` untuk judul grup. */
  groupNameKey?: string
  items: NavItem[]
}

/**
 * Path harus cocok dengan struktur route tenant:
 *   /t/:tenantPublicId/dashboard, /accounts, /transactions, /reports,
 *   /workspace, /workspace/members, /billing
 */
export const navigationConfig: NavGroup[] = [
  {
    groupNameKey: 'MENU_MAIN',
    items: [
      { nameKey: 'DASHBOARD', path: '/dashboard', icon: 'LayoutDashboard' },
      { nameKey: 'ACCOUNTS', path: '/accounts', icon: 'Wallet' },
      { nameKey: 'TRANSACTIONS', path: '/transactions', icon: 'Receipt' },
      { nameKey: 'REPORTS', path: '/reports', icon: 'BarChart3' },
    ],
  },
  {
    groupNameKey: 'MENU_TEAM',
    items: [
      {
        nameKey: 'WORKSPACE_SETTINGS',
        path: '/workspace',
        icon: 'Building2',
        roles: ['owner', 'admin'],
      },
      {
        nameKey: 'MEMBERS',
        path: '/workspace/members',
        icon: 'Users',
        roles: ['owner', 'admin'],
      },
      {
        nameKey: 'BILLING',
        path: '/billing',
        icon: 'CreditCard',
        roles: ['owner'],
      },
    ],
  },
]

// Navigasi halaman Pengaturan Akun hidup di `@/config/settings` — bukan di sini.
//
// Sebelumnya file ini memuat `settingsNavConfig` kedua dengan bentuk berbeda
// (`descriptionKey` eksplisit) yang TIDAK PERNAH diimpor siapa pun. Duplikat
// seperti itu berbahaya: menambah halaman di satu tempat tidak akan terlihat di
// tempat lain, dan bentuknya sudah menyimpang dari konvensi `<nameKey>_DESC`
// yang dipakai `useSettingsNav`.
