import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { z } from "zod/v4";
import { createInsertSchema, createSelectSchema, createUpdateSchema } from "./common";

export const jwks = sqliteTable("jwks", {
  id: text("id").primaryKey(),
  publicKey: text("public_key").notNull(),
  privateKey: text("private_key").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const Jwks = createSelectSchema(jwks, {
  id: z.string().min(1),
  publicKey: z.string().min(1),
  privateKey: z.string().min(1),
});
export type Jwks = z.output<typeof Jwks>;

export const JwksInsert = createInsertSchema(jwks, {
  id: z.string().min(1),
  publicKey: z.string().min(1),
  privateKey: z.string().min(1),
});
export type JwksInsert = z.output<typeof JwksInsert>;

export const JwksUpdate = createUpdateSchema(jwks, {
  id: z.string().min(1),
  publicKey: z.string().min(1),
  privateKey: z.string().min(1),
});
export type JwksUpdate = z.output<typeof JwksUpdate>;
