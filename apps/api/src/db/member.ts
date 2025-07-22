import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { z } from "zod/v4";
import { createInsertSchema, createSelectSchema, createUpdateSchema } from "./common";
import { organization } from "./organization";
import { user } from "./user";

export const MemberRole = z.enum(["member", "admin", "owner"]);
export type MemberRole = z.infer<typeof MemberRole>;

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
    slackId: text("slack_id"),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    archivedAt: integer("archived_at", { mode: "timestamp" }),
  },
  (t) => [
    index("organization_member_id_index").on(t.organizationId),
    index("user_member_id_index").on(t.userId),
    index("member_github_id_index").on(t.githubId),
    index("member_slack_id_index").on(t.slackId),
  ],
);

export const Member = createSelectSchema(member, {
  role: MemberRole,
});
export type Member = z.output<typeof Member>;
export const MemberInsert = createInsertSchema(member, {
  role: MemberRole,
});
export type MemberInsert = z.output<typeof MemberInsert>;
export const MemberUpdate = createUpdateSchema(member, {
  role: MemberRole,
});
export type MemberUpdate = z.output<typeof MemberUpdate>;
