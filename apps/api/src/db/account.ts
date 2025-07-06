import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { z } from "zod/v4";
import { createInsertSchema, createSelectSchema, createUpdateSchema } from "./common";
import { user } from "./user";

export const account = sqliteTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: integer("access_token_expires_at", {
      mode: "timestamp",
    }),
    refreshTokenExpiresAt: integer("refresh_token_expires_at", {
      mode: "timestamp",
    }),
    scope: text("scope"),
    password: text("password"),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  },
  (t) => [index("user_account_id_index").on(t.userId)],
);

export const Account = createSelectSchema(account, {
  accountId: z.string().trim().min(1),
  providerId: z.string().trim().min(1),
});
export const AccountInsert = createInsertSchema(account, {
  accountId: z.string().trim().min(1),
  providerId: z.string().trim().min(1),
});
export const AccountUpdate = createUpdateSchema(account, {
  accountId: z.string().trim().min(1),
  providerId: z.string().trim().min(1),
});
