import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { z } from "zod/v4";
import { createInsertSchema, createSelectSchema, createUpdateSchema } from "./common";
import { organization } from "./organization";
import { user } from "./user";

export const memberRole = z.enum(["member", "admin", "owner"]);
export type MemberRole = z.infer<typeof memberRole>;

export const member = sqliteTable(
  "member",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    role: text("role").notNull().$type<MemberRole>(),
    githubId: text("github_id"),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    archivedAt: integer("archived_at", { mode: "timestamp" }),
  },
  (t) => [
    index("organization_member_id_index").on(t.organizationId),
    index("user_member_id_index").on(t.userId),
    index("member_github_id_index").on(t.githubId),
  ],
);

export const Member = createSelectSchema(member, {
  role: memberRole,
});
export const MemberInsert = createInsertSchema(member, {
  role: memberRole,
});
export const MemberUpdate = createUpdateSchema(member, {
  role: memberRole,
});
