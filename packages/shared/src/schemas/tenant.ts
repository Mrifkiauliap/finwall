import { z } from "zod";
import { authTokensSchema, currentTenantSchema } from "./auth.js";
import { tenantRoleSchema } from "./tenant-role.js";
import { currentUserSchema } from "./user.js";
import { workspaceTemplateIdSchema } from "./workspace-template.js";

// ===========================================================================
// tenant.ts — contract tenant (workspace): daftar, buat, pindah, undangan.
// Mengimpor primitif bersama (authTokensSchema & currentTenantSchema dari
// auth.ts, currentUserSchema dari user.ts). Grafik modul tetap acyclic:
//   auth.ts  -> user.ts
//   tenant.ts -> auth.ts + user.ts
// ===========================================================================

export const tenantInviteStatusSchema = z.enum([
  "pending",
  "accepted",
  "rejected",
]);

export type TenantInviteStatus = z.infer<typeof tenantInviteStatusSchema>;

// Satu tenant di daftar tenant yang bisa diakses user (beserta perannya).
export const tenantInfoSchema = z.object({
  publicId: z.string().uuid({ error: "INVALID_UUID" }),
  name: z.string(),
  role: tenantRoleSchema,
  isCurrent: z.boolean(),
  createdAt: z.string(),
});

export type TenantInfo = z.infer<typeof tenantInfoSchema>;

export const tenantListResponseSchema = z.object({
  tenants: z.array(tenantInfoSchema),
});

export type TenantListResponse = z.infer<typeof tenantListResponseSchema>;

export const tenantMemberInfoSchema = z.object({
  publicId: z.string().uuid({ error: "INVALID_UUID" }),
  username: z.string(),
  email: z.string(),
  role: tenantRoleSchema,
  isActive: z.boolean(),
  isCurrent: z.boolean().nullable().optional(),
  joinedAt: z.string(),
});

export type TenantMemberInfo = z.infer<typeof tenantMemberInfoSchema>;

export const tenantMemberListResponseSchema = z.object({
  members: z.array(tenantMemberInfoSchema),
});

export type TenantMemberListResponse = z.infer<
  typeof tenantMemberListResponseSchema
>;

export const createTenantRequestSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { error: "TENANT_NAME_REQUIRED" })
    .max(100, { error: "TENANT_NAME_TOO_LONG" }),
  // Template awal (akun & kategori bawaan).
  //
  // Sengaja `.optional()` TANPA `.default()`: `@vee-validate/zod` memanggil
  // `_def.defaultValue()` (bentuk Zod 3) dan gagal pada Zod 4, sedangkan skema
  // ini juga dipakai frontend lewat `toTypedSchema`. Nilai default diterapkan
  // di service (`?? DEFAULT_WORKSPACE_TEMPLATE_ID`).
  template: workspaceTemplateIdSchema.optional(),
});

export type CreateTenantRequest = z.infer<typeof createTenantRequestSchema>;

export const switchTenantRequestSchema = z.object({
  tenantId: z.string().uuid({ error: "INVALID_TENANT_ID" }),
});

export type SwitchTenantRequest = z.infer<typeof switchTenantRequestSchema>;

// Respons saat membuat / berpindah tenant: token baru ikut diterbitkan karena
// `tenantId` (tenant aktif) adalah bagian dari klaim JWT.
export const tenantAuthResponseSchema = z.object({
  user: currentUserSchema,
  tenant: currentTenantSchema,
  tokens: authTokensSchema,
});

export type TenantAuthResponse = z.infer<typeof tenantAuthResponseSchema>;

// ---------------------------------------------------------------------------
// Undangan join tenant
// ---------------------------------------------------------------------------

// Undangan oleh owner/admin tenant.
// - email kosong => undangan TERBUKA (siapa pun dengan kode bisa join).
// - email diisi => undangan by email (status pending s/d diterima/ditolak).
export const createInviteRequestSchema = z.object({
  email: z.string().email({ error: "INVALID_EMAIL" }).optional(),
  role: tenantRoleSchema.optional(),
  expiresInHours: z.number().int().positive().optional(),
});

export type CreateInviteRequest = z.infer<typeof createInviteRequestSchema>;

// Kode dikembalikan SEKALI kepada pemilik undangan; disimpan sebagai hash di DB.
export const inviteCodeResponseSchema = z.object({
  inviteId: z.string().uuid({ error: "INVALID_UUID" }),
  code: z.string().nullable(),
  expiresAt: z.string().nullable(),
});

export type InviteCodeResponse = z.infer<typeof inviteCodeResponseSchema>;

export const tenantInviteInfoSchema = z.object({
  id: z.string().uuid({ error: "INVALID_UUID" }),
  email: z.string().nullable(),
  role: tenantRoleSchema,
  status: tenantInviteStatusSchema,
  expiresAt: z.string().nullable(),
  createdAt: z.string(),
});

export type TenantInviteInfo = z.infer<typeof tenantInviteInfoSchema>;

export const tenantInviteListResponseSchema = z.object({
  invites: z.array(tenantInviteInfoSchema),
});

export type TenantInviteListResponse = z.infer<
  typeof tenantInviteListResponseSchema
>;

// Undangan pending yang menunggu aksi invitee (by email), plus info tenant.
export const pendingInviteInfoSchema = tenantInviteInfoSchema.extend({
  tenantPublicId: z.string().uuid({ error: "INVALID_UUID" }),
  tenantName: z.string(),
});

export type PendingInviteInfo = z.infer<typeof pendingInviteInfoSchema>;

export const pendingInvitesResponseSchema = z.object({
  invites: z.array(pendingInviteInfoSchema),
});

export type PendingInvitesResponse = z.infer<
  typeof pendingInvitesResponseSchema
>;

// Join undangan TERBUKA memakai kode pendek.
export const joinTenantRequestSchema = z.object({
  code: z.string().min(1, { error: "INVITE_CODE_REQUIRED" }),
});

export type JoinTenantRequest = z.infer<typeof joinTenantRequestSchema>;

export const joinTenantResponseSchema = z.object({
  user: currentUserSchema,
  tenant: currentTenantSchema,
  tokens: authTokensSchema,
});

export type JoinTenantResponse = z.infer<typeof joinTenantResponseSchema>;
