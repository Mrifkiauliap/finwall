/**
 * Definisi template awal workspace.
 *
 * Murni DATA (tanpa akses DB), sehingga bisa dipakai bersama oleh:
 * - backend, saat menanam akun & kategori untuk workspace baru
 *   (`WorkspaceSeederService`), dan
 * - `@finwall/db` seed, untuk menyiapkan data pengembangan.
 *
 * Catatan soal data bawaan:
 * - `icon` memakai nama ikon Lucide dan `color` memakai token CSS Finwall
 *   (`--income` / `--expense`), bukan hex bebas, supaya ikut berubah saat tema
 *   gelap/terang.
 * - Nama akun/kategori adalah DATA yang disimpan ke database (bukan string UI),
 *   jadi sengaja tidak masuk namespace i18n — pengguna boleh mengubahnya.
 */

export interface TemplateAccount {
  name: string;
  /** Mengikuti enum `account_type` di packages/db. */
  type: "cash" | "bank" | "e_wallet" | "investment" | "other";
  currency: string;
}

export interface TemplateCategory {
  name: string;
  /** Mengikuti enum `categories_type` di packages/db. */
  type: "income" | "expense";
  icon: string;
  color: string;
}

export type WorkspaceTemplateId =
  "individual" | "family" | "business" | "blank";

export interface WorkspaceTemplate {
  id: WorkspaceTemplateId;
  accounts: TemplateAccount[];
  categories: TemplateCategory[];
}

export const WORKSPACE_TEMPLATE_IDS: WorkspaceTemplateId[] = [
  "individual",
  "family",
  "business",
  "blank",
];

export const DEFAULT_WORKSPACE_TEMPLATE_ID: WorkspaceTemplateId = "individual";

const IDR = "IDR";

/** Warna kanonik agar konsisten antar template. */
const COLOR_INCOME = "var(--income)";
const COLOR_EXPENSE = "var(--expense)";

// ---------------------------------------------------------------------------
// Individual — keuangan pribadi
// ---------------------------------------------------------------------------
const individual: WorkspaceTemplate = {
  id: "individual",
  accounts: [
    { name: "Dompet Tunai", type: "cash", currency: IDR },
    { name: "Rekening Bank", type: "bank", currency: IDR },
    { name: "E-Wallet", type: "e_wallet", currency: IDR },
    { name: "Tabungan", type: "bank", currency: IDR },
    { name: "Investasi", type: "investment", currency: IDR },
  ],
  categories: [
    { name: "Gaji", type: "income", icon: "Wallet", color: COLOR_INCOME },
    { name: "Bonus", type: "income", icon: "Gift", color: COLOR_INCOME },
    {
      name: "Bunga & Dividen",
      type: "income",
      icon: "TrendingUp",
      color: COLOR_INCOME,
    },
    {
      name: "Pemasukan Lain",
      type: "income",
      icon: "Plus",
      color: COLOR_INCOME,
    },

    {
      name: "Makanan & Minuman",
      type: "expense",
      icon: "UtensilsCrossed",
      color: COLOR_EXPENSE,
    },
    {
      name: "Transportasi",
      type: "expense",
      icon: "Car",
      color: COLOR_EXPENSE,
    },
    {
      name: "Belanja",
      type: "expense",
      icon: "ShoppingBag",
      color: COLOR_EXPENSE,
    },
    {
      name: "Tagihan & Utilitas",
      type: "expense",
      icon: "ReceiptText",
      color: COLOR_EXPENSE,
    },
    {
      name: "Kesehatan",
      type: "expense",
      icon: "HeartPulse",
      color: COLOR_EXPENSE,
    },
    {
      name: "Pendidikan",
      type: "expense",
      icon: "GraduationCap",
      color: COLOR_EXPENSE,
    },
    {
      name: "Hiburan",
      type: "expense",
      icon: "Clapperboard",
      color: COLOR_EXPENSE,
    },
    {
      name: "Perawatan Diri",
      type: "expense",
      icon: "Sparkles",
      color: COLOR_EXPENSE,
    },
    {
      name: "Asuransi",
      type: "expense",
      icon: "ShieldCheck",
      color: COLOR_EXPENSE,
    },
    { name: "Pajak", type: "expense", icon: "Landmark", color: COLOR_EXPENSE },
    {
      name: "Transfer Keluar",
      type: "expense",
      icon: "ArrowLeftRight",
      color: COLOR_EXPENSE,
    },
    {
      name: "Pengeluaran Lain",
      type: "expense",
      icon: "Ellipsis",
      color: COLOR_EXPENSE,
    },
  ],
};

