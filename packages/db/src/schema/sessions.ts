import { index, integer, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { timestamps, tzTimestamp } from "./_helpers";
import { users } from "./users";

// Session user per-device (source of truth). Refresh token disimpan sebagai
// SHA-256 hash, bukan plaintext, supaya bisa di-rotate/revoke per device.
// Untuk hot-check per-request, row aktif ini di-mirror ke Valkey
// (`session:{publicId}`) — lihat packages/cache/src/session-store.ts.
export const sessions = pgTable(
  "sessions",
  {
    id: integer("id").generatedAlwaysAsIdentity().primaryKey(),
    publicId: uuid("public_id").defaultRandom().notNull().unique(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    // Tenant aktif utk session ini; null sampai pemilihan workspace ada.
    tenantId: uuid("tenant_id"),
    refreshTokenHash: text("refresh_token_hash").notNull().unique(),
    userAgent: text("user_agent"),
    ipAddress: text("ip_address"),
    device: text("device"),
    lastActiveAt: tzTimestamp("last_active_at").notNull(),
    expiresAt: tzTimestamp("expires_at").notNull(),
    revokedAt: tzTimestamp("revoked_at"),
    ...timestamps(),
  },
  (t) => [
    index("idx_sessions_user_id").on(t.userId),
    index("idx_sessions_expires_at").on(t.expiresAt),
  ],
);

export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
