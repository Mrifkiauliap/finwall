import { sql } from "drizzle-orm";
import {
  boolean,
  date,
  integer,
  pgEnum,
  pgTable,
  text,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { softDelete, timestamps, tzTimestamp } from "./_helpers";
import { categories } from "./accounts";
import { tenants } from "./tenants";

export const budgetPeriodEnum = pgEnum("budget_period", [
  "daily",
  "weekly",
  "monthly",
]);

export const budgets = pgTable(
  "budgets",
  {
    id: integer("id").generatedAlwaysAsIdentity().primaryKey(),
    publicId: uuid("public_id").defaultRandom().notNull().unique(),
    tenantId: integer("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    amount: integer("amount").notNull(),
    currency: text("currency").notNull(),
    period: budgetPeriodEnum("period").notNull(),
    startDate: date("start_date").notNull(),
    endDate: date("end_date").notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    ...timestamps(),
    ...softDelete(),
  },
  (t) => [
    uniqueIndex("uq_budgets_tenant_name")
      .on(t.tenantId, t.name)
      .where(sql`${t.deletedAt} IS NULL`),
  ],
);

export const budgetCategories = pgTable("budget_categories", {
  id: integer("id").generatedAlwaysAsIdentity().primaryKey(),
  budgetId: integer("budget_id")
    .notNull()
    .references(() => budgets.id, { onDelete: "cascade" }),
  categoryId: integer("category_id")
    .notNull()
    .references(() => categories.id, { onDelete: "cascade" }),
  createdAt: tzTimestamp("created_at").defaultNow().notNull(),
});

export type Budgets = typeof budgets.$inferSelect;
export type NewBudgets = typeof budgets.$inferInsert;
