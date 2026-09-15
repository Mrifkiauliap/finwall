import { z } from "zod";
import { tenantRoleSchema } from "./tenant-role.js";
import { currentUserSchema } from "./user.js";

// ===========================================================================
// auth.ts — session/token primitives + tenant aktif + endpoint auth inti
// (signup/signin/refresh/me/logout). tenant.ts mengimpor dari sini supaya
// grafik modul bebas siklus. user.ts tidak boleh mengimpor kembali ke sini.
// ===========================================================================

// ---------------------------------------------------------------------------
// Session & token primitives
// ---------------------------------------------------------------------------

// Metadata device yang dicatat saat session dibuat / di-rotate.
export const sessionMetaSchema = z.object({
  userAgent: z.string().nullable(),
  ipAddress: z.string().nullable(),
  device: z.string().nullable(),
});

export type SessionMeta = z.infer<typeof sessionMetaSchema>;

// Pasangan token (access + refresh). tokenType/expiresIn disertakan supaya
// klien tahu cara memakai & kapan token diperbarui.
export const authTokensSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  tokenType: z.string(),
  expiresIn: z.string(),
});

export type AuthTokens = z.infer<typeof authTokensSchema>;

// Pasangan token minimal untuk pengaturan cookie.
export const cookieTokensSchema = authTokensSchema.pick({
  accessToken: true,
  refreshToken: true,
});

export type CookieTokens = z.infer<typeof cookieTokensSchema>;

// Tampilan session untuk klien — tidak pernah berisi refresh token/hash.
export const sessionInfoSchema = z.object({
  id: z.string().uuid({ error: "INVALID_UUID" }),
  device: z.string().nullable(),
  userAgent: z.string().nullable(),
  ipAddress: z.string().nullable(),
  lastActiveAt: z.string(),
  createdAt: z.string(),
  expiresAt: z.string(),
  isCurrent: z.boolean(),
});

export type SessionInfo = z.infer<typeof sessionInfoSchema>;

export const sessionListResponseSchema = z.object({
  sessions: z.array(sessionInfoSchema),
});

export type SessionListResponse = z.infer<typeof sessionListResponseSchema>;

export const revokeSessionResponseSchema = z.object({
  revokedCurrent: z.boolean(),
  message: z.string(),
});

export type RevokeSessionResponse = z.infer<typeof revokeSessionResponseSchema>;

// Klaim JWT bersama untuk access + refresh token.
//
// IDENTITY ONLY: `sub` = users.id, `sessionId` = sessions.publicId.
// Tenant aktif TIDAK disimpan di token — konteks tenant berasal dari URL
// (`tenantPublicId`) dan diverifikasi keanggotaannya di server. Dengan begitu
// satu user bisa memegang banyak workspace tanpa token yang saling menimpa.
export const jwtPayloadSchema = z.object({
  sub: z.string(),
  sessionId: z.string().uuid({ error: "INVALID_UUID" }),
  tokenType: z.enum(["access", "refresh"]),
  iat: z.number().optional(),
  exp: z.number().optional(),
});

export type JwtPayload = z.infer<typeof jwtPayloadSchema>;

// ---------------------------------------------------------------------------
// Tenant aktif session (dipakai di respons auth & tenant)
// ---------------------------------------------------------------------------

export const currentTenantSchema = z.object({
  publicId: z.string().uuid({ error: "INVALID_UUID" }).nullable(),
  name: z.string().nullable(),
  role: tenantRoleSchema.nullable(),
});

export type CurrentTenant = z.infer<typeof currentTenantSchema>;

// ---------------------------------------------------------------------------
// Endpoint auth inti
// ---------------------------------------------------------------------------

// Respons signin/refresh yang memuat token baru.
export const authResponseSchema = z.object({
  user: currentUserSchema,
  tenant: currentTenantSchema,
  tokens: authTokensSchema.optional(),
});

export type AuthResponse = z.infer<typeof authResponseSchema>;

// Respons GET /me.
export const meResponseSchema = z.object({
  user: currentUserSchema,
  tenant: currentTenantSchema,
});

export type MeResponse = z.infer<typeof meResponseSchema>;