// ---------------------------------------------------------------------------
// Family — keuangan rumah tangga (multi-anggota)
// ---------------------------------------------------------------------------
const family: WorkspaceTemplate = {
  id: "family",
  accounts: [
    { name: "Dompet Tunai", type: "cash", currency: IDR },
    { name: "Rekening Bersama", type: "bank", currency: IDR },
    { name: "Tabungan Keluarga", type: "bank", currency: IDR },
    { name: "E-Wallet", type: "e_wallet", currency: IDR },
    { name: "Dana Pendidikan", type: "investment", currency: IDR },
    { name: "Dana Darurat", type: "investment", currency: IDR },
  ],
  categories: [
    { name: "Gaji", type: "income", icon: "Wallet", color: COLOR_INCOME },
    {
      name: "Tunjangan",
      type: "income",
      icon: "HandCoins",
      color: COLOR_INCOME,
    },
    { name: "Bonus", type: "income", icon: "Gift", color: COLOR_INCOME },
    {
      name: "Hasil Investasi",
      type: "income",
      icon: "TrendingUp",
      color: COLOR_INCOME,
    },
    {
      name: "Pemasukan Lain",
      type: "income",
      icon: "Plus",
      color: COLOR_INCOME,
    },

    {
      name: "Belanja Bulanan",
      type: "expense",
      icon: "ShoppingCart",
      color: COLOR_EXPENSE,
    },
    {
      name: "Kebutuhan Dapur",
      type: "expense",
      icon: "UtensilsCrossed",
      color: COLOR_EXPENSE,
    },
    {
      name: "Pendidikan Anak",
      type: "expense",
      icon: "GraduationCap",
      color: COLOR_EXPENSE,
    },
    {
      name: "Kesehatan Keluarga",
      type: "expense",
      icon: "HeartPulse",
      color: COLOR_EXPENSE,
    },
    {
      name: "Transportasi",
      type: "expense",
      icon: "Car",
      color: COLOR_EXPENSE,
    },
    {
      name: "Tagihan & Utilitas",
      type: "expense",
      icon: "ReceiptText",
      color: COLOR_EXPENSE,
    },
    {
      name: "Liburan Keluarga",
      type: "expense",
      icon: "Plane",
      color: COLOR_EXPENSE,
    },
    {
      name: "Pakaian & Perlengkapan",
      type: "expense",
      icon: "Shirt",
      color: COLOR_EXPENSE,
    },
    {
      name: "Donasi & Zakat",
      type: "expense",
      icon: "HeartHandshake",
      color: COLOR_EXPENSE,
    },
    {
      name: "Asuransi",
      type: "expense",
      icon: "ShieldCheck",
      color: COLOR_EXPENSE,
    },
    { name: "Pajak", type: "expense", icon: "Landmark", color: COLOR_EXPENSE },
    {
      name: "Pengeluaran Lain",
      type: "expense",
      icon: "Ellipsis",
      color: COLOR_EXPENSE,
    },
  ],
};

// ---------------------------------------------------------------------------
// Business — operasional usaha
// ---------------------------------------------------------------------------
const business: WorkspaceTemplate = {
  id: "business",
  accounts: [
    { name: "Kas Usaha", type: "cash", currency: IDR },
    { name: "Rekening Operasional", type: "bank", currency: IDR },
    { name: "Rekening Pajak", type: "bank", currency: IDR },
    { name: "Persediaan", type: "other", currency: IDR },
    { name: "Peralatan", type: "other", currency: IDR },
    { name: "Piutang Usaha", type: "other", currency: IDR },
    { name: "Utang Usaha", type: "other", currency: IDR },
  ],
  categories: [
    {
      name: "Penjualan",
      type: "income",
      icon: "ShoppingCart",
      color: COLOR_INCOME,
    },
    {
      name: "Pendapatan Jasa",
      type: "income",
      icon: "Briefcase",
      color: COLOR_INCOME,
    },
    {
      name: "Pendapatan Bunga",
      type: "income",
      icon: "TrendingUp",
      color: COLOR_INCOME,
    },
    {
      name: "Pemasukan Lain",
      type: "income",
      icon: "Plus",
      color: COLOR_INCOME,
    },

    {
      name: "Bahan Baku",
      type: "expense",
      icon: "Package",
      color: COLOR_EXPENSE,
    },
    {
      name: "Gaji Karyawan",
      type: "expense",
      icon: "Users",
      color: COLOR_EXPENSE,
    },
    {
      name: "Sewa & Utilitas",
      type: "expense",
      icon: "Building2",
      color: COLOR_EXPENSE,
    },
    {
      name: "Pemasaran",
      type: "expense",
      icon: "Megaphone",
      color: COLOR_EXPENSE,
    },
    {
      name: "Transportasi & Logistik",
      type: "expense",
      icon: "Truck",
      color: COLOR_EXPENSE,
    },
    {
      name: "Peralatan & Perawatan",
      type: "expense",
      icon: "Wrench",
      color: COLOR_EXPENSE,
    },
    {
      name: "Jasa Profesional",
      type: "expense",
      icon: "Scale",
      color: COLOR_EXPENSE,
    },
    { name: "Pajak", type: "expense", icon: "Landmark", color: COLOR_EXPENSE },
    {
      name: "Biaya Bank",
      type: "expense",
      icon: "CreditCard",
      color: COLOR_EXPENSE,
    },
    {
      name: "Pengeluaran Lain",
      type: "expense",
      icon: "Ellipsis",
      color: COLOR_EXPENSE,
    },
  ],
};

// ---------------------------------------------------------------------------
// Blank — benar-benar kosong
// ---------------------------------------------------------------------------
const blank: WorkspaceTemplate = {
  id: "blank",
  accounts: [],
  categories: [],
};

export const WORKSPACE_TEMPLATES: Record<
  WorkspaceTemplateId,
  WorkspaceTemplate
> = {
  individual,
  family,
  business,
  blank,
};

/** Ambil definisi template; id tak dikenal jatuh ke `blank`. */
export function getWorkspaceTemplate(
  id: WorkspaceTemplateId,
): WorkspaceTemplate {
  return WORKSPACE_TEMPLATES[id] ?? blank;
}
