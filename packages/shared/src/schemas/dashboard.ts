import { z } from "zod";

// ===========================================================================
// dashboard.ts — kontrak ringkasan dashboard tenant.
//
// DEFINISI PENTING SOAL TRANSFER:
// `transfer_in` / `transfer_out` adalah perpindahan antar-akun milik tenant
// yang sama, BUKAN pemasukan/pengeluaran. Karena itu keduanya:
//   - IKUT dihitung dalam saldo akun (`balance`), tetapi
//   - TIDAK dihitung dalam arus kas (`income`/`expense`).
// Tanpa aturan ini, memindahkan uang antar dompet akan terlihat seperti
// pemasukan sekaligus pengeluaran dan menggelembungkan angka laporan.
// ===========================================================================

/** Jenis transaksi seperti tersimpan di database. */
export const dashboardTransactionTypeSchema = z.enum([
  "income",
  "expense",
  "transfer_in",
  "transfer_out",
]);

export type DashboardTransactionType = z.infer<
  typeof dashboardTransactionTypeSchema
>;

// ---------------------------------------------------------------------------
// Bagian-bagian respons
// ---------------------------------------------------------------------------

/** Posisi kekayaan saat ini (dari saldo akun). */
export const dashboardTotalsSchema = z.object({
  /** Aset - utang. */
  netWorth: z.number().int(),
  assets: z.number().int(),
  debts: z.number().int(),
  accountCount: z.number().int(),
});

export type DashboardTotals = z.infer<typeof dashboardTotalsSchema>;

/** Arus kas satu bulan. */
export const dashboardMonthSchema = z.object({
  /** Bulan dalam format `YYYY-MM`. */
  month: z.string(),
  income: z.number().int(),
  expense: z.number().int(),
  net: z.number().int(),
});

export type DashboardMonth = z.infer<typeof dashboardMonthSchema>;

/** Kategori dengan pengeluaran terbesar (untuk daftar "pengeluaran teratas"). */
export const dashboardCategoryStatSchema = z.object({
  publicId: z.string().uuid({ error: "INVALID_UUID" }).nullable(),
  name: z.string(),
  icon: z.string().nullable(),
  color: z.string().nullable(),
  total: z.number().int(),
});

export type DashboardCategoryStat = z.infer<typeof dashboardCategoryStatSchema>;

/** Baris transaksi terbaru untuk daftar ringkas. */
export const dashboardTransactionSchema = z.object({
  publicId: z.string().uuid({ error: "INVALID_UUID" }),
  type: dashboardTransactionTypeSchema,
  amount: z.number().int(),
  description: z.string().nullable(),
  transactionAt: z.string(),
  accountName: z.string(),
  categoryName: z.string().nullable(),
  categoryIcon: z.string().nullable(),
});

export type DashboardTransaction = z.infer<typeof dashboardTransactionSchema>;

/** Akun dengan saldo terbesar (ringkasan aset). */
export const dashboardAccountStatSchema = z.object({
  publicId: z.string().uuid({ error: "INVALID_UUID" }),
  name: z.string(),
  type: z.string(),
  currency: z.string(),
  balance: z.number().int(),
});

export type DashboardAccountStat = z.infer<typeof dashboardAccountStatSchema>;

// ---------------------------------------------------------------------------
// Respons utama
// ---------------------------------------------------------------------------

export const dashboardResponseSchema = z.object({
  totals: dashboardTotalsSchema,
  /** Arus kas bulan berjalan. */
  currentMonth: dashboardMonthSchema,
  /** Tren arus kas beberapa bulan terakhir (termasuk bulan berjalan). */
  trend: z.array(dashboardMonthSchema),
  /** Pengeluaran terbesar bulan berjalan. */
  topExpenseCategories: z.array(dashboardCategoryStatSchema),
  /** Transaksi terbaru lintas akun. */
  recentTransactions: z.array(dashboardTransactionSchema),
  /** Akun dengan saldo terbesar. */
  topAccounts: z.array(dashboardAccountStatSchema),
});

export type DashboardResponse = z.infer<typeof dashboardResponseSchema>;

/** Jumlah bulan tren yang dikirim server. */
export const DASHBOARD_TREND_MONTHS = 6;

/** Jumlah item default untuk daftar ringkas. */
export const DASHBOARD_LIST_LIMIT = 5;