// Signup (membuat akun baru). Mulai tanpa tenant.
export const signupRequestSchema = z.object({
  username: z
    .string()
    .trim()
    .min(4, { error: "USERNAME_MIN_LENGTH" })
    .max(50, { error: "USERNAME_MAX_LENGTH" })
    .regex(/^[a-zA-Z0-9_.-]+$/, { error: "USERNAME_INVALID_CHARS" }),
  email: z.string().trim().email({ error: "INVALID_EMAIL" }),
  password: z
    .string()
    .min(6, { error: "PASSWORD_MIN_LENGTH" })
    .max(72, { error: "PASSWORD_MAX_LENGTH" })
    .regex(/[a-z]/, { error: "PASSWORD_LOWERCASE" })
    .regex(/[A-Z]/, { error: "PASSWORD_UPPERCASE" })
    .regex(/[0-9]/, { error: "PASSWORD_NUMBER" })
    .regex(/[^a-zA-Z0-9]/, { error: "PASSWORD_HAS_SPECIAL_CHAR" }),
  // Opsional: kosong/null/undefined diizinkan; jika diisi harus 10-15 digit angka.
  phone: z
    .string()
    .trim()
    .nullable()
    .optional()
    .refine((v) => !v || v.length >= 10, { error: "PHONE_MIN_LENGTH" })
    .refine((v) => !v || v.length <= 15, { error: "PHONE_MAX_LENGTH" })
    .refine((v) => !v || /^[0-9]+$/.test(v), { error: "PHONE_NUMERIC" }),
  timezone: z.string().optional(),
});

export type SignupRequest = z.infer<typeof signupRequestSchema>;

// Signin: identifier bisa berupa email / username.
export const signinRequestSchema = z.object({
  identifier: z.string().trim().min(1, { error: "IDENTIFIER_REQUIRED" }),
  password: z.string().min(1, { error: "PASSWORD_REQUIRED" }),
});

export type SigninRequest = z.infer<typeof signinRequestSchema>;

// Respons logout sederhana.
export const logoutResponseSchema = z.object({
  message: z.string(),
});

export type LogoutResponse = z.infer<typeof logoutResponseSchema>;

// ForgotPassword: identifier bisa berupa email / username/
export const forgotPasswordRequestSchema = z.object({
  identifier: z.string().trim().min(1, { error: "IDENTIFIER_REQUIRED" }),
});

export type ForgotPasswordRequest = z.infer<typeof forgotPasswordRequestSchema>;

// ResetPassword
export const resetPasswordRequestSchema = z.object({
  token: z.string().trim().min(1, { error: "TOKEN_REQUIRED" }),
  password: z
    .string()
    .min(6, { error: "PASSWORD_MIN_LENGTH" })
    .max(72, { error: "PASSWORD_MAX_LENGTH" })
    .regex(/[a-z]/, { error: "PASSWORD_LOWERCASE" })
    .regex(/[A-Z]/, { error: "PASSWORD_UPPERCASE" })
    .regex(/[0-9]/, { error: "PASSWORD_NUMBER" })
    .regex(/[^a-zA-Z0-9]/, { error: "PASSWORD_HAS_SPECIAL_CHAR" }),
  confirmPassword: z
    .string()
    .min(6, { error: "CONFIRM_PASSWORD_MIN_LENGTH" })
    .max(72, { error: "CONFIRM_PASSWORD_MAX_LENGTH" })
    .regex(/[a-z]/, { error: "CONFIRM_PASSWORD_LOWERCASE" })
    .regex(/[A-Z]/, { error: "CONFIRM_PASSWORD_UPPERCASE" })
    .regex(/[0-9]/, { error: "CONFIRM_PASSWORD_NUMBER" })
    .regex(/[^a-zA-Z0-9]/, { error: "CONFIRM_PASSWORD_HAS_SPECIAL_CHAR" }),
});

export type ResetPasswordRequest = z.infer<typeof resetPasswordRequestSchema>;

// ---------------------------------------------------------------------------
// Verifikasi email
// ---------------------------------------------------------------------------

// Kode verifikasi 6 karakter (alfanumerik) dari email.
export const verifyEmailRequestSchema = z.object({
  token: z
    .string()
    .trim()
    .min(1, { error: "TOKEN_REQUIRED" })
    .max(12, { error: "TOKEN_INVALID" }),
});

export type VerifyEmailRequest = z.infer<typeof verifyEmailRequestSchema>;

// Kirim ulang kode verifikasi; target email diambil dari sesi aktif, jadi
// klien tidak perlu (dan tidak boleh) menentukan alamat emailnya sendiri.
export const resendVerificationRequestSchema = z.object({}).optional();

export type ResendVerificationRequest = z.infer<
  typeof resendVerificationRequestSchema
>;

// Respons aksi verifikasi — selalu memuat status terbaru agar klien bisa
// langsung memperbarui UI (banner "email belum diverifikasi").
export const verifyEmailResponseSchema = z.object({
  message: z.string(),
  isVerified: z.boolean(),
});

export type VerifyEmailResponse = z.infer<typeof verifyEmailResponseSchema>;

// Respons kirim ulang kode.
export const resendVerificationResponseSchema = z.object({
  message: z.string(),
  // Kapan kode terakhir dikirim — klien memakainya untuk cooldown UI.
  sentAt: z.string(),
});

export type ResendVerificationResponse = z.infer<
  typeof resendVerificationResponseSchema
>;
