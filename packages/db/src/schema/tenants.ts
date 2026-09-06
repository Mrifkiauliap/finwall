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
import { softDelete, timestamps, tzTimestamp } from "./_helpers";
import { users } from "./users";

export const tenantRoleEnum = pgEnum("tenant_role", [
  "owner",
  "admin",
  "member",
  "viewer",
]);

// Tenant
export const tenants = pgTable(
  "tenants",
  {
    id: integer("id").generatedAlwaysAsIdentity().primaryKey(),
    publicId: uuid("public_id").defaultRandom().notNull().unique(),
    name: text("name").notNull(),
    // logoUrl: text("logo_url"),
    // websiteUrl: text("website_url"),
    // timezone: text("timezone").default("Asia/Jakarta").notNull(),
    // isActive: boolean("is_active").default(true).notNull(),
    // isVerified: boolean("is_verified").default(false).notNull(),
    // isPremium: boolean("is_premium").default(false).notNull(),
    // isFreeTrialActive: boolean("is_free_trial_active").default(false).notNull(),
    // freeTrialEndAt: tzTimestamp("free_trial_end_at"),
    // trialPlanId: text("trial_plan_id"),
    // isSubscriptionActive: boolean("is_subscription_active").default(false).notNull(),
    // subscriptionStatus: text("subscription_status"),
    // subscriptionPlanId: text("subscription_plan_id"),
    // subscriptionCurrentPeriodStart: tzTimestamp("subscription_current_period_start"),
    // subscriptionCurrentPeriodEnd: tzTimestamp("subscription_current_period_end"),
    // subscriptionNextPeriodStart: tzTimestamp("subscription_next_period_start"),
    // subscriptionNextPeriodEnd: tzTimestamp("subscription_next_period_end"),
    // subscriptionCancelAtPeriodEnd: boolean("subscription_cancel_at_period_end"),
    ...timestamps(),
    ...softDelete(),
  },
  (t) => [
    uniqueIndex("uq_tenants_name")
      .on(t.name)
      .where(sql`${t.deletedAt} IS NULL`),
  ],
);

// Tenant <-> User junction table.
export const tenantUsers = pgTable(
  "tenant_users",
  {
    id: integer("id").generatedAlwaysAsIdentity().primaryKey(),
    tenantId: integer("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: tenantRoleEnum("role").notNull().default("member"),
    createdAt: tzTimestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    index("idx_tenant_users_user_id").on(t.userId),
    uniqueIndex("uq_tenant_users_tenant_id_user_id").on(t.tenantId, t.userId),
  ],
);

export type Tenant = typeof tenants.$inferSelect;
export type NewTenant = typeof tenants.$inferInsert;
export type TenantUser = typeof tenantUsers.$inferSelect;
export type NewTenantUser = typeof tenantUsers.$inferInsert;
