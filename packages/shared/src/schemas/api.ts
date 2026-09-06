import { z } from "zod";

// ===========================================================================
// api.ts — protokol level rendah: envelope respons sukses + format error yang
// dinormalisasi backend dari ZodError. Tidak mengimpor schema domain lain
// (auth/user/tenant) agar grafik modul bebas siklus.
// ===========================================================================

// Re-export tipe zod (type-only) supaya backend memakai tipe canonical ZodError
// untuk normalisasi tanpa mendeklarasikan zod sebagai dependency langsung.
export type { ZodError } from "zod";

// Format error yang dinormalisasi backend dari `ZodError` untuk dikirim ke
// frontend. `code` adalah APPLICATION error code (bukan internal Zod issue.code)
// dan `path` adalah lokasi field yang gagal validasi. Frontend bertanggung
// jawab melakukan localization/i18n berdasarkan `code`.
export const apiErrorSchema = z.object({
  path: z.array(z.union([z.string(), z.number()])),
  code: z.string(),
});

export type ApiError = z.infer<typeof apiErrorSchema>;

export const apiErrorListSchema = z.array(apiErrorSchema);

export type ApiErrorList = z.infer<typeof apiErrorListSchema>;

// Format respons sukses yang dibungkus TransformInterceptor:
// { message, error: null, data, meta? }.
export const apiResponseSchema = z.object({
  message: z.string(),
  error: z.string().nullable(),
  data: z.unknown().optional(),
  meta: z.unknown().optional(),
});

export type ApiResponse<T = unknown> = {
  message: string;
  error: string | null;
  data?: T;
  meta?: unknown;
};
