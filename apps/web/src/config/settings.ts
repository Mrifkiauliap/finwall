/**
 * Konfigurasi navigasi halaman Pengaturan Akun (di luar konteks tenant).
 *
 * Dua prinsip yang menjaga file ini tetap aman saat ditambah:
 *
 * 1. **Nama ikon dibatasi union** (`SettingsIconName`). Salah ketik pada `icon`
 *    langsung ketahuan saat type-check, dan peta ikon di `SettingsNav.vue`
 *    wajib lengkap untuk SETIAP nama yang terdaftar — jadi ikon tidak pernah
 *    diam-diam gagal ter-render.
 *
 * 2. **Ikon dalam grup notifikasi memakai kanal yang berbeda** (Mail / Bell /
 *    MessageCircle). Tiga item dengan ikon sama membuat daftar tidak bisa
 *    dipindai sekilas — hanya teks yang membedakannya.
 */

/**
 * Nama ikon Lucide yang boleh dipakai navigasi pengaturan.
 *
 * `SettingsNav.vue` memetakan setiap nama di sini ke komponen Lucide; menambah
 * nama tanpa menambah petanya akan gagal type-check (`Record<SettingsIconName, …>`
 * menuntut lengkap).
 */
export const SETTINGS_ICON_NAMES = [
  'User',
  'SlidersHorizontal',
  'Sun',
  'ShieldCheck',
  'Mail',
  'Bell',
  'MessageCircle',
  'BookOpen',
  'FileText',
] as const

export type SettingsIconName = (typeof SETTINGS_ICON_NAMES)[number]

export interface SettingsNavItem {
  /** Kunci i18n di `common.settings.PAGES` untuk label & `<key>_DESC`. */
  nameKey: string
  /**
   * Path ABSOLUT. Halaman pengaturan hidup di luar konteks tenant, jadi tidak
   * ada prefix `/t/{tenantPublicId}` yang perlu ditambahkan.
   */
  path: string
  icon: SettingsIconName
}

export interface SettingsNavGroup {
  /** Kunci i18n di `common.settings.GROUPS` untuk judul grup. */
  groupNameKey?: string
  items: SettingsNavItem[]
}

/**
 * `as const satisfies` — dua-duanya diperlukan:
 *
 * - `satisfies` memvalidasi bentuknya terhadap `SettingsNavGroup[]`, jadi salah
 *   ketik `icon`/`nameKey` ditolak di sini, bukan saat render.
 * - `as const` membuat literal-nya tetap sempit dan `readonly`, sehingga
 *   susunan menu ini tidak bisa diubah tak sengaja oleh konsumen.
 *
 * Halaman yang belum jadi memakai `PlaceholderView`; judul + pesan "segera
 * hadir"-nya ada di namespace i18n `settingsPages` (`page.ts`).
 */
export const settingsNavConfig = [
  {
    groupNameKey: 'GROUPS.GENERAL',
    items: [
      { nameKey: 'PROFILE', path: '/settings/profile', icon: 'User' },
      { nameKey: 'PREFERENCES', path: '/settings/preferences', icon: 'SlidersHorizontal' },
      { nameKey: 'APPEARANCE', path: '/settings/appearance', icon: 'Sun' },
      { nameKey: 'SECURITY', path: '/settings/security', icon: 'ShieldCheck' },
    ],
  },
  {
    groupNameKey: 'GROUPS.NOTIFICATIONS',
    items: [
      { nameKey: 'EMAIL', path: '/settings/notifications/email', icon: 'Mail' },
      { nameKey: 'PUSH', path: '/settings/notifications/push', icon: 'Bell' },
      {
        nameKey: 'WHATSAPP',
        path: '/settings/notifications/whatsapp',
        icon: 'MessageCircle',
      },
    ],
  },
  {
    groupNameKey: 'GROUPS.MORE',
    items: [
      { nameKey: 'GUIDES', path: '/settings/guides', icon: 'BookOpen' },
      { nameKey: 'CHANGE_LOG', path: '/settings/changelog', icon: 'FileText' },
    ],
  },
] as const satisfies readonly SettingsNavGroup[]
