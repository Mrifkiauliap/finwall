export default {
  common: {
    TITLE: 'Finwall',
    BUTTON: {
      UNDO: 'Kembalikan',
      REDO: 'Ulangi',
      SAVE: 'Simpan',
      CANCEL: 'Batal',
      CONFIRM: 'Konfirmasi',
    },
    MESSAGE: {
      PROCESSING: 'Memproses...',
    },
    settings: {
      TITLE: 'Pengaturan',
      SUBTITLE: 'Kelola profil, preferensi tampilan, dan keamanan akun Anda.',
      BACK: 'Kembali',
      GROUPS: {
        GENERAL: 'Umum',
        NOTIFICATIONS: 'Notifikasi',
        MORE: 'Lainnya',
      },
      /**
       * Label & deskripsi untuk MENU pengaturan (sidebar + tab).
       *
       * Judul halaman + pesan "segera hadir" ada di namespace `settingsPages`
       * (`page.ts`), supaya satu halaman yang belum jadi tidak memaksa menu-nya
       * ikut disembunyikan.
       */
      PAGES: {
        PROFILE: 'Profil',
        PROFILE_DESC: 'Perbarui nama, email, dan foto profil Anda.',
        PREFERENCES: 'Preferensi',
        PREFERENCES_DESC: 'Sesuaikan tema dan bahasa antarmuka.',
        APPEARANCE: 'Tampilan',
        APPEARANCE_DESC: 'Atur warna, kepadatan, dan skala antarmuka.',
        SECURITY: 'Keamanan & Sesi',
        SECURITY_DESC: 'Kelola password dan perangkat yang sedang login.',
        EMAIL: 'Email',
        EMAIL_DESC: 'Apa yang dikirim ke inbox Anda.',
        PUSH: 'Push',
        PUSH_DESC: 'Pemberitahuan browser dan perangkat.',
        WHATSAPP: 'WhatsApp',
        WHATSAPP_DESC: 'Pengingat lewat WhatsApp.',
        GUIDES: 'Panduan',
        GUIDES_DESC: 'Langkah demi langkah.',
        CHANGE_LOG: 'Catatan Perubahan',
        CHANGE_LOG_DESC: 'Apa yang baru dan diperbaiki.',
      },
      LOGOUT: 'Keluar',
    },
    navigation: {
      BREADCRUMB_LABEL: 'Breadcrumb',
      MENU_MAIN: 'Menu Utama',
      MORE: 'Lainnya',
      CLOSE: 'Tutup',
      SEARCH: 'Cari',
      NOTIFICATIONS: 'Notifikasi',
      DASHBOARD: 'Dashboard',
      ACCOUNTS: 'Akun',
      TRANSACTIONS: 'Transaksi',
      REPORTS: 'Laporan & Analitik',
      MENU_TEAM: 'Pengaturan & Tim',
      MEMBERS: 'Anggota Tim',
      WORKSPACE_SETTINGS: 'Pengaturan Workspace',
      BILLING: 'Billing & Langganan',
      HELP: 'Bantuan',
      LOGOUT: 'Keluar',
      LOGGING_OUT: 'Keluar...',
    },
    emailVerification: {
      BANNER_TITLE: 'Email kamu belum diverifikasi',
      BANNER_MESSAGE:
        'Verifikasi sekarang agar akun kamu aman dan bisa memakai semua fitur Finwall.',
      BANNER_ACTION: 'Verifikasi',
      BANNER_DISMISS: 'Tutup pengingat',
      BANNER_DISMISSED_LATER: 'Pengingat ini akan muncul lagi saat kamu membuka halaman baru.',
    },
    command: {
      TITLE: 'Command shell',
      PLACEHOLDER: 'Ketik perintah atau cari…',
      MASTER_CHANGED: 'Master pintasan diganti ke {master}.',
      EMPTY: 'Tidak ada perintah yang cocok',
      EMPTY_HINT: 'Coba kata kunci lain, atau tekan Esc untuk menutup.',
      GROUP: {
        NAVIGATION: 'Buka halaman',
        ACTIONS: 'Aksi',
      },
      ACTION: {
        SEARCH: 'Buka command shell',
        TOGGLE_THEME: 'Ganti tema terang / gelap',
        TOGGLE_THEME_KEYWORDS: 'tema gelap terang mode tampilan',
        TOGGLE_PANEL: 'Buka/tutup panel akun',
        TOGGLE_PANEL_KEYWORDS: 'sidebar panel akun sembunyikan',
        CHANGE_MASTER: 'Ganti master pintasan (kini {master})',
        CHANGE_MASTER_KEYWORDS: 'pintasan master ctrl alt command keyboard win',
        SETTINGS: 'Pengaturan akun',
        SETTINGS_KEYWORDS: 'profil preferensi keamanan akun',
        HELP: 'Bantuan & FAQ',
        HELP_KEYWORDS: 'bantuan faq dukungan dokumentasi',
        SIGN_OUT_KEYWORDS: 'keluar logout akhiri sesi akun',
      },
      HINT: {
        NAVIGATE: 'Navigasi',
        SELECT: 'Pilih',
        MASTER: 'Master pintasan',
        CLOSE: 'Tutup',
      },
    },
    error: {
      '404': 'Halaman Tidak Ditemukan',
      '404_DESC':
        'Maaf, alamat URL yang Anda tuju tidak ditemukan atau salah. Silakan periksa kembali tautan Anda.',
      BACK_TO_HOME: 'Kembali ke Beranda',
    },
  },
  notification: {
    TITLE: {
      SUCCESS: 'Berhasil',
      WARNING: 'Peringatan',
      INFO: 'Informasi',
      ERROR: 'Terjadi kesalahan',
    },
    BODY: {
      SUCCESS: '{action} berhasil!',
      ERROR: 'Terjadi kesalahan',
    },
  },
  accountmenu: {
    USER_FALLBACK: 'Pengguna',
    THEME_LIGHT: 'Tema Terang',
    THEME_DARK: 'Tema Gelap',
    SETTINGS: 'Pengaturan',
    HELP: 'Bantuan & FAQ',
  },
  workspace: {
    TOGGLE_PANEL: 'Buka/tutup panel akun',
    RESIZE_PANEL: 'Ubah lebar panel akun',
    RESIZE_PANEL_HINT:
      'Geser untuk mengubah lebar. Klik dua kali (atau Enter) untuk kembali ke lebar awal.',
    NO_WORKSPACE: 'Pilih Workspace',
    LIST_TITLE: 'Workspace Anda',
    EMPTY: 'Belum ada workspace.',
    CREATE_NEW: 'Buat workspace baru',
    JOIN: 'Gabung dengan kode',
    RETRY: 'Coba lagi',
    SWITCH_SUCCESS_TITLE: 'Workspace diganti',
    SWITCH_SUCCESS_MESSAGE: 'Sekarang di "{name}".',
    SWITCHING: 'Memindahkan workspace...',
    PLEASE_WAIT: 'Mohon tunggu sebentar...',
  },
} as const
