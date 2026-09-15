import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { softDelete, timestamps, tzTimestamp } from "./_helpers";

// User
export const users = pgTable(
  "users",
  {
    id: integer("id").generatedAlwaysAsIdentity().primaryKey(),
    publicId: uuid("public_id").defaultRandom().notNull().unique(),
    avatarUrl: text("avatar_url"),
    username: text("username").notNull(),
    phone: text("phone"),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    timezone: text("timezone").default("Asia/Jakarta").notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    isVerified: boolean("is_verified").default(false).notNull(),
    emailVerifiedAt: tzTimestamp("email_verified_at"),
    ...timestamps(),
    ...softDelete(),
  },
  (t) => [
    uniqueIndex("uq_users_username")
      .on(t.username)
      .where(sql`${t.deletedAt} IS NULL`),
    uniqueIndex("uq_users_email")
      .on(t.email)
      .where(sql`${t.deletedAt} IS NULL`),
    uniqueIndex("uq_users_phone")
      .on(t.phone)
      .where(sql`${t.deletedAt} IS NULL`),
  ],
);

// Sessions ada di packages/db/src/schema/sessions.ts (durable source of truth,
// per-device, hashed refresh token) + di-mirror ke Valkey utk hot check
// per-request. Detail implementasi ada di packages/cache/src/session-store.ts.

export const userPasswordResets = pgTable(
  "user_password_resets",
  {
    id: integer("id").generatedAlwaysAsIdentity().primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull().unique(),
    expiresAt: tzTimestamp("expires_at").notNull(),
    usedAt: tzTimestamp("used_at"),
    createdAt: tzTimestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("idx_user_password_resets_token_hash").on(t.tokenHash)],
);

export const userEmailVerifications = pgTable(
  "user_email_verifications",
  {
    id: integer("id").generatedAlwaysAsIdentity().primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull().unique(),
    expiresAt: tzTimestamp("expires_at").notNull(),
    usedAt: tzTimestamp("used_at"),
    createdAt: tzTimestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("idx_user_email_verifications_token_hash").on(t.tokenHash)],
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
