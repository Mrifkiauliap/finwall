import { z } from "zod";
import { tenantRoleSchema } from "./tenant.js";
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
// sub = users.id (numeric, string), sessionId = sessions.publicId,
// tenantId = tenant aktif (uuid publicId, nullable), tokenType membedakan jenis.
export const jwtPayloadSchema = z.object({
  sub: z.string(),
  tenantId: z.string().uuid({ error: "INVALID_UUID" }).nullable(),
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
    .min(4, { error: "USERNAME_TOO_SHORT" })
    .max(50, { error: "USERNAME_TOO_LONG" })
    .regex(/^[a-zA-Z0-9_.-]+$/, { error: "USERNAME_INVALID_CHARS" }),
  email: z.string().trim().email({ error: "INVALID_EMAIL" }),
  password: z
    .string()
    .min(6, { error: "PASSWORD_TOO_SHORT" })
    .max(72, { error: "PASSWORD_TOO_LONG" })
    .regex(/[a-z]/, { error: "PASSWORD_REQUIREMENTS" })
    .regex(/[A-Z]/, { error: "PASSWORD_REQUIREMENTS" })
    .regex(/[0-9]/, { error: "PASSWORD_REQUIREMENTS" })
    .regex(/[^a-zA-Z0-9]/, { error: "PASSWORD_REQUIREMENTS" }),
  phone: z.string().nullable().optional(),
  timezone: z.string().optional(),
});

export type SignupRequest = z.infer<typeof signupRequestSchema>;

// Signin: identifier bisa berupa email / username / nomor telepon.
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
