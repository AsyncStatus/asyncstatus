import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { z } from "zod/v4";
import { createInsertSchema, createSelectSchema, createUpdateSchema } from "./common";

export const verification = sqliteTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
    createdAt: integer("created_at", { mode: "timestamp" }),
    updatedAt: integer("updated_at", { mode: "timestamp" }),
  },
  (t) => [index("identifier_verification_index").on(t.identifier)],
);

export const Verification = createSelectSchema(verification, {
  identifier: z.string().trim().min(1),
  value: z.string().trim().min(1),
});
export const VerificationInsert = createInsertSchema(verification, {
  identifier: z.string().trim().min(1),
  value: z.string().trim().min(1),
});
export const VerificationUpdate = createUpdateSchema(verification, {
  identifier: z.string().trim().min(1),
  value: z.string().trim().min(1),
});
