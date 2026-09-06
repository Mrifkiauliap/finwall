import { z } from "zod";

// Shape user aman yang dikirim ke klien — tidak pernah berisi secret/hash.
// Error memakai APPLICATION code (bukan issue.code internal Zod).
export const currentUserSchema = z.object({
  publicId: z.string().uuid({ error: "INVALID_UUID" }),
  username: z.string().min(1, { error: "USERNAME_REQUIRED" }),
  email: z.string().email({ error: "INVALID_EMAIL" }),
  phone: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  timezone: z.string(),
  isActive: z.boolean(),
});

export type CurrentUser = z.infer<typeof currentUserSchema>;

// Principal yang ditempelkan JwtStrategy ke `request.user` setelah autentikasi.
export const authenticatedUserSchema = currentUserSchema.extend({
  id: z.number().int(),
  sessionId: z.string().uuid({ error: "INVALID_UUID" }),
  tenantId: z.string().uuid({ error: "INVALID_UUID" }).nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type AuthenticatedUser = z.infer<typeof authenticatedUserSchema>;
