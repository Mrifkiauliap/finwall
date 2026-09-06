// packages/db/src/schema/_helpers.ts
import { timestamp } from "drizzle-orm/pg-core";

export const tzTimestamp = (name: string) =>
  timestamp(name, { withTimezone: true });

export const timestamps = () => ({
  createdAt: tzTimestamp("created_at").defaultNow().notNull(),
  updatedAt: tzTimestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdateFn(() => new Date()),
});

export const softDelete = () => ({
  deletedAt: tzTimestamp("deleted_at"), // nullable, ga ada default
});
