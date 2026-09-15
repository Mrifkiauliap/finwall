import { z } from "zod";

// ===========================================================================
// account.ts — kontrak akun (aset/utang) yang dipakai halaman Akun.
//
// NILAI `type` WAJIB sinkron dengan pgEnum `account_type` di
// `packages/db/src/schema/accounts.ts`. Menambah nilai di sini tanpa migrasi
// akan ditolak database, jadi keduanya harus diubah bersama.
//
// Semua nominal memakai INTEGER satuan terkecil mata uang (untuk IDR = rupiah
// utuh), mengikuti kolom `integer` di database.
// ===========================================================================

export const accountTypeSchema = z.enum([
  "cash",
  "bank",
  "e_wallet",
  "investment",
  "other",
]);

export type AccountType = z.infer<typeof accountTypeSchema>;

export const ACCOUNT_TYPES = accountTypeSchema.options;

// ---------------------------------------------------------------------------
// Respons
// ---------------------------------------------------------------------------

/**
 * Akun seperti yang dilihat klien.
 *
 * `balance` DIHITUNG server (`initialBalance` + seluruh transaksi), bukan kolom
 * tersimpan — jadi nilainya selalu konsisten dengan ledger.
 */
export const accountSchema = z.object({
  publicId: z.string().uuid({ error: "INVALID_UUID" }),
  name: z.string().min(1, { error: "ACCOUNT_NAME_REQUIRED" }),
  type: accountTypeSchema,
  currency: z.string().length(3, { error: "CURRENCY_INVALID" }),
  initialBalance: z.number().int(),
  /** Saldo saat ini (initialBalance + mutasi transaksi). */
  balance: z.number().int(),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Account = z.infer<typeof accountSchema>;

/** Total per jenis akun, dipakai ringkasan di UI. */
export const accountTypeSummarySchema = z.object({
  type: accountTypeSchema,
  count: z.number().int().nonnegative(),
  total: z.number().int(),
});

export type AccountTypeSummary = z.infer<typeof accountTypeSummarySchema>;

export const accountSummarySchema = z.object({
  /** Total saldo seluruh akun aktif. */
  totalBalance: z.number().int(),
  byType: z.array(accountTypeSummarySchema),
});

export type AccountSummary = z.infer<typeof accountSummarySchema>;

export const accountListResponseSchema = z.object({
  accounts: z.array(accountSchema),
  summary: accountSummarySchema,
});

export type AccountListResponse = z.infer<typeof accountListResponseSchema>;

// ---------------------------------------------------------------------------
// Request
// ---------------------------------------------------------------------------

/**
 * Kategori akun pada UI memakai istilah yang sama dengan `type` — sengaja tidak
 * ada konsep "asset/debt" di backend karena skema database belum membedakannya.
 * Klasifikasi aset/utang (bila dibutuhkan untuk "kekayaan bersih") adalah
 * keputusan tampilan dan dilakukan di frontend.
 */
export const createAccountRequestSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { error: "ACCOUNT_NAME_REQUIRED" })
    .max(100, { error: "ACCOUNT_NAME_TOO_LONG" }),
  type: accountTypeSchema,
  // Tanpa `.default()`: `@vee-validate/zod` memanggil `_def.defaultValue()`
  // (bentuk Zod 3) dan gagal pada Zod 4. Nilai awal diisi lewat `initialValues`
  // di form, sedangkan default server ditangani di service.
  currency: z
    .string()
    .trim()
    .length(3, { error: "CURRENCY_INVALID" })
    .optional(),
  initialBalance: z
    .number()
    .int({ error: "ACCOUNT_BALANCE_INVALID" })
    .optional(),
});

export type CreateAccountRequest = z.infer<typeof createAccountRequestSchema>;

export const updateAccountRequestSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, { error: "ACCOUNT_NAME_REQUIRED" })
      .max(100, { error: "ACCOUNT_NAME_TOO_LONG" }),
    type: accountTypeSchema,
    currency: z.string().trim().length(3, { error: "CURRENCY_INVALID" }),
    initialBalance: z.number().int({ error: "ACCOUNT_BALANCE_INVALID" }),
    isActive: z.boolean(),
  })
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    error: "ACCOUNT_UPDATE_EMPTY",
  });

export type UpdateAccountRequest = z.infer<typeof updateAccountRequestSchema>;
