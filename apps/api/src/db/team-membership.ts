import { index, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { z } from "zod/v4";
import { createInsertSchema, createSelectSchema, createUpdateSchema } from "./common";
import { member } from "./member";
import { team } from "./team";

export const teamMembership = sqliteTable(
  "team_membership",
  {
    id: text("id").primaryKey(),
    teamId: text("team_id")
      .notNull()
      .references(() => team.id, { onDelete: "cascade" }),
    memberId: text("member_id")
      .notNull()
      .references(() => member.id, { onDelete: "cascade" }),
  },
  (t) => [
    index("team_members_team_id_index").on(t.teamId),
    index("team_members_member_id_index").on(t.memberId),
  ],
);

export const TeamMembership = createSelectSchema(teamMembership, {
  teamId: z.string().trim().min(1),
  memberId: z.string().trim().min(1),
});
export type TeamMembership = z.output<typeof TeamMembership>;
export const TeamMembershipInsert = createInsertSchema(teamMembership, {
  teamId: z.string().trim().min(1),
  memberId: z.string().trim().min(1),
});
export type TeamMembershipInsert = z.output<typeof TeamMembershipInsert>;
export const TeamMembershipUpdate = createUpdateSchema(teamMembership, {
  teamId: z.string().trim().min(1),
  memberId: z.string().trim().min(1),
});
export type TeamMembershipUpdate = z.output<typeof TeamMembershipUpdate>;
