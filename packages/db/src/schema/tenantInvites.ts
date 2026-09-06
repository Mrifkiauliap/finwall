import { sql } from "drizzle-orm";
import {
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { timestamps, tzTimestamp } from "./_helpers";
import { tenantRoleEnum, tenants } from "./tenants";
import { users } from "./users";

export const tenantInviteStatusEnum = pgEnum("tenant_invite_status", [
  "pending",
  "accepted",
  "rejected",
]);

// Undangan bergabung ke tenant.
// - Terbuka: inviteeEmail null, kode dibagikan ke siapa pun.
// - By email: inviteeEmail terisi, status pending sampai diterima/ditolak.
// Kode disimpan sebagai HASH (codeHash), dikirim sekali ke pemilik.
export const tenantInvites = pgTable(
  "tenant_invites",
  {
    id: integer("id").generatedAlwaysAsIdentity().primaryKey(),
    publicId: uuid("public_id").defaultRandom().notNull().unique(),
    tenantId: integer("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    invitedById: integer("invited_by_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    inviteeEmail: text("invitee_email"),
    codeHash: text("code_hash"),
    role: tenantRoleEnum("role").default("member").notNull(),
    status: tenantInviteStatusEnum("status").default("pending").notNull(),
    expiresAt: tzTimestamp("expires_at"),
    ...timestamps(),
  },
  (t) => [
    index("idx_tenant_invites_tenant_id").on(t.tenantId),
    index("idx_tenant_invites_invitee_email").on(t.inviteeEmail),
    // Satu undangan terbuka (kode) aktif per tenant.
    uniqueIndex("uq_tenant_invites_tenant_code")
      .on(t.tenantId, t.codeHash)
      .where(sql`${t.codeHash} IS NOT NULL AND ${t.status} = 'pending'`),
  ],
);

export type TenantInvite = typeof tenantInvites.$inferSelect;
export type NewTenantInvite = typeof tenantInvites.$inferInsert;
