import {
  AnyPgColumn,
  boolean,
  check,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm/sql/sql";
import { softDelete, timestamps, tzTimestamp } from "./_helpers";
import { tenants } from "./tenants";

export const accountTypeEnum = pgEnum("account_type", [
  "cash",
  "bank",
  "e_wallet",
  "investment",
  "other",
]);

export const accountTransactionTypeEnum = pgEnum("account_transaction_type", [
  "income",
  "expense",
  "transfer_in",
  "transfer_out",
]);

export const accountTransactionStatusEnum = pgEnum(
  "account_transaction_status",
  ["pending", "completed", "failed"],
);

export const categoriesTypeEnum = pgEnum("categories_type", [
  "income",
  "expense",
]);

export const accounts = pgTable(
  "accounts",
  {
    id: integer("id").generatedAlwaysAsIdentity().primaryKey(),
    publicId: uuid("public_id").defaultRandom().notNull().unique(),
    tenantId: integer("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    type: accountTypeEnum("type").notNull(),
    currency: text("currency").notNull(),
    initialBalance: integer("initial_balance").default(0).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    ...timestamps(),
    ...softDelete(),
  },
  (t) => [
    uniqueIndex("uq_accounts_tenant_name")
      .on(t.tenantId, t.name)
      .where(sql`${t.deletedAt} IS NULL`),
  ],
);

export const accountTransactions = pgTable(
  "account_transactions",
  {
    id: integer("id").generatedAlwaysAsIdentity().primaryKey(),
    publicId: uuid("public_id").defaultRandom().notNull().unique(),
    tenantId: integer("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    accountId: integer("account_id")
      .notNull()
      .references(() => accounts.id, { onDelete: "restrict" }),
    type: accountTransactionTypeEnum("type").notNull(),
    description: text("description"),
    amount: integer("amount").notNull(),
    feeAmount: integer("fee_amount").default(0).notNull(),
    categoryId: integer("category_id").references(() => categories.id, {
      onDelete: "set null",
    }),
    merchantId: integer("merchant_id").references(() => merchants.id, {
      onDelete: "set null",
    }),
    status: accountTransactionStatusEnum("status").default("pending").notNull(),
    transactionAt: tzTimestamp("transaction_at").notNull(),
    ...timestamps(),
    ...softDelete(),
  },
  (t) => [
    index("idx_account_transactions_tenant_account").on(
      t.tenantId,
      t.accountId,
    ),
    index("idx_account_transactions_tenant_transaction_at").on(
      t.tenantId,
      t.transactionAt,
    ),
  ],
);

export const accountTransfers = pgTable(
  "account_transfers",
  {
    id: integer("id").generatedAlwaysAsIdentity().primaryKey(),
    publicId: uuid("public_id").defaultRandom().notNull().unique(),
    tenantId: integer("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    transactionId: integer("transaction_id")
      .notNull()
      .references(() => accountTransactions.id, { onDelete: "restrict" }),
    fromAccountId: integer("from_account_id")
      .notNull()
      .references(() => accounts.id, {
        onDelete: "restrict",
      }),
    toAccountId: integer("to_account_id")
      .notNull()
      .references(() => accounts.id, {
        onDelete: "restrict",
      }),
    amount: integer("amount").notNull(),
    feeAmount: integer("fee_amount").default(0).notNull(),
    ...timestamps(),
    ...softDelete(),
  },
  (t) => [
    index("idx_account_transfers_tenant_id").on(t.tenantId),
    index("idx_account_transfers_from_account_id").on(t.fromAccountId),
    index("idx_account_transfers_to_account_id").on(t.toAccountId),
  ],
);

export const transactionEntries = pgTable(
  "transaction_entries",
  {
    id: integer("id").generatedAlwaysAsIdentity().primaryKey(),
    publicId: uuid("public_id").defaultRandom().notNull().unique(),
    transactionId: integer("transaction_id")
      .notNull()
      .references(() => accountTransactions.id, {
        onDelete: "cascade",
      }),
    debit: integer("debit").default(0).notNull(),
    credit: integer("credit").default(0).notNull(),
    ...timestamps(),
    ...softDelete(),
  },
  (t) => [
    index("idx_transaction_entries_transaction_id").on(t.transactionId),
    check("chk_transaction_entries_debit_non_negative", sql`${t.debit} >= 0`),
    check("chk_transaction_entries_credit_non_negative", sql`${t.credit} >= 0`),
    check(
      "chk_transaction_entries_debit_or_credit",
      sql`(${t.debit} > 0 AND ${t.credit} = 0)
          OR (${t.credit} > 0 AND ${t.debit} = 0)`,
    ),
  ],
);

export const revertedTransactions = pgTable(
  "reverted_transactions",
  {
    id: integer("id").generatedAlwaysAsIdentity().primaryKey(),
    publicId: uuid("public_id").defaultRandom().notNull().unique(),
    transactionId: integer("transaction_id")
      .notNull()
      .references(() => accountTransactions.id, {
        onDelete: "restrict",
      }),
    revertedAt: tzTimestamp("reverted_at").notNull(),
    ...timestamps(),
    ...softDelete(),
  },
  (t) => [
    index("idx_reverted_transactions_transaction_id").on(t.transactionId),
  ],
);

export const categories = pgTable(
  "categories",
  {
    id: integer("id").generatedAlwaysAsIdentity().primaryKey(),
    publicId: uuid("public_id").defaultRandom().notNull().unique(),
    tenantId: integer("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    parentId: integer("parent_id").references(
      (): AnyPgColumn => categories.id,
      {
        onDelete: "restrict",
      },
    ),
    name: text("name").notNull(),
    type: categoriesTypeEnum("type").notNull(),
    icon: text("icon").notNull(),
    color: text("color").notNull(),
    ...timestamps(),
    ...softDelete(),
  },
  (t) => [
    uniqueIndex("uq_categories_tenant_name")
      .on(t.tenantId, t.name)
      .where(sql`${t.deletedAt} IS NULL`),
  ],
);

export const tags = pgTable(
  "tags",
  {
    id: integer("id").generatedAlwaysAsIdentity().primaryKey(),
    publicId: uuid("public_id").defaultRandom().notNull().unique(),
    tenantId: integer("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    color: text("color").notNull(),
    ...timestamps(),
    ...softDelete(),
  },
  (t) => [
    uniqueIndex("uq_tags_tenant_name")
      .on(t.tenantId, t.name)
      .where(sql`${t.deletedAt} IS NULL`),
  ],
);

export const transactionTags = pgTable(
  "transaction_tags",
  {
    id: integer("id").generatedAlwaysAsIdentity().primaryKey(),
    publicId: uuid("public_id").defaultRandom().notNull().unique(),
    transactionId: integer("transaction_id")
      .notNull()
      .references(() => accountTransactions.id, { onDelete: "cascade" }),
    tagId: integer("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex("uq_transaction_tags_transaction_id_tag_id").on(
      t.transactionId,
      t.tagId,
    ),
  ],
);

export const merchants = pgTable(
  "merchants",
  {
    id: integer("id").generatedAlwaysAsIdentity().primaryKey(),
    publicId: uuid("public_id").defaultRandom().notNull().unique(),
    tenantId: integer("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    ...timestamps(),
    ...softDelete(),
  },
  (t) => [
    uniqueIndex("uq_merchants_tenant_name")
      .on(t.tenantId, t.name)
      .where(sql`${t.deletedAt} IS NULL`),
  ],
);
