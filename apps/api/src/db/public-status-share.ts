import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { z } from "zod/v4";
import { createInsertSchema, createSelectSchema, createUpdateSchema } from "./common";
import { organization } from "./organization";
import { statusUpdate } from "./status-update";

export const publicStatusShare = sqliteTable(
  "public_status_share",
  {
    id: text("id").primaryKey(),
    statusUpdateId: text("status_update_id")
      .notNull()
      .references(() => statusUpdate.id, { onDelete: "cascade" }),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    slug: text("slug").notNull().unique(),
    isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
    expiresAt: integer("expires_at", { mode: "timestamp" }),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  },
  (t) => [
    index("public_share_status_update_id_index").on(t.statusUpdateId),
    index("public_share_organization_id_index").on(t.organizationId),
    index("public_share_slug_index").on(t.slug),
    index("public_share_is_active_index").on(t.isActive),
  ],
);

export const PublicStatusShare = createSelectSchema(publicStatusShare, {
  slug: z.string().trim().min(1),
});
export type PublicStatusShare = z.output<typeof PublicStatusShare>;
export const PublicStatusShareInsert = createInsertSchema(publicStatusShare, {
  slug: z.string().trim().min(1),
});
export type PublicStatusShareInsert = z.output<typeof PublicStatusShareInsert>;
export const PublicStatusShareUpdate = createUpdateSchema(publicStatusShare, {
  slug: z.string().trim().min(1),
});
export type PublicStatusShareUpdate = z.output<typeof PublicStatusShareUpdate>;
