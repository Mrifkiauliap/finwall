import { z } from "zod";
import type { WorkspaceTemplateId } from "../workspace-templates.js";

// ===========================================================================
// workspace-template.ts — KONTRAK (zod) untuk template awal workspace.
//
// Definisi DATA-nya ada di `../workspace-templates.ts` supaya bisa dipakai juga
// oleh layer non-HTTP (db seed). Berkas ini hanya menambahkan validasi runtime
// agar id template yang dikirim klien selalu tervalidasi.
// ===========================================================================

export const workspaceTemplateIdSchema = z.enum([
  "individual",
  "family",
  "business",
  "blank",
]) satisfies z.ZodType<WorkspaceTemplateId>;

/** Ringkasan isi template, dipakai untuk pratinjau di UI. */
export const workspaceTemplateInfoSchema = z.object({
  id: workspaceTemplateIdSchema,
  /** Jumlah akun bawaan (0 untuk `blank`). */
  accountCount: z.number().int().nonnegative(),
  /** Jumlah kategori bawaan (0 untuk `blank`). */
  categoryCount: z.number().int().nonnegative(),
});

export type WorkspaceTemplateInfo = z.infer<typeof workspaceTemplateInfoSchema>;
